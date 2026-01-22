import { Id, Doc } from "../_generated/dataModel";

export type EmailData =
  | {
      type: "new_thread_in_member_feed";
      author: Doc<"users">;
      authorImageUrl: string | null;
      feed: Doc<"feeds">;
      threadHtml: string;
      threadId: Id<"threads">;
      notificationId: Id<"notifications">;
      userOwnsFeed: boolean;
      orgHost: string;
    }
  | {
      type: "new_message_in_thread";
      messages: Array<{
        message: Doc<"messages">;
        author: Doc<"users">;
        authorImageUrl: string | null;
        messageHtml: string;
      }>;
      threadId: Id<"threads">;
      threadTitle: string;
      notificationId: Id<"notifications">;
      userOwnsThread: boolean;
      actorName: string;
      orgHost: string;
    }
  | {
      type: "new_feed_member";
      author: Doc<"users">;
      authorImageUrl: string | null;
      feed: Doc<"feeds">;
      feedId: Id<"feeds">;
      notificationId: Id<"notifications">;
      orgHost: string;
    }
  | {
      type: "user_registration";
      newUser: Doc<"users">;
      newUserImageUrl: string | null;
      notificationId: Id<"notifications">;
      orgHost: string;
    };
