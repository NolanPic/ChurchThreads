"use client";

import { Step, StepOptionCard } from "@/app/components/ui/Stepper";
import StepTitle from "@/app/components/ui/Stepper/StepTitle";
import { Id } from "@/convex/_generated/dataModel";

interface FeedCreationSuccessStepProps {
  feedName: string;
  feedId: Id<"feeds">;
  onInvite: () => void;
  onSkip: () => void;
}

export default function FeedCreationSuccessStep({
  feedName,
  onInvite,
  onSkip,
}: FeedCreationSuccessStepProps) {
  return (
    <Step>
      <StepTitle>
        Your feed <span>{feedName}</span> has been created. Would you like to
        invite users?
      </StepTitle>

      <StepOptionCard
        title="Invite users"
        titleIcon="send-alt"
        onClick={onInvite}
      />

      <StepOptionCard
        title="Skip for now"
        titleIcon="arrow-right"
        onClick={onSkip}
      />
    </Step>
  );
}
