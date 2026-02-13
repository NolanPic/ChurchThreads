"use client";

import { Step, StepOptionCard } from "@/app/components/ui/Stepper";
import StepTitle from "@/app/components/ui/StepTitle";

interface FeedPostingPermissionStepProps {
  feedName: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export default function FeedPostingPermissionStep({
  feedName,
  value,
  onChange,
}: FeedPostingPermissionStepProps) {
  return (
    <Step>
      <StepTitle>
        Should members of {feedName} be able to start new threads?
      </StepTitle>

      <StepOptionCard
        title="Yes"
        titleIcon="check"
        onClick={({ nextStep }) => {
          onChange(true);
          nextStep();
        }}
      />

      <StepOptionCard
        title="No"
        titleIcon="circle-x"
        description="Only feed owners can start new threads."
        onClick={({ nextStep }) => {
          onChange(false);
          nextStep();
        }}
      />

      <StepOptionCard
        title="Back"
        titleIcon="arrow-left"
        iconPosition="left"
        onClick={({ previousStep }) => previousStep()}
      />
    </Step>
  );
}
