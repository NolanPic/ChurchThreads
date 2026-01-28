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
    return null;
  }

  const registerUrl = `https://${org.host}/register?token=${encodeURIComponent(inviteToken)}`;

  return (
    <>
      <div className={styles.logo}>
        <Image
          src="/logo.svg"
          alt="ChurchThreads"
          width={120}
          height={40}
          priority
        />
        <p>
          church<span>threads</span>
        </p>
      </div>

      <div className={styles.qrCode}>
        <QRCodeSVG
          value={registerUrl}
          size={200}
          level="M"
          marginSize={0}
          bgColor="#E0E0E0"
          fgColor="#4C5177"
        />
      </div>
    </>
  );
}
