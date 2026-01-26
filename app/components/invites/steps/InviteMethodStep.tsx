"use client";

import Card from "../../ui/Card";
import Icon from "../../ui/Icon";
import styles from "./InviteMethodStep.module.css";

interface InviteMethodStepProps {
  onSelectMethod: (method: "email" | "qr") => void;
}

export default function InviteMethodStep({
  onSelectMethod,
}: InviteMethodStepProps) {
  return (
    <div className={styles.methodGrid}>
      <button
        type="button"
        className={styles.methodButton}
        onClick={() => onSelectMethod("email")}
      >
        <Card className={styles.methodCard}>
          <Icon name="send" size={24} className={styles.icon} />
          <h2 className={styles.title}>By email</h2>
          <p className={styles.description}>
            Send invitation emails to one or more people
          </p>
        </Card>
      </button>

      <button
        type="button"
        className={styles.methodButton}
        onClick={() => onSelectMethod("qr")}
      >
        <Card className={styles.methodCard}>
          <Icon name="share" size={24} className={styles.icon} />
          <h2 className={styles.title}>By QR Code</h2>
          <p className={styles.description}>
            Show a QR code for someone to scan
          </p>
        </Card>
      </button>
    </div>
  );
}
