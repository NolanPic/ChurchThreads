"use client";

import { useRef } from "react";
import { Step, StepOptionCard } from "@/app/components/ui/Stepper";
import { Input, InputHandle } from "@/app/components/ui/Input";
import Button from "@/app/components/ui/Button";
import styles from "./FeedSteps.module.css";

interface FeedNameStepProps {
  value: string;
  onChange: (value: string) => void;
  onBack: () => void;
  onContinue: () => void;
  nameError?: string;
  isCheckingName?: boolean;
}

export default function FeedNameStep({ value, onChange, onBack, onContinue, nameError, isCheckingName }: FeedNameStepProps) {
  const inputRef = useRef<InputHandle>(null);

  const handleContinue = () => {
    if (inputRef.current?.validate()) {
      onContinue();
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
          error={nameError}
        />
        <Button
          variant="primary"
          onClick={handleContinue}
          className={styles.continueButton}
          disabled={isCheckingName}
        >
          {isCheckingName ? "Checking..." : "Continue"}
        </Button>
      </StepOptionCard>
      <StepOptionCard
        title="Back"
        titleIcon="arrow-left"
        iconPosition="left"
        onClick={() => onBack()}
      />
    </Step>
  );
}
