"use client";

import { Step, StepOptionCard } from "@/app/components/ui/Stepper";
import StepTitle from "@/app/components/ui/Stepper/StepTitle";

interface FeedPrivacyStepProps {
  feedName: string;
  value: "public" | "private" | "open";
  onChange: (value: "public" | "private" | "open") => void;
}

export default function FeedPrivacyStep({
  feedName,
  onChange,
}: FeedPrivacyStepProps) {
  return (
    <Step>
      <StepTitle>
        Who do you want to access <span>{feedName}</span>?
      </StepTitle>

      <StepOptionCard
        title="Invited users"
        titleIcon="send-alt"
        description="Only users who have been invited to your feed can see it."
        onClick={({ nextStep }) => {
          onChange("private");
          nextStep();
        }}
      />

      <StepOptionCard
        title="All users"
        titleIcon="users"
        description="Any user within your church can see your feed and join."
        onClick={({ nextStep }) => {
          onChange("open");
          nextStep();
        }}
      />

      <StepOptionCard
        title="Anyone"
        titleIcon="globe"
        description="Anyone, regardless of being logged in, can view. Ideal for announcements, sermons, or anything you want public."
        onClick={({ nextStep }) => {
          onChange("public");
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
