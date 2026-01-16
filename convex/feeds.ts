import { query, QueryCtx, internalQuery, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { getManyFrom, getAll } from 'convex-helpers/server/relationships';
import { getUserAuth } from "@/auth/convex";
import { validateTextField } from "@/validation";
import { paginationOptsValidator } from "convex/server";

export const getUserFeeds = query({
  args: {
    orgId: v.id("organizations"),
    onlyIncludeFeedsUserCanPostIn: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { orgId, onlyIncludeFeedsUserCanPostIn } = args; 
    const auth = await getUserAuth(ctx, orgId);
    const user = auth.getUser();
    const publicFeeds = await getPublicFeeds(ctx, orgId);

    if (user) {
      const { feeds: feedsUserIsMemberOf } = await getUserFeedsWithMembershipsHelper(ctx, user._id);

      const publicFeedIds = new Set(publicFeeds.map(feed => feed._id));

      // Filter out feeds the user is a member of that are already in publicFeeds
      const uniqueFeedsUserIsMemberOf = feedsUserIsMemberOf.filter(
        feed => !publicFeedIds.has(feed._id)
      );

      let finalFeeds = [...publicFeeds, ...uniqueFeedsUserIsMemberOf]

      if(onlyIncludeFeedsUserCanPostIn) {
        const feedChecks = await Promise.all(
          finalFeeds.map(async feed => {
            const canPost = await auth.feed(feed._id).canPost();
            return canPost.allowed;
          })
        );

        finalFeeds = finalFeeds.filter((_, index) => feedChecks[index]);
      }

      return finalFeeds;
    } else {
      return publicFeeds;
    }
  },
});

export const getUserFeedsWithMemberships = query({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const auth = await getUserAuth(ctx, args.orgId);
    const user = auth.getUser();

    if(!user) {
      return null;
    }

    const userFeedsWithMemberships = await getUserFeedsWithMembershipsHelper(ctx, user._id);

    return userFeedsWithMemberships;
  },
});

export const getUserFeedsWithMembershipsHelper = async (
  ctx: QueryCtx,
  userId: Id<"users">,
) => {
  const userFeeds = await getManyFrom(ctx.db, "userFeeds", "by_userId", userId);
  const feedIds = userFeeds.map((userFeed) => userFeed.feedId);
  const feedsUserIsMemberOf = await getAll(ctx.db, feedIds);

  return {
    userFeeds,
    feeds: feedsUserIsMemberOf.filter((feed) => feed !== null),
  };
}

export const getPublicFeeds = async (ctx: QueryCtx, orgId: Id<"organizations">) => {
  const publicFeeds = await ctx.db.query("feeds")
  .withIndex("by_org_privacy", (q) =>
    q.eq("orgId", orgId).eq("privacy", "public")
  )
  .collect();

  return publicFeeds;
};

/**
 * Internal query to get a feed by ID
 * Used by HTTP actions for auth checks
 */
export const get = internalQuery({
  args: {
    feedId: v.id("feeds"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.feedId);
  },
});

/**
 * Get a feed by ID for users with access
 * Returns feed if user is a member, owner, feed is public, or feed is open and user is logged in
 */
export const getFeed = query({
  args: {
    orgId: v.id("organizations"),
    feedId: v.id("feeds"),
  },
  handler: async (ctx, args) => {
    const { orgId, feedId } = args;

    const auth = await getUserAuth(ctx, orgId);
    const user = auth.getUser();

    const feed = await ctx.db.get(feedId);
    if (!feed) {
      throw new Error("Feed not found");
    }

    if (feed.orgId !== orgId) {
      throw new Error("Feed does not belong to this organization");
    }

    // Check if user has access to this feed
    const isPublic = feed.privacy === "public";
    const isOpen = feed.privacy === "open";
    let isMember = false;

    if (user) {
      const isMemberCheck = await auth.feed(feedId).hasRole("member");
      isMember = isMemberCheck.allowed;
    }

    const allowUserToViewThisFeed = isPublic || (user && (isOpen || isMember));

    if (!allowUserToViewThisFeed) {
      throw new Error("You do not have access to this feed");
    }

    return feed;
  },
});

/**
 * Update a feed's settings
 * Only admins and feed owners can update feeds
 * Only admins can set privacy to "public"
 */
export const updateFeed = mutation({
  args: {
    orgId: v.id("organizations"),
    feedId: v.id("feeds"),
    name: v.string(),
    description: v.optional(v.string()),
    privacy: v.union(
      v.literal("public"),
      v.literal("private"),
      v.literal("open")
    ),
    memberPermissions: v.optional(
      v.array(v.union(v.literal("post"), v.literal("message")))
    ),
  },
  handler: async (ctx, args) => {
    const { orgId, feedId, name, description, privacy, memberPermissions } =
      args;

    const auth = await getUserAuth(ctx, orgId);
    auth.getUserOrThrow();

    // Get the feed
    const feed = await ctx.db.get(feedId);
    if (!feed) {
      throw new Error("Feed not found");
    }

    if (feed.orgId !== orgId) {
      throw new Error("Feed does not belong to this organization");
    }

    // Check if user is admin or feed owner
    const isAdminCheck = auth.hasRole("admin");
    const isAdmin = isAdminCheck.allowed;
    const isOwnerCheck = await auth.feed(feedId).hasRole("owner");
    const isOwner = isOwnerCheck.allowed;

    if (!isAdmin && !isOwner) {
      throw new Error(
        "You do not have permission to update this feed. Only admins and feed owners can update feed settings."
      );
    }

    // Only admins can set privacy to "public"
    if (privacy === "public" && !isAdmin) {
      throw new Error(
        "Only organization admins can set feed privacy to public."
      );
    }

    // Validate name field
    const nameValidation = validateTextField(
      name,
      {
        required: true,
        minLength: 4,
        maxLength: 25,
      },
      "Name"
    );

    if (!nameValidation.valid) {
      throw new Error(nameValidation.errors[0].message);
    }

    // Validate description field
    if (description) {
      const descriptionValidation = validateTextField(
        description,
        {
          maxLength: 100,
        },
        "Description"
      );

      if (!descriptionValidation.valid) {
        throw new Error(descriptionValidation.errors[0].message);
      }
    }

    // Update the feed
    await ctx.db.patch(feedId, {
      name,
      description,
      privacy,
      memberPermissions,
      updatedAt: Date.now(),
    });

    // Return the updated feed
    const updatedFeed = await ctx.db.get(feedId);
    return updatedFeed;
  },
});

/**
 * Get all open and public feeds in an organization with pagination
 * Only authenticated users can call this query
 */
export const getAllOpenFeeds = query({
  args: {
    orgId: v.id("organizations"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const { orgId, paginationOpts } = args;

    const auth = await getUserAuth(ctx, orgId);
    auth.getUserOrThrow();

    // Get all feeds and filter for open or public
    const allFeeds = await ctx.db
      .query("feeds")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .filter((q) =>
        q.or(
          q.eq(q.field("privacy"), "open"),
          q.eq(q.field("privacy"), "public")
        )
      )
      .paginate(paginationOpts);

    return allFeeds;
  },
});
