"use node";

import { render } from "@react-email/render";
import { NewThread } from "@/email/notifications/NewThread";
import { NewMessages } from "@/email/notifications/NewMessages";
import { UserJoinedFeed } from "@/email/notifications/UserJoinedFeed";
import type { ReactElement } from "react";
import { EmailData } from "./types/notifications";

export default async function renderEmailTemplate(
  emailData: EmailData,
): Promise<string> {
  let element: ReactElement;

  switch (emailData.type) {
    case "new_thread_in_member_feed":
      element = NewThread({
        author: emailData.author,
        authorImageUrl: emailData.authorImageUrl,
        feed: emailData.feed,
        threadHtml: emailData.threadHtml,
        threadId: emailData.threadId,
        notificationId: emailData.notificationId,
        orgHost: emailData.orgHost,
      }) as ReactElement;
      break;

    case "new_message_in_thread":
      element = NewMessages({
        messages: emailData.messages,
        threadId: emailData.threadId,
        threadTitle: emailData.threadTitle,
        notificationId: emailData.notificationId,
        orgHost: emailData.orgHost,
      }) as ReactElement;
      break;

    case "new_feed_member":
      element = UserJoinedFeed({
        author: emailData.author,
        authorImageUrl: emailData.authorImageUrl,
        feed: emailData.feed,
        feedId: emailData.feedId,
        notificationId: emailData.notificationId,
        orgHost: emailData.orgHost,
      }) as ReactElement;
      break;

    default:
      throw new Error(`Unknown email type: ${(emailData as EmailData).type}`);
  }

  return await render(element);
}
