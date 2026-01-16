import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { getUserFeedsWithMembershipsHelper, getPublicFeeds } from "./feeds";
import { getUserAuth } from "@/auth/convex";
import { Doc, Id } from "./_generated/dataModel";
import { fromJSONToHTML } from "./utils/threadContentConverter";
import { getStorageUrl } from "./uploads";
import { api, internal } from "./_generated/api";
import { sendNotifications } from "./notifications";

export const getThreadsForUserFeed = query({
  args: {
    orgId: v.id("organizations"),
    selectedFeedId: v.optional(v.id("feeds")),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const { orgId, selectedFeedId } = args;

    const auth = await getUserAuth(ctx, orgId);
    const user = auth.getUser();
    const publicFeeds = await getPublicFeeds(ctx, orgId);

    let feeds: Doc<"feeds">[] = [...publicFeeds];

    if (user) {
      const { feeds: feedsUserIsMemberOf } =
        await getUserFeedsWithMembershipsHelper(ctx, user._id);
      feeds = feeds.concat(feedsUserIsMemberOf);
    }

    if (selectedFeedId) {
      feeds = feeds.filter((feed) => feed._id === selectedFeedId);

      if(feeds.length === 0) {
        // this may be an open feed that the user is not a member of
        const feed = await ctx.runQuery(api.feeds.getFeed, {
          orgId,
          feedId: selectedFeedId,
        });
        if (feed && feed.privacy === "open") {
          feeds.push(feed);
        }
      }
    }

    const threads = await ctx.db
      .query("threads")
      .withIndex("by_org_and_postedAt", (q) => q.eq("orgId", orgId))
      .filter((q) =>
        q.or(...feeds.map((feed) => q.eq(q.field("feedId"), feed._id))),
      )
      .order("desc")
      .paginate(args.paginationOpts);

    const feedMap = new Map<Id<"feeds">, Doc<"feeds">>();
    for (const feed of feeds) {
      feedMap.set(feed._id, feed);
    }

    const enrichedThreads = await Promise.all(
      threads.page.map(async (thread) => {
        const author = await ctx.db.get(thread.posterId);
        if (!author) return null; // skip threads with no author

        const image = await getStorageUrl(ctx, author.image);
        const feed = feedMap.get(thread.feedId) || null;
        const messageCount = (
          await ctx.db
            .query("messages")
            .withIndex("by_orgId_threadId", (q) =>
              q.eq("orgId", orgId).eq("threadId", thread._id),
            )
            .collect()
        ).length;
        return {
          ...thread,
          author: { ...author, image },
          feed,
          content: fromJSONToHTML(thread.content),
          messageCount,
        };
      }),
    );

    return {
      ...threads,
      page: enrichedThreads.filter((thread) => thread !== null),
    };
  },
});

export const createThread = mutation({
  args: {
    orgId: v.id("organizations"),
    feedId: v.id("feeds"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const { orgId, feedId, content } = args;

    const auth = await getUserAuth(ctx, orgId);

    const canPost = await auth.feed(feedId).canPost();
    canPost.throwIfNotPermitted();

    const user = auth.getUser()!;

    const now = Date.now();

    const threadId = await ctx.db.insert("threads", {
      orgId,
      feedId,
      posterId: user._id,
      content,
      postedAt: now,
      updatedAt: now,
    });

    // Send notifications for feed members
    await sendNotifications(ctx, orgId, "new_thread_in_member_feed", {
      userId: user._id,
      feedId,
      threadId,
    });

    return threadId;
  },
});

export const getById = query({
  args: {
    orgId: v.id("organizations"),
    threadId: v.id("threads"),
  },
  handler: async (ctx, args) => {
    const { orgId, threadId } = args;

    const auth = await getUserAuth(ctx, orgId);

    const thread = await ctx.db.get(threadId);
    if (!thread) throw new Error("Thread not found");
    const feed = await ctx.db.get(thread.feedId);
    if (!feed) throw new Error("Feed not found");

    const isUserAMemberOfThisFeedCheck = await auth
      .feed(thread.feedId)
      .hasRole("member");
    const feedIsPublic = feed.privacy === "public";
    const feedIsOpen = feed.privacy === "open"
    const userCanViewThisThread =
      feedIsPublic || isUserAMemberOfThisFeedCheck.allowed || (auth.getUser() && feedIsOpen);

    if (!userCanViewThisThread) {
      throw new Error("User cannot view this thread");
    }

    const author = await ctx.db.get(thread.posterId);
    if (!author) return null;
    const image = await getStorageUrl(ctx, author.image);

    return {
      ...thread,
      author: { ...author, image },
      feed: feed ?? null,
      content: fromJSONToHTML(thread.content),
    };
  },
});

export const deleteThread = mutation({
  args: {
    orgId: v.id("organizations"),
    threadId: v.id("threads"),
  },
  handler: async (ctx, args) => {
    const { orgId, threadId } = args;

    const auth = await getUserAuth(ctx, orgId);
    const user = auth.getUserOrThrow();

    // Get the thread
    const thread = await ctx.db.get(threadId);
    if (!thread) {
      throw new Error("Thread not found");
    }

    // Check if user is the thread author
    const isAuthor = thread.posterId === user._id;

    // Check if user is the feed owner
    const feedOwnerCheck = await auth.feed(thread.feedId).hasRole("owner");
    const isFeedOwner = feedOwnerCheck.allowed;

    const canDelete = isAuthor || isFeedOwner;
    if (!canDelete) {
      throw new Error("You do not have permission to delete this thread");
    }

    // Get all messages for this thread
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_orgId_threadId", (q) =>
        q.eq("orgId", orgId).eq("threadId", threadId),
      )
      .collect();

    // Delete all messages (which also deletes their uploads)
    const messageIds = messages.map((m) => m._id);
    if (messageIds.length > 0) {
      await ctx.runMutation(internal.messages.deleteMessagesInternal, {
        orgId,
        messageIds,
      });
    }

    // Delete uploads for the thread itself
    await ctx.runMutation(internal.uploads.deleteUploadsForSources, {
      orgId,
      source: "thread",
      sourceIds: [threadId],
    });

    // Delete the thread
    try {
      await ctx.db.delete(threadId);
    } catch (error) {
      console.warn(`Failed to delete thread ${threadId}:`, error);
      throw error; // Re-throw since this is critical
    }

    return threadId;
  },
});
