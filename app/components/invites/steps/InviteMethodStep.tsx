"use client";

import { StepOptionCard } from "@/app/components/ui/Stepper";

interface InviteMethodStepProps {
  onSelectMethod: (method: "email" | "qr") => void;
}

export default function InviteMethodStep({
  onSelectMethod,
}: InviteMethodStepProps) {
  return (
    <>
      <StepOptionCard
        title="By email"
        titleIcon="send-alt"
        description="Invite one or more users by their email address."
        onClick={({ nextStep }) => {
          onSelectMethod("email");
          nextStep();
        }}
      />

      <StepOptionCard
        title="By QR Code"
        titleIcon="qr-code"
        description="Let users join by scanning a QR code on your phone."
        onClick={({ nextStep }) => {
          onSelectMethod("qr");
          nextStep();
        }}
      />
    </>
  );
}
