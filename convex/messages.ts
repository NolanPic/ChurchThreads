import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getUserAuth } from "@/auth/convex";
import { fromJSONToHTML } from "./utils/threadContentConverter";
import { getStorageUrl } from "./uploads";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { sendNotifications } from "./notifications";

export const getForThread = query({
  args: {
    orgId: v.id("organizations"),
    threadId: v.id("threads"),
  },
  handler: async (ctx, args) => {
    const { orgId, threadId } = args;

    const thread = await ctx.db.get(threadId);
    if (!thread) {
      throw new Error("Thread not found");
    }

    const feed = await ctx.db.get(thread.feedId);
    if (!feed) {
      throw new Error("Feed not found");
    }

    const auth = await getUserAuth(ctx, orgId);

    const isUserMemberOfThisFeedCheck = await auth
      .feed(thread.feedId)
      .hasRole("member");
    const feedIsPublic = feed.privacy === "public";
    const feedIsOpen = feed.privacy === "open";
    const userCanViewThisThread =
      feedIsPublic || isUserMemberOfThisFeedCheck.allowed || (auth.getUser() && feedIsOpen);

    if (!userCanViewThisThread) {
      throw new Error("User cannot view this thread or its messages");
    }

    const rawMessages = await ctx.db
      .query("messages")
      .filter((q) =>
        q.and(q.eq(q.field("orgId"), orgId), q.eq(q.field("threadId"), threadId)),
      )
      .collect();

    // Oldest (top) to newest (bottom)
    rawMessages.sort((a, b) => a.updatedAt - b.updatedAt);

    const enriched = await Promise.all(
      rawMessages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);

        if (!sender) return null;
        const image = await getStorageUrl(ctx, sender.image);

        return {
          ...message,
          sender: { _id: sender._id, name: sender.name, image },
          content: fromJSONToHTML(message.content),
        };
      }),
    );

    return enriched.filter((m) => m !== null);
  },
});

export const create = mutation({
  args: {
    orgId: v.id("organizations"),
    threadId: v.id("threads"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const { orgId, threadId, content } = args;

    const auth = await getUserAuth(ctx, orgId);
    const user = auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const thread = await ctx.db.get(threadId);
    if (!thread) {
      throw new Error("Thread not found");
    }

    const canUserMessageCheck = await auth.feed(thread.feedId).canMessage();

    if (!canUserMessageCheck.allowed) {
      throw new Error("User cannot message in this feed");
    }

    const now = Date.now();
    const messageId = await ctx.db.insert("messages", {
      orgId,
      threadId,
      senderId: user._id,
      content,
      updatedAt: now,
    });

    // Send notifications for thread owner and previous commenters
    await sendNotifications(ctx, orgId, "new_message_in_thread", {
      userId: user._id,
      messageId,
      threadId,
      messageContent: content,
    });

    return messageId;
  },
});

/**
 * Internal mutation to delete multiple messages without auth checks
 * Used by public mutations with their own auth checks
 */
export const deleteMessagesInternal = internalMutation({
  args: {
    orgId: v.id("organizations"),
    messageIds: v.array(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const { orgId, messageIds } = args;

    // Delete all uploads associated with these messages
    await ctx.runMutation(internal.uploads.deleteUploadsForSources, {
      orgId,
      source: "message",
      sourceIds: messageIds,
    });

    // Delete all messages
    const deletedMessageIds: Id<"messages">[] = [];
    for (const messageId of messageIds) {
      try {
        await ctx.db.delete(messageId);
        deletedMessageIds.push(messageId);
      } catch (error) {
        console.warn(`Failed to delete message ${messageId}:`, error);
      }
    }

    return deletedMessageIds;
  },
});

export const deleteMessage = mutation({
  args: {
    orgId: v.id("organizations"),
    messageId: v.id("messages"),
  },
  handler: async (ctx, args): Promise<Id<"messages">> => {
    const { orgId, messageId } = args;

    const auth = await getUserAuth(ctx, orgId);
    const user = auth.getUserOrThrow();

    // Get the message
    const message = await ctx.db.get(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Get the thread to check feed ownership
    const thread = await ctx.db.get(message.threadId);
    if (!thread) {
      throw new Error("Thread not found");
    }

    // Check if user is the message author
    const isAuthor = message.senderId === user._id;

    // Check if user is the feed owner
    const feedOwnerCheck = await auth.feed(thread.feedId).hasRole("owner");
    const isFeedOwner = feedOwnerCheck.allowed;

    // User must be either the author or the feed owner
    if (!isAuthor && !isFeedOwner) {
      throw new Error("You do not have permission to delete this message");
    }

    const deletedIds = await ctx.runMutation(
      internal.messages.deleteMessagesInternal,
      {
        orgId,
        messageIds: [messageId],
      },
    );

    return deletedIds[0];
  },
});
