import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const defaultColumns = {
  orgId: v.id("organizations"),
  updatedAt: v.number(),
};

export default defineSchema({
  users: defineTable({
    email: v.string(),
    emailVerificationTime: v.optional(v.number()),
    name: v.string(),
    image: v.optional(v.id("uploads")),
    orgId: v.id("organizations"),
    clerkId: v.optional(v.string()),
    deactivatedAt: v.optional(v.number()),
    role: v.union(v.literal("admin"), v.literal("user")),
    settings: v.optional(
      v.object({
        notifications: v.optional(
          v.array(v.union(v.literal("push"), v.literal("email"))),
        ),
      }),
    ),
  })
    .index("by_org", ["orgId"])
    .index("by_org_and_email", ["orgId", "email"])
    .index("by_clerk_and_org_id", ["clerkId", "orgId"]),
  organizations: defineTable({
    name: v.string(),
    location: v.string(),
    host: v.string(),
    updatedAt: v.number(),
  }).index("by_host", ["host"]),
  feeds: defineTable({
    ...defaultColumns,
    name: v.string(),
    description: v.optional(v.string()),
    privacy: v.union(
      v.literal("public"),
      v.literal("private"),
      v.literal("open"),
    ),
    memberPermissions: v.optional(
      v.array(v.union(v.literal("post"), v.literal("message"))),
    ),
  })
    .index("by_org", ["orgId"])
    .index("by_org_privacy", ["orgId", "privacy"]),
  userFeeds: defineTable({
    ...defaultColumns,
    userId: v.id("users"),
    feedId: v.id("feeds"),
    owner: v.boolean(),
  })
    .index("by_org_and_feed_and_user", ["orgId", "feedId", "userId"])
    .index("by_userId", ["userId"]),
  threads: defineTable({
    ...defaultColumns,
    feedId: v.id("feeds"),
    posterId: v.id("users"),
    content: v.string(),
    postedAt: v.optional(v.number()),
  }).index("by_org_and_postedAt", ["orgId", "postedAt"]),
  messages: defineTable({
    ...defaultColumns,
    threadId: v.id("threads"),
    senderId: v.id("users"),
    content: v.string(),
  }).index("by_orgId_threadId", ["orgId", "threadId"]),
  invites: defineTable({
    orgId: v.id("organizations"),
    email: v.string(),
    name: v.string(),
    token: v.optional(v.string()),
    type: v.union(v.literal("email"), v.literal("link")),
    expiresAt: v.number(),
    usedAt: v.optional(v.number()),
    feeds: v.array(v.id("feeds")),
  }),
  uploads: defineTable({
    ...defaultColumns,
    storageId: v.id("_storage"),
    source: v.union(
      v.literal("thread"),
      v.literal("message"),
      v.literal("avatar"),
    ),
    sourceId: v.optional(
      v.union(v.id("threads"), v.id("messages"), v.id("users")),
    ),
    userId: v.id("users"),
    fileExtension: v.string(),
  })
    .index("by_org_source_sourceId", ["orgId", "source", "sourceId"])
    .index("by_userId", ["userId"])
    .index("by_storageId", ["storageId"]),
  notifications: defineTable({
    ...defaultColumns,
    userId: v.id("users"),
    type: v.union(
      v.literal("new_thread_in_member_feed"),
      v.literal("new_message_in_thread"),
      v.literal("new_feed_member"),
      v.literal("new_user_needs_approval"),
    ),
    data: v.union(
      // new_thread_in_member_feed
      v.object({
        userId: v.id("users"),
        feedId: v.id("feeds"),
        threadId: v.id("threads"),
      }),
      // new_message_in_thread
      v.object({
        userId: v.id("users"),
        messageId: v.id("messages"),
        threadId: v.id("threads"),
        messageContent: v.string(),
      }),
      // new_feed_member
      v.object({
        userId: v.id("users"),
        feedId: v.id("feeds"),
      }),
      // new_user_needs_approval
      v.object({
        userId: v.id("users"),
        organizationId: v.id("organizations"),
      }),
    ),
    readAt: v.optional(v.number()),
  }).index("by_org_and_userId", ["orgId", "userId"]),
  pushSubscriptions: defineTable({
    ...defaultColumns,
    userId: v.id("users"),
    subscription: v.object({
      endpoint: v.string(),
      keys: v.object({
        p256dh: v.string(),
        auth: v.string(),
      }),
    }),
  }).index("by_org_and_user", ["orgId", "userId"]),
});
