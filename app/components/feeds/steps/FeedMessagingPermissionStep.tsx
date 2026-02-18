"use client";

import { Step, StepOptionCard, useStepper } from "@/app/components/ui/Stepper";
import StepTitle from "@/app/components/ui/Stepper/StepTitle";
import Hint from "@/app/components/ui/Hint";
import { Id } from "@/convex/_generated/dataModel";
import styles from "./FeedSteps.module.css";

interface FeedMessagingPermissionStepProps {
  feedName: string;
  value: boolean;
  onChange: (value: boolean) => void;
  onComplete: () => Promise<Id<"feeds"> | null>;
  isCreating: boolean;
  error: string | null;
}

export default function FeedMessagingPermissionStep({
  feedName,
  value,
  onChange,
  onComplete,
  isCreating,
  error,
}: FeedMessagingPermissionStepProps) {
  const { nextStep, previousStep } = useStepper();

  const handleChoice = async (choice: boolean) => {
    onChange(choice);
    const feedId = await onComplete();

    // Only advance if feed was successfully created
    if (feedId) {
      nextStep();
    }
  };

  return (
    <Step>
      <StepTitle>
        Should members of {feedName} be able to send messages in threads?
      </StepTitle>

      {error && (
        <Hint type="error" className={styles.error}>
          {error}
        </Hint>
      )}

      <StepOptionCard
        title="Yes"
        titleIcon="check"
        onClick={() => handleChoice(true)}
        disabled={isCreating}
      />

      <StepOptionCard
        title="No"
        titleIcon="circle-x"
        description="Only feed owners can send messages."
        onClick={() => handleChoice(false)}
        disabled={isCreating}
      />

      <StepOptionCard
        title="Back"
        titleIcon="arrow-left"
        iconPosition="left"
        onClick={previousStep}
        disabled={isCreating}
      />
    </Step>
  );
}
