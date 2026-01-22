import { Section, Text } from "@react-email/components";
import React from "react";
import { Notification } from "./Notification";
import { Avatar } from "../components/Avatar";
import { Doc, Id } from "@/convex/_generated/dataModel";

interface NewRegistrationProps {
  newUser: Doc<"users">;
  newUserImageUrl: string | null;
  notificationId: Id<"notifications">;
  orgHost: string;
}

export const NewRegistration: React.FC<NewRegistrationProps> = ({
  newUser,
  newUserImageUrl,
  notificationId,
  orgHost,
}) => {
  return (
    <Notification title="New user registered" orgHost={orgHost}>
      <Section>
        {/* Large centered avatar */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "24px",
          }}
        >
          {newUserImageUrl && <Avatar imageUrl={newUserImageUrl} size={80} />}
        </div>

        {/* Registration message */}
        <Text
          style={{
            textAlign: "center" as const,
            fontSize: "18px",
            color: "#E0E0E0",
            margin: "0 0 8px 0",
            fontFamily: "Lato, Arial, sans-serif",
          }}
        >
          {newUser.name} just joined your organization
        </Text>

        {/* Email address */}
        <Text
          style={{
            textAlign: "center" as const,
            fontSize: "16px",
            color: "#B0B0B0",
            margin: "0",
            fontFamily: "Lato, Arial, sans-serif",
          }}
        >
          {newUser.email}
        </Text>
      </Section>
    </Notification>
  );
};
