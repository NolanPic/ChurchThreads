import { v } from "convex/values";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";
import { Id, Doc } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { sendNotifications } from "./notifications";
import { createClerkClient } from "@clerk/backend";
import { validateEmailField, validateTextField, ValidationError } from "@/validation";

const INVITE_INVALID_ERROR = "Invalid invite link";
const INVITE_EXPIRED_ERROR = "This invite has expired. Please reach out to your church.";

/**
 * Look up an invite by token to get pre-population data for the registration form
 */
export const lookupInviteByToken = query({
  args: {
    token: v.string(),
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_token_and_org", (q) =>
        q.eq("token", args.token).eq("orgId", args.orgId),
      )
      .first();

    if (!invite) {
      return { error: INVITE_INVALID_ERROR };
    }

    if (hasInviteExpired(invite)) {
      return { error: INVITE_EXPIRED_ERROR };
    }

    return {
      email: invite.email,
      name: invite.name,
    };
  },
});

/**
 * Internal mutation to create the Convex user record
 */
export const createConvexUser = internalMutation({
  args: {
    email: v.string(),
    name: v.string(),
    orgId: v.id("organizations"),
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_org_and_email", (q) =>
        q.eq("orgId", args.orgId).eq("email", args.email),
      )
      .first();

    if (existingUser) {
      throw new Error("An account with this email already exists");
    }

    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      orgId: args.orgId,
      clerkId: args.clerkId,
      role: "user",
      settings: {
        notifications: ["push", "email"],
      },
    });

    return userId;
  },
});

/**
 * Internal mutation to update the user's Clerk ID
 */
export const updateUserClerkId = internalMutation({
  args: {
    userId: v.id("users"),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      clerkId: args.clerkId,
    });
  },
});

/**
 * Internal mutation to delete a user (used for rollback)
 */
export const deleteUser = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.userId);
  },
});

/**
 * Internal mutation to create user feed memberships
 */
export const createUserFeeds = internalMutation({
  args: {
    userId: v.id("users"),
    feedIds: v.array(v.id("feeds")),
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    for (const feedId of args.feedIds) {
      await ctx.db.insert("userFeeds", {
        userId: args.userId,
        feedId: feedId,
        orgId: args.orgId,
        owner: false,
        updatedAt: now,
      });
    }
  },
});

/**
 * Internal mutation to update invite usage tracking
 */
export const updateInviteUsage = internalMutation({
  args: {
    inviteId: v.id("invites"),
  },
  handler: async (ctx, args) => {
    const invite = await ctx.db.get(args.inviteId);
    if (!invite) {
      throw new Error("Invite not found");
    }

    await ctx.db.patch(args.inviteId, {
      useCount: invite.useCount + 1,
      lastUsed: Date.now(),
    });
  },
});

/**
 * Internal action to handle the user creation (Convex + Clerk)
 */
export const registerUser = internalAction({
  args: {
    token: v.string(),
    name: v.string(),
    email: v.string(),
    orgId: v.id("organizations"),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; email: string }> => {
    if (!process.env.CLERK_SECRET_KEY) {
      throw new Error(
        "CLERK_SECRET_KEY environment variable is not set. "
      );
    }

    const { success, errors } = validateFields(args.name, args.email);

    if (!success) {
      throw new Error(errors[0].message);
    }

    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

    const invite = await ctx.runQuery(internal.registration.validateInvite, {
      token: args.token,
      email: args.email,
      orgId: args.orgId,
    });

    let userId: Id<"users"> | undefined;
    let clerkUserId: string | undefined;

    try {
      // Step 1: Create Convex user without Clerk ID
      userId = await ctx.runMutation(internal.registration.createConvexUser, {
        email: args.email,
        name: args.name,
        orgId: args.orgId,
      });

      // Step 2: Create Clerk user with external ID linking to Convex user
      const nameParts = args.name.split(" ");
      const firstName = nameParts[0] || args.name;
      const lastName = nameParts.slice(1).join(" ") || "";

      const clerkUser = await clerk.users.createUser({
        emailAddress: [args.email],
        firstName,
        lastName: lastName || undefined,
        externalId: userId,
        skipPasswordRequirement: true,
        skipPasswordChecks: true,
      });

      clerkUserId = clerkUser.id;

      // Step 3: Update Convex user with Clerk ID
      await ctx.runMutation(internal.registration.updateUserClerkId, {
        userId,
        clerkId: clerkUserId,
      });

      // Step 4: Create user feed memberships
      await ctx.runMutation(internal.registration.createUserFeeds, {
        userId,
        feedIds: invite.feeds,
        orgId: args.orgId,
      });

      // Step 5: Update invite usage
      await ctx.runMutation(internal.registration.updateInviteUsage, {
        inviteId: invite._id,
      });

      // Step 6: Send notification
      await ctx.runMutation(internal.registration.sendRegistrationNotification, {
        userId,
        inviteId: invite._id,
        orgId: args.orgId,
      });

      return { success: true, email: args.email };
    } catch (error) {
      console.error("Registration error:", error);

      if (userId && !clerkUserId) {
        // Cleanup: If we created Convex user but not Clerk user, delete Convex user
        try {
          await ctx.runMutation(internal.registration.deleteUser, { userId });
        } catch (rollbackError) {
          console.error("Failed to rollback Convex user:", rollbackError);
        }
      }

      // Re-throw the original error
      const errorMessage =
        error instanceof Error ? error.message : "Registration failed";
      throw new Error(errorMessage);
    }
  },
});

/**
 * Internal query to validate an invite
 */
export const validateInvite = internalQuery({
  args: {
    token: v.string(),
    email: v.string(),
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_token_and_org", (q) =>
        q.eq("token", args.token).eq("orgId", args.orgId),
      )
      .first();

    if (!invite) {
      throw new Error(INVITE_INVALID_ERROR);
    }

    if (hasInviteExpired(invite)) {
      throw new Error(INVITE_EXPIRED_ERROR);
    }

    if (invite.email && invite.email !== args.email) {
      throw new Error("This invite is for a different email address");
    }

    return invite;
  },
});

/**
 * Internal mutation to send registration notification
 */
export const sendRegistrationNotification = internalMutation({
  args: {
    userId: v.id("users"),
    inviteId: v.id("invites"),
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    await sendNotifications(ctx, args.orgId, "user_registration", {
      userId: args.userId,
      inviteId: args.inviteId,
    });
  },
});

/**
 * Public action to register a new user
 * This is an action (not mutation) because it needs to call the Clerk API
 */
export const register = action({
  args: {
    token: v.string(),
    name: v.string(),
    email: v.string(),
    orgId: v.id("organizations"),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; email: string }> => {
    return await ctx.runAction(internal.registration.registerUser, {
      token: args.token,
      name: args.name,
      email: args.email,
      orgId: args.orgId,
    });
  },
});

const hasInviteExpired = (invite: Doc<"invites">) => {
  const { useCount, maxUses, expiresAt } = invite;

  const inviteHasExpired = expiresAt && expiresAt < Date.now();
  const inviteHasReachedMaxUses = maxUses && useCount >= maxUses;

  if (inviteHasExpired || inviteHasReachedMaxUses) {
    return true;
  }
  return false;
}

const validateFields = (name: string, email: string) => {
  const nameValidation = validateTextField(
    name,
    {
      required: true,
      minLength: 4,
      maxLength: 25,
    },
    "Name"
  );

  let errors: ValidationError[] = [];

  if (!nameValidation.valid) {
    errors = errors.concat(nameValidation.errors);
  }

  const emailValidation = validateEmailField(
    email,
    {
      required: true,
    },
    "Email"
  );

  if (!emailValidation.valid) {
    errors = errors.concat(emailValidation.errors);
  }

  return { success: errors.length === 0, errors }

}