import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getUserAuth } from "@/auth/convex";

const DAY = 24 * 60 * 60 * 1000;

/**
 * Internal mutation to create an invitation record
 * Handles validation and DB insert
 */
export const createInvitationInternal = internalMutation({
  args: {
    orgId: v.id("organizations"),
    type: v.union(v.literal("email"), v.literal("link")),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    feeds: v.array(v.id("feeds")),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const { orgId, type, name, email, feeds, token } = args;

    const auth = await getUserAuth(ctx, orgId);
    const user = auth.getUserOrThrow();

    // If email provided, check no user exists with that email
    if (email) {
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_org_and_email", (q) =>
          q.eq("orgId", orgId).eq("email", email)
        )
        .first();

      if (existingUser) {
        throw new Error("A user with this email already exists in the organization");
      }

      // Check for existing pending invites for this email
      const existingInvite = await ctx.db
        .query("invites")
        .withIndex("by_org_and_email", (q) =>
          q.eq("orgId", orgId).eq("email", email)
        )
        .filter((q) => q.gt(q.field("expiresAt"), Date.now()))
        .first();

      if (existingInvite) {
        throw new Error("An active invite for this email already exists in the organization");
      }
    }

    // Validate feeds
    for (const feedId of feeds) {
      const feed = await ctx.db.get(feedId);

      if (!feed || feed.orgId !== orgId) {
        throw new Error(`Feed ${feedId} not found`);
      }

      // Check if user is admin or owner of the feed
      const isAdmin = auth.hasRole("admin").allowed;
      const isOwner = (await auth.feed(feedId).hasRole("owner")).allowed;

      if (!isAdmin && !isOwner) {
        throw new Error(
          `You must be an admin or owner of feed ${feed.name} to invite users to it`
        );
      }
    }

    // Create the invite
    const inviteId = await ctx.db.insert("invites", {
      orgId,
      type,
      name,
      email,
      feeds,
      token,
      createdBy: user._id,
      expiresAt: Date.now() + (type === "email" ? 3 * DAY : 1 * DAY),
      maxUses: type === "email" ? 1 : undefined,
      useCount: 0,
    });

    return inviteId;
  },
});
