"use client";

import { useRef } from "react";
import { Step, StepOptionCard, useStepper } from "@/app/components/ui/Stepper";
import { Input, InputHandle } from "@/app/components/ui/Input";
import Button from "@/app/components/ui/Button";
import styles from "./FeedSteps.module.css";

interface FeedNameStepProps {
  value: string;
  onChange: (value: string) => void;
}

export default function FeedNameStep({ value, onChange }: FeedNameStepProps) {
  const inputRef = useRef<InputHandle>(null);
  const { nextStep } = useStepper();

  const handleContinue = () => {
    if (inputRef.current?.validate()) {
      nextStep();
    }
  };

  return (
    <Step>
      <StepOptionCard
        title="Name your feed"
        titleIcon="pencil"
        description="Keep it short and meaningful!"
      >
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Name of your feed"
          validationConfig={{
            required: true,
            minLength: 4,
            maxLength: 25,
          }}
          fieldName="Feed name"
          inputClassName={styles.input}
          className={styles.inputWrap}
        />
        <Button
          variant="primary"
          onClick={handleContinue}
          className={styles.continueButton}
        >
          Continue
        </Button>
      </StepOptionCard>
    </Step>
  );
}
