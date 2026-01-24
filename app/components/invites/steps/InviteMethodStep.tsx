"use client";

import Icon from "../../ui/Icon";
import styles from "./InviteMethodStep.module.css";

interface InviteMethodStepProps {
  onSelectMethod: (method: "email" | "qr") => void;
}

export default function InviteMethodStep({ onSelectMethod }: InviteMethodStepProps) {
  return (
    <div className={styles.methodGrid}>
      <button
        type="button"
        className={styles.card}
        onClick={() => onSelectMethod("email")}
      >
        <div className={styles.cardHeader}>
          <Icon name="send" size={24} className={styles.cardIcon} />
          <h2 className={styles.cardTitle}>By email</h2>
        </div>
        <p className={styles.cardDescription}>
          Send invitation emails to one or more people
        </p>
      </button>

      <button
        type="button"
        className={styles.card}
        onClick={() => onSelectMethod("qr")}
      >
        <div className={styles.cardHeader}>
          <Icon name="share" size={24} className={styles.cardIcon} />
          <h2 className={styles.cardTitle}>By QR Code</h2>
        </div>
        <p className={styles.cardDescription}>
          Show a QR code for someone to scan
        </p>
      </button>
    </div>
  );
}
