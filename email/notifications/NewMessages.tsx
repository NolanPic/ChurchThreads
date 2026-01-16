import { Section, Text } from "@react-email/components";
import React from "react";
import { Notification } from "./Notification";
import { Avatar } from "../components/Avatar";
import { Button } from "../components/Button";
import { Doc, Id } from "@/convex/_generated/dataModel";

interface MessageData {
  message: Doc<"messages">;
  author: Doc<"users">;
  authorImageUrl: string | null;
  messageHtml: string;
}

interface NewMessagesProps {
  messages: MessageData[];
  threadId: Id<"threads">;
  threadTitle: string;
  notificationId: Id<"notifications">;
  orgHost: string;
}

export const NewMessages: React.FC<NewMessagesProps> = ({
  messages,
  threadId,
  threadTitle,
  notificationId,
  orgHost,
}) => {
  return (
    <Notification title={`New messages in ${threadTitle}`} orgHost={orgHost}>
      <Section>
        {/* Messages */}
        {messages.map((msg, index) => {
          // Note: messageHtml should already be sanitized before being passed to this template

          return (
            <div
              key={msg.message._id}
              style={{
                marginBottom: index < messages.length - 1 ? "16px" : "32px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                {msg.authorImageUrl && (
                  <div style={{ flexShrink: 0 }}>
                    <Avatar imageUrl={msg.authorImageUrl} size={34} />
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      backgroundColor: "#515978",
                      borderRadius: "16px",
                      padding: "12px 16px",
                    }}
                  >
                    <Text
                      style={{
                        margin: "0 0 4px 0",
                        fontSize: "16px",
                        fontWeight: "bold",
                        color: "#E0E0E0",
                        fontFamily: "Lato, Arial, sans-serif",
                      }}
                    >
                      {msg.author.name}
                    </Text>
                    <div
                      style={{
                        fontSize: "16px",
                        lineHeight: "1.5",
                        color: "#E0E0E0",
                        fontFamily: "Lato, Arial, sans-serif",
                      }}
                      dangerouslySetInnerHTML={{ __html: msg.messageHtml }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Action button */}
        <div style={{ textAlign: "center" as const }}>
          <Button url={`https://${orgHost}/thread/${threadId}?notificationId=${notificationId}`}>
            View messages
          </Button>
        </div>
      </Section>
    </Notification>
  );
};
