import {
  mutation,
  query,
  QueryCtx,
  internalMutation,
  internalQuery,
  MutationCtx,
} from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { getUserAuth } from "@/auth/convex";
import { Doc, Id } from "./_generated/dataModel";
import { fromJSONToPlainText } from "./utils/threadContentConverter";
import { getAll } from "convex-helpers/server/relationships";
import { internal } from "./_generated/api";

export const notificationTypeValidator = v.union(
  v.literal("new_thread_in_member_feed"),
  v.literal("new_message_in_thread"),
  v.literal("new_feed_member"),
  v.literal("new_user_needs_approval"),
  v.literal("user_registration"),
);

export type NotificationType =
  | "new_thread_in_member_feed"
  | "new_message_in_thread"
  | "new_feed_member"
  | "new_user_needs_approval"
  | "user_registration";

export const notificationDataValidator = v.union(
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
  // user_registration
  v.object({
    userId: v.id("users"),
    inviteId: v.id("invites"),
  }),
);

export type EnrichedNotification = Doc<"notifications"> & {
  title: string;
  body: string;
  action: {
    url: string;
  };
};

type CollectedNotificationData =
  | {
      type: "new_thread_in_member_feed";
      user: Doc<"users"> | null;
      feed: Doc<"feeds"> | null;
      threadId: Id<"threads">;
      feedId: Id<"feeds">;
    }
  | {
      type: "new_message_in_thread";
      message: Doc<"messages"> | null;
      sender: Doc<"users"> | null;
      thread: Doc<"threads"> | null;
      messageText: string;
      messageId: Id<"messages">;
      threadId: Id<"threads">;
    }
  | {
      type: "new_feed_member";
      user: Doc<"users"> | null;
      feed: Doc<"feeds"> | null;
      feedId: Id<"feeds">;
    }
  | {
      type: "new_user_needs_approval";
      user: Doc<"users"> | null;
      organization: Doc<"organizations"> | null;
    }
  | {
      type: "user_registration";
      user: Doc<"users"> | null;
      invite: Doc<"invites"> | null;
    };

/**
 * Collect all data needed for a notification (called once per notification)
 * This fetches user names, feed names, etc. that are the same for all recipients
 */
export async function collectNotificationData(
  ctx: QueryCtx,
  notification: Doc<"notifications">,
): Promise<CollectedNotificationData | null> {
  const { type, data } = notification;

  try {
    switch (type) {
      case "new_thread_in_member_feed": {
        const typedData = data as {
          userId: Id<"users">;
          feedId: Id<"feeds">;
          threadId: Id<"threads">;
        };
        const user = await ctx.db.get(typedData.userId);
        const feed = await ctx.db.get(typedData.feedId);

        return {
          type: "new_thread_in_member_feed",
          user,
          feed,
          threadId: typedData.threadId,
          feedId: typedData.feedId,
        };
      }

      case "new_message_in_thread": {
        const typedData = data as {
          userId: Id<"users">;
          messageId: Id<"messages">;
          threadId: Id<"threads">;
          messageContent: string;
        };
        const message = await ctx.db.get(typedData.messageId);
        const sender = message ? await ctx.db.get(message.senderId) : null;
        const thread = message ? await ctx.db.get(message.threadId) : null;
        const messageText = fromJSONToPlainText(typedData.messageContent, 100);

        return {
          type: "new_message_in_thread",
          message,
          sender,
          thread,
          messageText,
          messageId: typedData.messageId,
          threadId: typedData.threadId,
        };
      }

      case "new_feed_member": {
        const typedData = data as { userId: Id<"users">; feedId: Id<"feeds"> };
        const user = await ctx.db.get(typedData.userId);
        const feed = await ctx.db.get(typedData.feedId);

        return {
          type: "new_feed_member",
          user,
          feed,
          feedId: typedData.feedId,
        };
      }

      case "new_user_needs_approval": {
        const typedData = data as {
          userId: Id<"users">;
          organizationId: Id<"organizations">;
        };
        const user = await ctx.db.get(typedData.userId);
        const organization = await ctx.db.get(typedData.organizationId);

        return {
          type: "new_user_needs_approval",
          user,
          organization,
        };
      }

      case "user_registration": {
        const typedData = data as {
          userId: Id<"users">;
          inviteId: Id<"invites">;
        };
        const user = await ctx.db.get(typedData.userId);
        const invite = await ctx.db.get(typedData.inviteId);

        return {
          type: "user_registration",
          user,
          invite,
        };
      }
    }
  } catch (error) {
    console.error("Error collecting notification data:", error);
    return null;
  }
}

/**
 * Generate personalized notification text for a specific user
 * Returns null if required entities are missing (which means notification should not be sent)
 * @param notification - The notification record from the database
 * @param collectedData - Data collected once for all recipients via collectNotificationData
 * @param targetUserId - The user who will receive this notification (for personalization)
 * @param userFeedData - Pre-fetched userFeed for ownership checks to avoid redundant queries when sending to multiple users
 */
export function generateNotificationText(
  notification: Doc<"notifications">,
  collectedData: CollectedNotificationData,
  targetUserId: Id<"users">,
  userFeedData?: Doc<"userFeeds"> | null,
): EnrichedNotification | null {
  try {
    switch (collectedData.type) {
      case "new_thread_in_member_feed": {
        const { user, feed, threadId } = collectedData;

        if (!user || !feed) {
          return null;
        }

        const isOwner = userFeedData?.owner === true;

        return {
          ...notification,
          title: isOwner ? "New thread in your feed" : "New thread",
          body: isOwner
            ? `${user.name} just published a thread in your feed, ${feed.name}`
            : `${user.name} just published a thread in ${feed.name}`,
          action: {
            url: `/thread/${threadId}`,
          },
        };
      }

      case "new_message_in_thread": {
        const { sender, thread, messageText, messageId } = collectedData;

        if (!sender || !thread) {
          return null;
        }

        const isOwner = thread.posterId === targetUserId;

        return {
          ...notification,
          title: isOwner
            ? `${sender.name} messaged in your thread`
            : `${sender.name} responded in a thread`,
          body: messageText || "New message",
          action: {
            url: `/thread/${thread._id}#${messageId}`,
          },
        };
      }

      case "new_feed_member": {
        const { user, feed, feedId } = collectedData;

        if (!user || !feed) {
          return null;
        }

        return {
          ...notification,
          title: "Someone joined your feed",
          body: `${user.name} just joined ${feed.name}`,
          action: {
            url: `/feed/${feedId}`,
          },
        };
      }

      case "new_user_needs_approval": {
        const { user, organization } = collectedData;

        if (!user || !organization) {
          return null;
        }

        return {
          ...notification,
          title: "New user requesting to join",
          body: `${user.name} is requesting to join ${organization.name}`,
          action: {
            url: `/admin/users?filter=needs_approval`,
          },
        };
      }

      case "user_registration": {
        const { user } = collectedData as {
          user: Doc<"users"> | null;
          invite: Doc<"invites"> | null;
        };

        if (!user) {
          return null;
        }

        return {
          ...notification,
          title: "New user joined",
          body: `${user.name} just registered`,
          action: {
            url: `/`,
          },
        };
      }
    }
  } catch (error) {
    console.error("Error generating notification text:", error);
    return null;
  }
}

/**
 * Create a new notification (internal only)
 */
export const createNotification = internalMutation({
  args: {
    orgId: v.id("organizations"),
    userId: v.id("users"),
    type: notificationTypeValidator,
    data: notificationDataValidator,
  },
  handler: async (ctx, args) => {
    const { orgId, userId, type, data } = args;

    const now = Date.now();
    const notificationId = await ctx.db.insert("notifications", {
      orgId,
      userId,
      type,
      data,
      updatedAt: now,
    });

    return notificationId;
  },
});

/**
 * Get user's notifications with pagination
 */
export const getUserNotifications = query({
  args: {
    orgId: v.id("organizations"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const { orgId, paginationOpts } = args;

    const auth = await getUserAuth(ctx, orgId);
    const user = auth.getUser();

    if (!user) {
      return {
        page: [],
        continueCursor: "",
        isDone: true,
      };
    }

    const result = await ctx.db
      .query("notifications")
      .withIndex("by_org_and_userId", (q) =>
        q.eq("orgId", orgId).eq("userId", user._id),
      )
      .order("desc")
      .paginate(paginationOpts);

    const enrichedPage = await Promise.all(
      result.page.map(async (notification) => {
        const collectedData = await collectNotificationData(ctx, notification);
        if (!collectedData) {
          return null;
        }

        let userFeedData: Doc<"userFeeds"> | null = null;
        if (collectedData.type === "new_thread_in_member_feed") {
          userFeedData = await ctx.db
            .query("userFeeds")
            .withIndex("by_org_and_feed_and_user", (q) =>
              q
                .eq("orgId", orgId)
                .eq("feedId", collectedData.feedId)
                .eq("userId", user._id),
            )
            .first();
        }

        return generateNotificationText(
          notification,
          collectedData,
          user._id,
          userFeedData,
        );
      }),
    );

    const filteredPage = enrichedPage.filter(
      (n): n is EnrichedNotification => n !== null,
    );

    return {
      ...result,
      page: filteredPage,
    };
  },
});

/**
 * Get count of unread notifications for badge
 */
export const getUnreadCount = query({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const { orgId } = args;

    const auth = await getUserAuth(ctx, orgId);
    const user = auth.getUser();

    if (!user) {
      return 0;
    }

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_org_and_userId", (q) =>
        q.eq("orgId", orgId).eq("userId", user._id),
      )
      .filter((q) => q.eq(q.field("readAt"), undefined))
      .take(100);

    return unreadNotifications.length;
  },
});

/**
 * Mark a single notification as read
 */
export const markNotificationAsRead = mutation({
  args: {
    orgId: v.id("organizations"),
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const { orgId, notificationId } = args;

    const auth = await getUserAuth(ctx, orgId);
    const user = auth.getUserOrThrow();

    const notification = await ctx.db.get(notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    if (notification.userId !== user._id) {
      throw new Error("Unauthorized: notification does not belong to user");
    }

    await ctx.db.patch(notificationId, {
      readAt: Date.now(),
    });

    return notificationId;
  },
});

/**
 * Mark all notifications as read
 */
export const clearNotifications = mutation({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const { orgId } = args;

    const auth = await getUserAuth(ctx, orgId);
    const user = auth.getUserOrThrow();

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_org_and_userId", (q) =>
        q.eq("orgId", orgId).eq("userId", user._id),
      )
      .filter((q) => q.eq(q.field("readAt"), undefined))
      .take(1000);

    const now = Date.now();
    await Promise.all(
      notifications.map((notification) =>
        ctx.db.patch(notification._id, {
          readAt: now,
        }),
      ),
    );

    return notifications.length;
  },
});

/**
 * Helper to convert user IDs to recipients with preferences
 * Filters out deactivated users and users with no notification preferences set
 */
async function userIdsToRecipients(
  ctx: QueryCtx,
  userIds: Id<"users">[],
): Promise<
  Array<{ userId: Id<"users">; preferences: Array<"push" | "email"> }>
> {
  const users = await getAll(ctx.db, userIds);
  const recipients: Array<{
    userId: Id<"users">;
    preferences: Array<"push" | "email">;
  }> = [];

  for (const user of users) {
    if (user && !user.deactivatedAt) {
      const preferences = user.settings?.notifications;
      if (preferences && preferences.length > 0) {
        recipients.push({ userId: user._id, preferences });
      }
    }
  }

  return recipients;
}

type NotificationData =
  | { userId: Id<"users">; feedId: Id<"feeds">; threadId: Id<"threads"> }
  | {
      userId: Id<"users">;
      messageId: Id<"messages">;
      messageContent: string;
      threadId: Id<"threads">;
    }
  | { userId: Id<"users">; feedId: Id<"feeds"> }
  | { userId: Id<"users">; organizationId: Id<"organizations"> }
  | { userId: Id<"users">; inviteId: Id<"invites"> };

/**
 * Get all users who should receive a notification based on type and data
 * Returns users with their notification preferences
 */
async function getNotificationRecipients(
  ctx: QueryCtx,
  orgId: Id<"organizations">,
  type: NotificationType,
  data: NotificationData,
): Promise<
  Array<{ userId: Id<"users">; preferences: Array<"push" | "email"> }>
> {
  try {
    switch (type) {
      case "new_thread_in_member_feed": {
        const { userId: posterId, feedId } = data as {
          userId: Id<"users">;
          feedId: Id<"feeds">;
          threadId: Id<"threads">;
        };

        // Get all members of the feed except the poster
        const feedMembers = await ctx.db
          .query("userFeeds")
          .withIndex("by_org_and_feed_and_user", (q) =>
            q.eq("orgId", orgId).eq("feedId", feedId),
          )
          .collect();

        const userIds = feedMembers
          .map((m) => m.userId)
          .filter((id) => id !== posterId);

        return await userIdsToRecipients(ctx, userIds);
      }

      case "new_message_in_thread": {
        const { userId: senderId, messageId } = data as {
          userId: Id<"users">;
          messageId: Id<"messages">;
          messageContent: string;
        };

        const message = await ctx.db.get(messageId);
        if (!message) return [];

        const thread = await ctx.db.get(message.threadId);
        if (!thread) return [];

        const recipientUserIds = new Set<Id<"users">>();

        // Add thread owner if not the sender
        if (thread.posterId !== senderId) {
          recipientUserIds.add(thread.posterId);
        }

        // Get all users who have previously messaged in this thread
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_orgId_threadId", (q) =>
            q.eq("orgId", orgId).eq("threadId", message.threadId),
          )
          .collect();

        for (const msg of messages) {
          if (msg.senderId !== senderId) {
            recipientUserIds.add(msg.senderId);
          }
        }

        return await userIdsToRecipients(ctx, Array.from(recipientUserIds));
      }

      case "new_feed_member": {
        const { userId: newMemberId, feedId } = data as {
          userId: Id<"users">;
          feedId: Id<"feeds">;
        };

        // Get all owners of the feed except the new member
        const feedOwners = await ctx.db
          .query("userFeeds")
          .withIndex("by_org_and_feed_and_user", (q) =>
            q.eq("orgId", orgId).eq("feedId", feedId),
          )
          .filter((q) => q.eq(q.field("owner"), true))
          .collect();

        const userIds = feedOwners
          .map((o) => o.userId)
          .filter((id) => id !== newMemberId);

        return await userIdsToRecipients(ctx, userIds);
      }

      case "user_registration": {
        const { inviteId } = data as { inviteId: Id<"invites"> };
        const invite = await ctx.db.get(inviteId);
        if (!invite) return [];

        return await userIdsToRecipients(ctx, [invite.createdBy]);
      }

      default:
        return [];
    }
  } catch (error) {
    console.error("Error getting notification recipients:", error);
    return [];
  }
}

/**
 * Schedules notifications to send to the relevant users
 * after a specific action has taken place in the app
 */
export async function sendNotifications(
  ctx: MutationCtx,
  orgId: Id<"organizations">,
  type: NotificationType,
  data: NotificationData,
) {
  // Get all users who should receive this notification
  const recipients = await getNotificationRecipients(ctx, orgId, type, data);

  if (recipients.length === 0) {
    return { recipientCount: 0 };
  }

  await ctx.runMutation(internal.notifications.scheduleNotifications, {
    orgId,
    type,
    data,
    recipients,
  });

  return { recipientCount: recipients.length };
}

/**
 * Schedules notifications to send to a batch of users
 * Creates notification records and sends push/email notifications
 */
export const scheduleNotifications = internalMutation({
  args: {
    orgId: v.id("organizations"),
    type: notificationTypeValidator,
    data: notificationDataValidator,
    recipients: v.array(
      v.object({
        userId: v.id("users"),
        preferences: v.array(v.union(v.literal("push"), v.literal("email"))),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const { orgId, type, data, recipients } = args;
    const now = Date.now();

    // Create notification records for each user and map IDs directly
    const recipientsWithNotificationIds = await Promise.all(
      recipients.map(async (recipient) => {
        const notificationId = await ctx.db.insert("notifications", {
          orgId,
          userId: recipient.userId,
          type,
          data,
          updatedAt: now,
        });
        return {
          userId: recipient.userId,
          preferences: recipient.preferences,
          notificationId,
        };
      }),
    );

    // Separate recipients by preference type
    const pushRecipients = recipientsWithNotificationIds.filter((r) =>
      r.preferences.includes("push"),
    );

    const emailRecipients = recipientsWithNotificationIds.filter((r) =>
      r.preferences.includes("email"),
    );

    // Send push notifications
    if (pushRecipients.length > 0) {
      await ctx.scheduler.runAfter(
        0,
        internal.pushNotifications.sendPushNotifications,
        {
          orgId,
          type,
          data,
          recipients: pushRecipients,
        },
      );
    }

    // Send email notifications
    if (emailRecipients.length > 0) {
      // Special handling for new_message_in_thread with 15-minute delay
      if (type === "new_message_in_thread") {
        const threadId = (data as { threadId: Id<"threads"> }).threadId;

        // Check if email already scheduled for this thread
        const alreadyScheduled = await ctx.runQuery(
          internal.emailNotifications.getScheduledMessageNotifications,
          { threadId },
        );

        await Promise.all(
          alreadyScheduled.map(async (scheduled: any) => {
            await ctx.scheduler.cancel(scheduled._id);
          }),
        );

        // Schedule with 15-minute delay
        await ctx.scheduler.runAfter(
          15 * 60 * 1000,
          internal.emailNotifications.sendEmailNotifications,
          {
            orgId,
            type,
            data,
            recipients: emailRecipients,
          },
        );
      } else {
        // Send immediately for other notification types
        await ctx.scheduler.runAfter(
          0,
          internal.emailNotifications.sendEmailNotifications,
          {
            orgId,
            type,
            data,
            recipients: emailRecipients,
          },
        );
      }
    }

    return {
      notificationIds: recipientsWithNotificationIds.map(
        (r) => r.notificationId,
      ),
      sentCount: recipients.length,
    };
  },
});

/**
 * Get notification data for push notification sending
 * Returns enriched notification data for each recipient
 */
export const getNotificationDataForPush = internalQuery({
  args: {
    orgId: v.id("organizations"),
    type: notificationTypeValidator,
    data: notificationDataValidator,
    recipients: v.array(
      v.object({
        userId: v.id("users"),
        notificationId: v.id("notifications"),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const { orgId, type, data, recipients } = args;

    // Create a temporary notification object for data collection
    // Note: We still need this for collectNotificationData, but we'll use real IDs in results
    const tempNotification = {
      orgId,
      type,
      data,
      userId: "" as Id<"users">,
      updatedAt: Date.now(),
      _id: "" as Id<"notifications">,
      _creationTime: Date.now(),
    } as Doc<"notifications">;

    // Collect shared notification data once
    const collectedData = await collectNotificationData(ctx, tempNotification);
    if (!collectedData) {
      return [];
    }

    // For new_thread_in_member_feed, gather userFeed data for all recipients
    const userFeedMap = new Map<Id<"users">, Doc<"userFeeds"> | null>();
    if (
      type === "new_thread_in_member_feed" &&
      collectedData.type === "new_thread_in_member_feed"
    ) {
      const { feedId } = collectedData;
      const userFeeds = await ctx.db
        .query("userFeeds")
        .withIndex("by_org_and_feed_and_user", (q) =>
          q.eq("orgId", orgId).eq("feedId", feedId),
        )
        .collect();

      for (const userFeed of userFeeds) {
        userFeedMap.set(userFeed.userId, userFeed);
      }
    }

    // Generate personalized notification text for each recipient
    const results = [];
    for (const recipient of recipients) {
      const userFeedData = userFeedMap.get(recipient.userId) ?? null;
      const enrichedNotification = generateNotificationText(
        tempNotification,
        collectedData,
        recipient.userId,
        userFeedData,
      );

      // Include the real notification ID in results
      results.push({
        userId: recipient.userId,
        notificationId: recipient.notificationId,
        enrichedNotification,
      });
    }

    return results;
  },
});

/**
 * Get user's push subscriptions
 */
export const getUserPushSubscriptions = internalQuery({
  args: {
    orgId: v.id("organizations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { orgId, userId } = args;

    const subscriptions = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_org_and_user", (q) =>
        q.eq("orgId", orgId).eq("userId", userId),
      )
      .collect();

    return subscriptions;
  },
});

/**
 * Delete a push subscription
 */
export const deletePushSubscription = internalMutation({
  args: {
    subscriptionId: v.id("pushSubscriptions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.subscriptionId);
  },
});
