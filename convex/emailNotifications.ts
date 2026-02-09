import { internalAction, internalQuery, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { components, internal } from "./_generated/api";
import { Resend } from "@convex-dev/resend";
import {
  notificationTypeValidator,
  notificationDataValidator,
} from "./notifications";
import { fromJSONToHTML } from "./utils/threadContentConverter";
import { EmailData } from "./types/notifications";
import renderEmailTemplate from "./renderEmailTemplate";

/**
 * Send email notifications to recipients
 */
export const sendEmailNotifications = internalAction({
  args: {
    orgId: v.id("organizations"),
    type: notificationTypeValidator,
    data: notificationDataValidator,
    recipients: v.array(
      v.object({
        userId: v.id("users"),
        preferences: v.array(v.union(v.literal("push"), v.literal("email"))),
        notificationId: v.id("notifications"),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const { orgId, type, data, recipients } = args;

    const resend = new Resend(components.resend, { testMode: false });
    const fromEmail = process.env.RESEND_FROM_EMAIL;

    if (!fromEmail) {
      console.error("RESEND_FROM_EMAIL environment variable not set");
      return { sent: 0, failed: recipients.length };
    }

    // Conversation lull detection for message notifications
    if (type === "new_message_in_thread") {
      const threadId = (data as { threadId: Id<"threads"> }).threadId;

      // Check for conversation lull
      const lastMessage = await ctx.runQuery(
        internal.emailNotifications.getLastMessageSentInThread,
        { threadId, orgId },
      );

      if (lastMessage) {
        const timeSinceLastMessage = Date.now() - lastMessage._creationTime;
        const fifteenMinutes = 15 * 60 * 1000;

        // If less than 15 minutes since last message, reschedule
        if (timeSinceLastMessage < fifteenMinutes) {
          const remainingWait = fifteenMinutes - timeSinceLastMessage;

          await ctx.scheduler.runAfter(
            remainingWait,
            internal.emailNotifications.sendEmailNotifications,
            {
              orgId,
              type,
              data,
              recipients,
            },
          );

          return { sent: 0, failed: 0 };
        }
      }
    }

    // Fetch email data for all recipients
    const notificationData = await ctx.runQuery(
      internal.emailNotifications.getNotificationDataForEmail,
      {
        orgId,
        type,
        data,
        recipients: recipients.map((r) => ({
          userId: r.userId,
          notificationId: r.notificationId,
        })),
      },
    );

    let sent = 0;
    let failed = 0;

    // Send email to each recipient
    for (const recipientData of notificationData) {
      if (!recipientData.emailData) {
        failed++;
        continue;
      }

      try {
        const subject = generateSubjectLine(recipientData.emailData);

        let html: string;
        try {
          html = await renderEmailTemplate(recipientData.emailData);
        } catch (renderError) {
          console.error("Failed to render email template:", renderError);
          failed++;
          continue;
        }

        await resend.sendEmail(ctx, {
          from: fromEmail,
          to: recipientData.recipientEmail,
          subject,
          html,
        });

        sent++;
      } catch (error) {
        console.error("Failed to send email:", error);
        failed++;
      }
    }

    return { sent, failed };
  },
});

/**
 * Get notification data formatted for email templates
 */
export const getNotificationDataForEmail = internalQuery({
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

    // Fetch organization to get host for email links
    const org = await ctx.db.get(orgId);
    if (!org) {
      console.error("Organization not found");
      return recipients.map((recipient) => ({
        userId: recipient.userId,
        recipientEmail: null,
        notificationId: recipient.notificationId,
        emailData: null,
      }));
    }

    const results = [];

    for (const recipient of recipients) {
      const user = await ctx.db.get(recipient.userId);
      if (!user || !user.email) {
        results.push({
          userId: recipient.userId,
          recipientEmail: null,
          notificationId: recipient.notificationId,
          emailData: null,
        });
        continue;
      }

      let emailData: EmailData | null = null;

      try {
        switch (type) {
          case "new_thread_in_member_feed": {
            emailData = await getNewThreadEmailData(
              ctx,
              orgId,
              data as {
                userId: Id<"users">;
                feedId: Id<"feeds">;
                threadId: Id<"threads">;
              },
              recipient.userId,
              recipient.notificationId,
              org.host,
            );
            break;
          }

          case "new_message_in_thread": {
            emailData = await getNewMessageEmailData(
              ctx,
              orgId,
              data as {
                userId: Id<"users">;
                messageId: Id<"messages">;
                messageContent: string;
              },
              recipient.userId,
              recipient.notificationId,
              org.host,
            );
            break;
          }

          case "new_feed_member": {
            emailData = await getNewFeedMemberEmailData(
              ctx,
              data as { userId: Id<"users">; feedId: Id<"feeds"> },
              recipient.notificationId,
              org.host
            );
            break;
          }

          case "user_registration": {
            emailData = await getNewRegistrationEmailData(
              ctx,
              data as { userId: Id<"users">; inviteId: Id<"invites"> },
              recipient.notificationId,
              org.host,
            );
            break;
          }
        }
      } catch (error) {
        console.error("Error fetching email data:", error);
      }

      results.push({
        userId: recipient.userId,
        recipientEmail: user.email,
        notificationId: recipient.notificationId,
        emailData,
      });
    }

    return results;
  },
});

/**
 * Get a message by ID (helper for conversation lull detection)
 */
export const getMessage = internalQuery({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.messageId);
  },
});

/**
 * Get last message sent in a thread for conversation lull detection
 */
export const getLastMessageSentInThread = internalQuery({
  args: {
    threadId: v.id("threads"),
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_orgId_threadId", (q) =>
        q.eq("orgId", args.orgId).eq("threadId", args.threadId),
      )
      .order("desc")
      .take(1);

    return messages[0] ?? null;
  },
});

/**
 * Get scheduled email notifications for a post to avoid duplicates
 */
export const getScheduledMessageNotifications = internalQuery({
  args: {
    threadId: v.id("threads"),
  },
  handler: async (ctx, args) => {
    const scheduled = await ctx.db.system
      .query("_scheduled_functions")
      .collect();

    const notificationScheduledForThisThread = scheduled.filter((sf) => {
      if (sf.state.kind !== "pending") {
        return false;
      }

      if (!sf.name.endsWith(":sendEmailNotifications")) {
        return false;
      }

      if (sf.args?.[0]?.type !== "new_message_in_thread") {
        return false;
      }

      // should have a message ID
      const messageId = sf.args?.[0]?.data?.messageId;
      if (!messageId) {
        return false;
      }

      // message notification should belong to this thread
      const threadIdOfMessage = sf.args?.[0]?.data?.threadId;
      if (!threadIdOfMessage || threadIdOfMessage !== args.threadId) {
        return false;
      }

      return true;
    });

    return notificationScheduledForThisThread;
  },
});

// Helper functions

async function getNewThreadEmailData(
  ctx: QueryCtx,
  orgId: Id<"organizations">,
  data: { userId: Id<"users">; feedId: Id<"feeds">; threadId: Id<"threads"> },
  recipientUserId: Id<"users">,
  notificationId: Id<"notifications">,
  orgHost: string,
): Promise<EmailData | null> {
  const author = await ctx.db.get(data.userId);
  const feed = await ctx.db.get(data.feedId);
  const thread = await ctx.db.get(data.threadId);

  if (!author || !feed || !thread) {
    return null;
  }

  const authorImageUrl = author.image
    ? await ctx.runQuery(internal.uploads.getStorageUrlFromUploadId, {
      uploadId: author.image,
    })
    : null;
  const threadHtml = fromJSONToHTML(thread.content);

  // Check if recipient owns the feed
  const userFeed = await ctx.db
    .query("userFeeds")
    .withIndex("by_org_and_feed_and_user", (q) =>
      q
        .eq("orgId", orgId)
        .eq("feedId", data.feedId)
        .eq("userId", recipientUserId),
    )
    .first();

  return {
    type: "new_thread_in_member_feed" as const,
    author,
    authorImageUrl,
    feed,
    threadHtml,
    threadId: data.threadId,
    notificationId,
    userOwnsFeed: userFeed?.owner ?? false,
    orgHost,
  };
}

async function getNewMessageEmailData(
  ctx: QueryCtx,
  orgId: Id<"organizations">,
  data: {
    userId: Id<"users">;
    messageId: Id<"messages">;
    messageContent: string;
  },
  recipientUserId: Id<"users">,
  notificationId: Id<"notifications">,
  orgHost: string,
): Promise<EmailData | null> {
  const message = await ctx.db.get(data.messageId);
  if (!message) {
    return null;
  }

  // Get the most recent message and 4 before it (5 total)
  const messages = await ctx.db
    .query("messages")
    .withIndex("by_orgId_threadId", (q) =>
      q.eq("orgId", orgId).eq("threadId", message.threadId),
    )
    .order("desc")
    .take(5);

  const messagesWithAuthors = await Promise.all(
    messages.reverse().map(async (msg) => {
      const author = await ctx.db.get(msg.senderId);
      const authorImageUrl =
        author && author.image
          ? await ctx.runQuery(internal.uploads.getStorageUrlFromUploadId, {
            uploadId: author.image,
          })
          : null;
      const messageHtml = fromJSONToHTML(msg.content);

      return {
        message: msg,
        author: author!,
        authorImageUrl,
        messageHtml,
      };
    }),
  );

  // Get thread to check ownership
  const thread = await ctx.db.get(message.threadId);
  const userOwnsThread = thread?.posterId === recipientUserId;

  // Get most recent message author for subject line
  const mostRecentAuthor = await ctx.db.get(messages[0].senderId);

  return {
    type: "new_message_in_thread" as const,
    messages: messagesWithAuthors,
    threadId: message.threadId,
    threadTitle: "a thread",
    notificationId,
    userOwnsThread,
    actorName: mostRecentAuthor?.name || "Someone",
    orgHost,
  };
}

async function getNewFeedMemberEmailData(
  ctx: QueryCtx,
  data: { userId: Id<"users">; feedId: Id<"feeds"> },
  notificationId: Id<"notifications">,
  orgHost: string,
): Promise<EmailData | null> {
  const author = await ctx.db.get(data.userId);
  const feed = await ctx.db.get(data.feedId);

  if (!author || !feed) {
    return null;
  }

  const authorImageUrl = author.image
    ? await ctx.runQuery(internal.uploads.getStorageUrlFromUploadId, {
      uploadId: author.image,
    })
    : null;

  return {
    type: "new_feed_member" as const,
    author,
    authorImageUrl,
    feed,
    feedId: data.feedId,
    notificationId,
    orgHost,
  };
}

async function getNewRegistrationEmailData(
  ctx: QueryCtx,
  data: { userId: Id<"users">; inviteId: Id<"invites"> },
  notificationId: Id<"notifications">,
  orgHost: string,
): Promise<EmailData | null> {
  const newUser = await ctx.db.get(data.userId);

  if (!newUser) {
    return null;
  }

  const newUserImageUrl = newUser.image
    ? await ctx.runQuery(internal.uploads.getStorageUrlFromUploadId, {
      uploadId: newUser.image,
    })
    : null;

  return {
    type: "user_registration" as const,
    newUser,
    newUserImageUrl,
    notificationId,
    orgHost,
  };
}

function generateSubjectLine(emailData: EmailData): string {
  switch (emailData.type) {
    case "new_thread_in_member_feed":
      if (emailData.userOwnsFeed) {
        return `${emailData.author.name} just published a post in your feed, ${emailData.feed.name}`;
      }
      return `${emailData.author.name} just published a post in ${emailData.feed.name}`;

    case "new_message_in_thread":
      if (emailData.userOwnsThread) {
        return `${emailData.actorName} messaged in your post`;
      }
      return `${emailData.actorName} responded in a thread`;

    case "new_feed_member":
      return `${emailData.author.name} just joined ${emailData.feed.name}`;

    case "user_registration":
      return `${emailData.newUser.name} just registered`;

    default:
      return "New notification from churchthreads";
  }
}
