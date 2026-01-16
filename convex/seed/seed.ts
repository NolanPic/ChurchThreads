import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { api } from "../_generated/api";

// Individual seed mutations for each table
export const seedOrganization = mutation({
  args: {
    name: v.string(),
    location: v.string(),
    host: v.string(),
  },
  handler: async (ctx, args) => {
    const updatedAt = Date.now();

    // Check if organization already exists
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_host", (q) => q.eq("host", args.host))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("organizations", {
      name: args.name,
      location: args.location,
      host: args.host,
      updatedAt,
    });
  },
});

export const seedFeed = mutation({
  args: {
    orgId: v.id("organizations"),
    name: v.string(),
    privacy: v.union(v.literal("public"), v.literal("private"), v.literal("open")),
  },
  handler: async (ctx, args) => {
    const updatedAt = Date.now();

    return await ctx.db.insert("feeds", {
      orgId: args.orgId,
      name: args.name,
      privacy: args.privacy,
      updatedAt,
    });
  },
});

export const seedUserFeed = mutation({
  args: {
    orgId: v.id("organizations"),
    userId: v.id("users"),
    feedId: v.id("feeds"),
    owner: v.boolean(),
  },
  handler: async (ctx, args) => {
    const updatedAt = Date.now();

    return await ctx.db.insert("userFeeds", {
      orgId: args.orgId,
      userId: args.userId,
      feedId: args.feedId,
      owner: args.owner,
      updatedAt,
    });
  },
});

export const seedThread = mutation({
  args: {
    orgId: v.id("organizations"),
    feedId: v.id("feeds"),
    posterId: v.id("users"),
    content: v.string(),
    postedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const updatedAt = Date.now();

    return await ctx.db.insert("threads", {
      orgId: args.orgId,
      feedId: args.feedId,
      posterId: args.posterId,
      content: args.content,
      postedAt: args.postedAt,
      updatedAt,
    });
  },
});

export const seedMessage = mutation({
  args: {
    orgId: v.id("organizations"),
    threadId: v.id("threads"),
    senderId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const updatedAt = Date.now();

    return await ctx.db.insert("messages", {
      orgId: args.orgId,
      threadId: args.threadId,
      senderId: args.senderId,
      content: args.content,
      updatedAt,
    });
  },
});

export const seedDatabase = mutation({
  args: {
    organizations: v.array(v.object({
      // Organization data
      orgName: v.string(),
      orgLocation: v.string(),
      orgHost: v.string(),

      // Users data for this organization
      users: v.array(v.object({
        email: v.string(),
        name: v.optional(v.string()),
        image: v.optional(v.string()),
      })),

      // Feeds data for this organization
      feeds: v.array(v.object({
        name: v.string(),
        privacy: v.union(v.literal("public"), v.literal("private"), v.literal("open")),
      })),

      // UserFeeds data (user-feed relationships)
      userFeeds: v.array(v.object({
        userIndex: v.number(), // Index of user in the users array
        feedIndex: v.number(), // Index of feed in the feeds array
        owner: v.boolean(),
      })),

      // Threads data (will be distributed across feeds)
      threads: v.array(v.object({
        content: v.string(),
        postedAt: v.number(),
        feedIndex: v.number(), // Index of feed in the feeds array
        userIndex: v.number(), // Index of user in the users array
        images: v.optional(v.array(v.string())),
      })),

      // Messages data
      messages: v.array(v.object({
        threadIndex: v.number(), // Index of thread in the threads array
        userIndex: v.number(), // Index of user in the users array
        content: v.string(),
      })),
    })),
  },
  handler: async (ctx, args) => {
          const allResults = {
        organizations: [] as {
          organizationId: Id<"organizations">;
          orgName: string;
          userIds: Id<"users">[];
          feedIds: Id<"feeds">[];
          userFeedIds: Id<"userFeeds">[];
          threadIds: Id<"threads">[];
          messageIds: Id<"messages">[];
        }[],
        totalUsers: 0,
        totalFeeds: 0,
        totalUserFeeds: 0,
        totalThreads: 0,
        totalMessages: 0,
      };

    // Process each organization
    for (const orgData of args.organizations) {
      const orgResults = {
        organizationId: null as Id<"organizations"> | null,
        orgName: orgData.orgName,
        userIds: [] as Id<"users">[],
        feedIds: [] as Id<"feeds">[],
        userFeedIds: [] as Id<"userFeeds">[],
        threadIds: [] as Id<"threads">[],
        messageIds: [] as Id<"messages">[],
      };

      // 1. Create organization first
      orgResults.organizationId = await ctx.runMutation(api.seed.seed.seedOrganization, {
        name: orgData.orgName,
        location: orgData.orgLocation,
        host: orgData.orgHost,
      });

      // 2. Create users for this organization
      for (const user of orgData.users) {
        const userId = await ctx.runMutation(api.seed.seed.seedUser, {
          email: user.email,
          name: user.name,
          orgId: orgResults.organizationId,
        });
        orgResults.userIds.push(userId);
      }

      // 3. Create feeds for this organization
      for (const feed of orgData.feeds) {
        const feedId = await ctx.runMutation(api.seed.seed.seedFeed, {
          orgId: orgResults.organizationId,
          name: feed.name,
          privacy: feed.privacy,
        });
        orgResults.feedIds.push(feedId);
      }

      // 4. Create userFeeds (user-feed relationships) for this organization
      for (const userFeed of orgData.userFeeds) {
        if (userFeed.userIndex < orgResults.userIds.length && userFeed.feedIndex < orgResults.feedIds.length) {
          const userFeedId = await ctx.runMutation(api.seed.seed.seedUserFeed, {
            orgId: orgResults.organizationId,
            userId: orgResults.userIds[userFeed.userIndex],
            feedId: orgResults.feedIds[userFeed.feedIndex],
            owner: userFeed.owner,
          });
          orgResults.userFeedIds.push(userFeedId);
        }
      }

    // 5. Create threads for this organization
      for (const thread of orgData.threads) {
        if (thread.feedIndex < orgResults.feedIds.length && thread.userIndex < orgResults.userIds.length) {
          const threadId = await ctx.runMutation(api.seed.seed.seedThread, {
            orgId: orgResults.organizationId,
            feedId: orgResults.feedIds[thread.feedIndex],
            posterId: orgResults.userIds[thread.userIndex],
            content: thread.content,
            postedAt: thread.postedAt,
          });
          orgResults.threadIds.push(threadId);
        }
      }

      // 6. Create messages for this organization
      for (const message of orgData.messages) {
        if (message.threadIndex < orgResults.threadIds.length && message.userIndex < orgResults.userIds.length) {
          const messageId = await ctx.runMutation(api.seed.seed.seedMessage, {
            orgId: orgResults.organizationId,
            threadId: orgResults.threadIds[message.threadIndex],
            senderId: orgResults.userIds[message.userIndex],
            content: message.content,
          });
          orgResults.messageIds.push(messageId);
        }
      }

      // Add to overall results
      allResults.organizations.push(orgResults as typeof orgResults & { organizationId: Id<"organizations"> });
      allResults.totalUsers += orgResults.userIds.length;
      allResults.totalFeeds += orgResults.feedIds.length;
      allResults.totalUserFeeds += orgResults.userFeedIds.length;
      allResults.totalThreads += orgResults.threadIds.length;
      allResults.totalMessages += orgResults.messageIds.length;
    }

    return allResults;
  },
});

// Create a test user for seeding purposes
export const seedUser = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    orgId: v.id("organizations"),
    imageUploadId: v.optional(v.id("uploads")),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (existing) {
      return existing._id;
    }

    // Create a test user in the auth system's users table
    // This follows the pattern used by @convex-dev/auth
    return await ctx.db.insert("users", {
      email: args.email,
      name: args.name || args.email.split("@")[0],
      emailVerificationTime: Date.now(), // Mark as verified for testing
      orgId: args.orgId,
      role: "user",
      image: args.imageUploadId,
    });
  },
});

// Patch user avatar image after user creation
export const patchUserAvatar = mutation({
  args: {
    userId: v.id("users"),
    imageUploadId: v.id("uploads"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      image: args.imageUploadId,
    });
  },
});

// Get all users for reference
export const getAllUsers = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});
