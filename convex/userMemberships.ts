import { query, mutation, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { getUserAuth } from "@/auth/convex";
import { getStorageUrl } from "./uploads";
import { paginationOptsValidator } from "convex/server";
import { sendNotifications } from "./notifications";
import { getAll } from "convex-helpers/server/relationships";

function canUserViewFeed(args: {
  isAdmin: boolean;
  isMember: boolean;
  privacy: "public" | "private" | "open";
}): boolean {
  const { isAdmin, isMember, privacy } = args;
  if (isAdmin) {
    return true;
  }

  return isMember || privacy === "open" || privacy === "public";
}

/**
 * Helper function to check if a user is the last owner of a feed
 */
async function isLastOwner(
  ctx: QueryCtx,
  orgId: Id<"organizations">,
  feedId: Id<"feeds">,
  userId: Id<"users">,
): Promise<boolean> {
  const membership = await ctx.db
    .query("userFeeds")
    .withIndex("by_org_and_feed_and_user", (q) =>
      q.eq("orgId", orgId).eq("feedId", feedId).eq("userId", userId),
    )
    .first();

  if (!membership?.owner) {
    return false;
  }

  const allOwners = await ctx.db
    .query("userFeeds")
    .withIndex("by_org_and_feed_and_user", (q) =>
      q.eq("orgId", orgId).eq("feedId", feedId),
    )
    .filter((q) => q.eq(q.field("owner"), true))
    .collect();

  return allOwners.length === 1;
}

/**
 * Get paginated list of members for a feed
 * Feed owners and feed members can call this
 */
export const getFeedMembers = query({
  args: {
    orgId: v.id("organizations"),
    feedId: v.id("feeds"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const { orgId, feedId, paginationOpts } = args;

    const auth = await getUserAuth(ctx, orgId);
    auth.getUserOrThrow();

    const memberCheck = await auth.feed(feedId).hasRole("member");
    if (!memberCheck.allowed) {
      throw new Error(
        "You do not have permission to view members of this feed",
      );
    }

    const allUserFeeds = await ctx.db
      .query("userFeeds")
      .withIndex("by_org_and_feed_and_user", (q) =>
        q.eq("orgId", orgId).eq("feedId", feedId),
      )
      .collect();

    const membersWithDetails = await Promise.all(
      allUserFeeds.map(async (userFeed) => {
        const user = await ctx.db.get(userFeed.userId);
        if (!user) {
          return null;
        }

        const avatarUrl = await getStorageUrl(ctx, user.image);

        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          image: avatarUrl,
          isOwner: userFeed.owner,
        };
      }),
    );

    const filteredMembers = membersWithDetails.filter(
      (member) => member !== null,
    );

    const sortedMembers = filteredMembers.sort((a, b) => {
      // First sort by owner status
      if (a.isOwner !== b.isOwner) {
        return a.isOwner ? -1 : 1;
      }
      // Then sort by name
      return a.name.localeCompare(b.name);
    });

    // Manual pagination
    const { numItems, cursor } = paginationOpts;
    const offset = cursor ? parseInt(cursor, 10) : 0;
    const endIndex = offset + numItems;
    const page = sortedMembers.slice(offset, endIndex);
    const isDone = endIndex >= sortedMembers.length;
    const continueCursor = endIndex.toString();

    return {
      page,
      isDone,
      continueCursor,
    };
  },
});

/**
 * Get users NOT in a feed
 * Only feed owners can call this
 */
export const getUsersNotInFeed = query({
  args: {
    orgId: v.id("organizations"),
    feedId: v.id("feeds"),
  },
  handler: async (ctx, args) => {
    const { orgId, feedId } = args;

    const auth = await getUserAuth(ctx, orgId);
    auth.getUserOrThrow();

    const ownerCheck = await auth.feed(feedId).hasRole("owner");
    if (!ownerCheck.allowed) {
      throw new Error(
        "You do not have permission to invite users to this feed",
      );
    }

    const allUsers = await ctx.db
      .query("users")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .filter((q) => q.eq(q.field("deactivatedAt"), undefined))
      .collect();

    const userFeeds = await ctx.db
      .query("userFeeds")
      .withIndex("by_org_and_feed_and_user", (q) =>
        q.eq("orgId", orgId).eq("feedId", feedId),
      )
      .collect();

    const userIdsInFeed = new Set(userFeeds.map((uf) => uf.userId));

    const usersNotInFeed = allUsers.filter(
      (user) => !userIdsInFeed.has(user._id),
    );

    const usersWithAvatars = await Promise.all(
      usersNotInFeed.map(async (user) => {
        const avatarUrl = await getStorageUrl(ctx, user.image);
        return {
          _id: user._id,
          name: user.name,
          image: avatarUrl,
        };
      }),
    );

    return usersWithAvatars;
  },
});

/**
 * Invite users to a feed
 * Only feed owners can call this
 */
export const inviteUsersToFeed = mutation({
  args: {
    orgId: v.id("organizations"),
    feedId: v.id("feeds"),
    userIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { orgId, feedId, userIds } = args;

    const auth = await getUserAuth(ctx, orgId);
    auth.getUserOrThrow();

    const ownerCheck = await auth.feed(feedId).hasRole("owner");
    if (!ownerCheck.allowed) {
      throw new Error(
        "You do not have permission to invite users to this feed",
      );
    }

    const feed = await ctx.db.get(feedId);
    if (!feed) {
      throw new Error("Feed not found");
    }
    if (feed.orgId !== orgId) {
      throw new Error("Feed does not belong to this organization");
    }

    const now = Date.now();

    for (const userId of userIds) {
      const user = await ctx.db.get(userId);
      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }
      if (user.orgId !== orgId) {
        throw new Error(`User ${userId} does not belong to this organization`);
      }

      const existingMembership = await ctx.db
        .query("userFeeds")
        .withIndex("by_org_and_feed_and_user", (q) =>
          q.eq("orgId", orgId).eq("feedId", feedId).eq("userId", userId),
        )
        .first();

      if (existingMembership) {
        throw new Error(`User ${user.name} is already a member of this feed`);
      }

      await ctx.db.insert("userFeeds", {
        orgId,
        userId,
        feedId,
        owner: false,
        updatedAt: now,
      });

      // Send notifications for feed owners
      await sendNotifications(ctx, orgId, "new_feed_member", {
        userId,
        feedId,
      });
    }

    return { success: true, invitedCount: userIds.length };
  },
});

/**
 * Remove a member from a feed
 * Only feed owners can call this, unless the user is removing themselves
 * If no userId is supplied, removes the currently authenticated user
 */
export const removeMemberFromFeed = mutation({
  args: {
    orgId: v.id("organizations"),
    feedId: v.id("feeds"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const { orgId, feedId, userId } = args;

    const auth = await getUserAuth(ctx, orgId);
    const currentUser = auth.getUserOrThrow();

    const userToRemove = userId ?? currentUser._id;

    const isRemovingSelf = userToRemove === currentUser._id;

    if (!isRemovingSelf) {
      const ownerCheck = await auth.feed(feedId).hasRole("owner");
      if (!ownerCheck.allowed) {
        throw new Error(
          "You do not have permission to remove members from this feed",
        );
      }
    }

    const membershipToRemove = await ctx.db
      .query("userFeeds")
      .withIndex("by_org_and_feed_and_user", (q) =>
        q.eq("orgId", orgId).eq("feedId", feedId).eq("userId", userToRemove),
      )
      .first();

    if (!membershipToRemove) {
      throw new Error("User is not a member of this feed");
    }

    const isLast = await isLastOwner(ctx, orgId, feedId, userToRemove);
    if (isLast) {
      throw new Error(
        "Cannot remove the last owner from the feed. Please assign another owner first.",
      );
    }

    await ctx.db.delete(membershipToRemove._id);

    return { success: true };
  },
});

/**
 * Change a member's role (member <-> owner)
 * Only feed owners can call this
 */
export const changeMemberRole = mutation({
  args: {
    orgId: v.id("organizations"),
    feedId: v.id("feeds"),
    userId: v.id("users"),
    isOwner: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { orgId, feedId, userId, isOwner } = args;

    const auth = await getUserAuth(ctx, orgId);
    auth.getUserOrThrow();

    const ownerCheck = await auth.feed(feedId).hasRole("owner");
    if (!ownerCheck.allowed) {
      throw new Error(
        "You do not have permission to change member roles in this feed",
      );
    }

    const membership = await ctx.db
      .query("userFeeds")
      .withIndex("by_org_and_feed_and_user", (q) =>
        q.eq("orgId", orgId).eq("feedId", feedId).eq("userId", userId),
      )
      .first();

    if (!membership) {
      throw new Error("User is not a member of this feed");
    }

    if (membership.owner && !isOwner) {
      const isLast = await isLastOwner(ctx, orgId, feedId, userId);
      if (isLast) {
        throw new Error(
          "Cannot demote the last owner. Please assign another owner first.",
        );
      }
    }

    await ctx.db.patch(membership._id, {
      owner: isOwner,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Join an open or public feed
 * Only authenticated users can call this mutation
 */
export const joinOpenFeed = mutation({
  args: {
    orgId: v.id("organizations"),
    feedId: v.id("feeds"),
  },
  handler: async (ctx, args) => {
    const { orgId, feedId } = args;

    const auth = await getUserAuth(ctx, orgId);
    const user = auth.getUserOrThrow();

    // Get the feed
    const feed = await ctx.db.get(feedId);
    if (!feed) {
      throw new Error("Feed not found");
    }

    // Verify feed belongs to organization
    if (feed.orgId !== orgId) {
      throw new Error("Feed does not belong to this organization");
    }

    // Verify feed is open or public
    if (feed.privacy !== "open" && feed.privacy !== "public") {
      throw new Error("Can only join open or public feeds");
    }

    // Check if user is already a member
    const existingMembership = await ctx.db
      .query("userFeeds")
      .withIndex("by_org_and_feed_and_user", (q) =>
        q.eq("orgId", orgId).eq("feedId", feedId).eq("userId", user._id)
      )
      .first();

    if (existingMembership) {
      throw new Error("You are already a member of this feed");
    }

    // Create membership
    await ctx.db.insert("userFeeds", {
      orgId,
      userId: user._id,
      feedId,
      owner: false,
      updatedAt: Date.now(),
    });

    // Send notifications to feed owners
    await sendNotifications(ctx, orgId, "new_feed_member", {
      userId: user._id,
      feedId,
    });

    return { success: true };
  },
});

/**
 * Get member previews for multiple feeds at once.
 * Only authenticated users can call this query.
 * Standard users can view previews from:
 * - Feeds they are members of
 * - Open/public feeds in their organization
 * Admins can view all organization feeds.
 * Inaccessible/missing feeds are skipped and omitted from the result.
 * Returns up to 50 members per feed.
 */
export const getFeedMemberPreviews = query({
  args: {
    orgId: v.id("organizations"),
    feedIds: v.array(v.id("feeds")),
  },
  handler: async (ctx, args) => {
    const { orgId, feedIds } = args;

    const auth = await getUserAuth(ctx, orgId);
    const user = auth.getUserOrThrow();
    const isAdmin = auth.hasRole("admin").allowed;

    // Get all feeds and verify they belong to the organization
    const feeds = await getAll(ctx.db, feedIds);
    const userMemberships = !isAdmin
      ? await ctx.db
          .query("userFeeds")
          .withIndex("by_userId", (q) => q.eq("userId", user._id))
          .collect()
      : [];
    const memberFeedIds = new Set(
      userMemberships
        .filter((membership) => membership.orgId === orgId)
        .map((membership) => membership.feedId)
    );

    const result: Record<
      Id<"feeds">,
      Array<{
        _id: Id<"users">;
        name: string;
        email: string;
        image: string | null;
        isOwner: boolean;
      }>
    > = {};

    for (let i = 0; i < feedIds.length; i++) {
      const feedId = feedIds[i];
      const feed = feeds[i];

      if (!feed) {
        continue;
      }

      // Skip feeds outside the requested org
      if (feed.orgId !== orgId) {
        continue;
      }

      const isMember = memberFeedIds.has(feedId);
      const canView = canUserViewFeed({
        isAdmin,
        isMember,
        privacy: feed.privacy,
      });

      // Skip feeds the user is not allowed to view
      if (!canView) {
        continue;
      }

      // Get all user feeds for this feed
      const allUserFeeds = await ctx.db
        .query("userFeeds")
        .withIndex("by_org_and_feed_and_user", (q) =>
          q.eq("orgId", orgId).eq("feedId", feedId)
        )
        .collect();

      // Get member details
      const membersWithDetails = await Promise.all(
        allUserFeeds.map(async (userFeed) => {
          const user = await ctx.db.get(userFeed.userId);
          if (!user) {
            return null;
          }

          const avatarUrl = await getStorageUrl(ctx, user.image);

          return {
            _id: user._id,
            name: user.name,
            email: user.email,
            image: avatarUrl,
            isOwner: userFeed.owner,
          };
        })
      );

      const filteredMembers = membersWithDetails.filter(
        (member) => member !== null
      ) as Array<{
        _id: Id<"users">;
        name: string;
        email: string;
        image: string | null;
        isOwner: boolean;
      }>;

      // Sort by owner status first, then by name
      const sortedMembers = filteredMembers.sort((a, b) => {
        if (a.isOwner !== b.isOwner) {
          return a.isOwner ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      result[feedId] = sortedMembers.slice(0, 50);
    }

    return result;
  },
});
