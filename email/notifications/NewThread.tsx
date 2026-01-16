import { Section, Text, Link } from "@react-email/components";
import React from "react";
import { Notification } from "./Notification";
import { Avatar } from "../components/Avatar";
import { Button } from "../components/Button";
import { Doc, Id } from "@/convex/_generated/dataModel";

interface NewThreadProps {
  author: Doc<"users">;
  authorImageUrl: string | null;
  feed: Doc<"feeds">;
  threadHtml: string;
  threadId: Id<"threads">;
  notificationId: Id<"notifications">;
  orgHost: string;
}

export const NewThread: React.FC<NewThreadProps> = ({
  author,
  authorImageUrl,
  feed,
  threadHtml,
  threadId,
  notificationId,
  orgHost,
}) => {
  // Note: threadHtml should already be sanitized before being passed to this template

  return (
    <Notification title={`New thread from ${author.name}`} orgHost={orgHost}>
      <Section>
        {/* Author info */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          {authorImageUrl && <Avatar imageUrl={authorImageUrl} size={34} />}
          <Text
            style={{
              margin: 0,
              fontSize: "16px",
              color: "#E0E0E0",
              fontFamily: "Lato, Arial, sans-serif",
            }}
          >
            {author.name} in{" "}
            <Link
              href={`https://${orgHost}/feed/${feed._id}`}
              style={{
                color: "#F6B17A",
                textDecoration: "none",
              }}
            >
              {feed.name}
            </Link>
            :
          </Text>
        </div>

        {/* Thread content */}
        <div
          style={{
            fontSize: "16px",
            lineHeight: "1.5",
            color: "#E0E0E0",
            marginBottom: "24px",
            fontFamily: "Lato, Arial, sans-serif",
          }}
          dangerouslySetInnerHTML={{ __html: threadHtml }}
        />

        {/* Action button */}
        <div style={{ textAlign: "center" }}>
          <Button
            url={`https://${orgHost}/thread/${threadId}?notificationId=${notificationId}`}
          >
            View thread
          </Button>
        </div>
      </Section>
    </Notification>
  );
};
