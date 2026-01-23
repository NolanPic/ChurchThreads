import { Section, Text } from "@react-email/components";
import React from "react";
import { Notification } from "../notifications/Notification";
import { Button } from "../components/Button";

interface RegisterProps {
  orgHost: string;
  inviteToken: string;
  inviterName: string;
  orgName: string;
}

export const Register: React.FC<RegisterProps> = ({
  orgHost,
  inviteToken,
  inviterName,
  orgName,
}) => {
  return (
    <Notification title="You're invited!" orgHost={orgHost} showFooter={false}>
      <Section>
        <Text
          style={{
            fontSize: "16px",
            lineHeight: "1.5",
            color: "#E0E0E0",
            marginBottom: "24px",
            fontFamily: "Lato, Arial, sans-serif",
            textAlign: "center",
          }}
        >
          {inviterName} from {orgName} invited you to join ChurchThreads!
        </Text>

        <div style={{ textAlign: "center" }}>
          <Button url={`https://${orgHost}/register?token=${inviteToken}`}>
            Register now
          </Button>
        </div>
      </Section>
    </Notification>
  );
};
