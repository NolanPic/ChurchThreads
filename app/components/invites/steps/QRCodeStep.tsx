"use client";

import { QRCodeSVG } from "qrcode.react";
import Image from "next/image";
import { useOrganization } from "@/app/context/OrganizationProvider";
import styles from "./QRCodeStep.module.css";

interface QRCodeStepProps {
  inviteToken: string | null;
}

export default function QRCodeStep({ inviteToken }: QRCodeStepProps) {
  const org = useOrganization();

  if (!inviteToken || !org) {
    return (
      <div className={styles.card}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  const registerUrl = `https://${org.host}/register?token=${inviteToken}`;

  return (
    <div className={styles.card}>
      <div className={styles.logo}>
        <Image
          src="/logo.svg"
          alt="ChurchThreads"
          width={120}
          height={40}
          priority
        />
      </div>

      <div className={styles.qrCode}>
        <QRCodeSVG
          value={registerUrl}
          size={200}
          level="M"
          marginSize={0}
        />
      </div>

      <p className={styles.instructions}>
        Scan this QR code to join {org.name}
      </p>
    </div>
  );
}
