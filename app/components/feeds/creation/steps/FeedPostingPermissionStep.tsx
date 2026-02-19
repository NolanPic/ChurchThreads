"use client";

import { Step, StepOptionCard } from "@/app/components/ui/Stepper";
import StepTitle from "@/app/components/ui/Stepper/StepTitle";

interface FeedPostingPermissionStepProps {
  feedName: string;
  feedPrivacy: "public" | "private" | "open";
  onChange: (value: boolean) => void;
}

export default function FeedPostingPermissionStep({
  feedName,
  feedPrivacy,
  onChange,
}: FeedPostingPermissionStepProps) {
  const isPublic = feedPrivacy === "public";

  const yesNoOptions = [
    <StepOptionCard
      key="yes"
      title={isPublic ? "Yes (not recommended)" : "Yes"}
      titleIcon="check"
      description={
        isPublic
          ? "Since your feed is public, this will allow any logged in user to start new threads that are public to anyone (logged in or not)."
          : undefined
      }
      onClick={({ nextStep }) => {
        onChange(true);
        nextStep();
      }}
    />,
    <StepOptionCard
      key="no"
      title="No"
      titleIcon="circle-x"
      description="Only feed owners can start new threads."
      onClick={({ nextStep }) => {
        onChange(false);
        nextStep();
      }}
    />,
  ];

  return (
    <Step>
      <StepTitle>
        Should members of <span>{feedName}</span> be able to start new threads?
      </StepTitle>

      {isPublic ? [...yesNoOptions].reverse() : yesNoOptions}

      <StepOptionCard
        title="Back"
        titleIcon="arrow-left"
        iconPosition="left"
        onClick={({ previousStep }) => previousStep()}
      />
    </Step>
  );
}
