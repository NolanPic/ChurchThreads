"use client";

import { useRef } from "react";
import { Step, StepOptionCard, useStepper } from "@/app/components/ui/Stepper";
import { Input, InputHandle } from "@/app/components/ui/Input";
import Button from "@/app/components/ui/Button";
import styles from "./FeedSteps.module.css";

interface FeedDescriptionStepProps {
  value: string;
  onChange: (value: string) => void;
}

export default function FeedDescriptionStep({ value, onChange }: FeedDescriptionStepProps) {
  const inputRef = useRef<InputHandle>(null);
  const { nextStep, previousStep } = useStepper();

  const handleContinue = () => {
    if (inputRef.current?.validate()) {
      nextStep();
    }
  };

  return (
    <Step>
      <StepOptionCard
        title="Describe your feed"
        titleIcon="notebook-pen"
        description="What's your feed for?"
      >
        <Input
          ref={inputRef}
          label="Description (optional)"
          multiline
          rows={4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Describe what this feed is for..."
          validationConfig={{
            maxLength: 100,
          }}
          fieldName="Description"
          className={styles.input}
        />
        <Button
          variant="primary"
          onClick={handleContinue}
          className={styles.continueButton}
        >
          Continue
        </Button>
      </StepOptionCard>

      <StepOptionCard
        title="Back"
        titleIcon="arrow-left"
        iconPosition="left"
        onClick={({ previousStep }) => previousStep()}
      />
    </Step>
  );
}
