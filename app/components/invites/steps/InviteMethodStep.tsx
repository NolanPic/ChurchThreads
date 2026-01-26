"use client";

import ActionCard from "../ActionCard";
import styles from "./InviteMethodStep.module.css";

interface InviteMethodStepProps {
  onSelectMethod: (method: "email" | "qr") => void;
}

export default function InviteMethodStep({
  onSelectMethod,
}: InviteMethodStepProps) {
  return (
    <div className={styles.methods}>
      <ActionCard
        title="By email"
        titleIcon="send-alt"
        description="Invite one or more users by their email address."
        onClick={() => onSelectMethod("email")}
      ></ActionCard>

      <ActionCard
        title="By QR Code"
        titleIcon="qr-code"
        description="Let users join by scanning a QR code on your phone."
        onClick={() => onSelectMethod("qr")}
      ></ActionCard>
    </div>
  );
}
