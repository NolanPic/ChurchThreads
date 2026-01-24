"use client";

import { useState, useCallback } from "react";

export type InviteStep = "method" | "feeds" | "qr" | "email";

interface UseInviteStepsReturn {
  currentStep: InviteStep;
  direction: number; // +1 forward, -1 backward (for animation)
  goToStep: (step: InviteStep) => void;
  resetSteps: () => void;
}

const STEP_ORDER: InviteStep[] = ["method", "feeds", "qr", "email"];

function getStepIndex(step: InviteStep): number {
  const index = STEP_ORDER.indexOf(step);
  // qr and email are both at position 2 (after feeds)
  if (step === "qr" || step === "email") return 2;
  return index;
}

export function useInviteSteps(): UseInviteStepsReturn {
  const [currentStep, setCurrentStep] = useState<InviteStep>("method");
  const [direction, setDirection] = useState<number>(1);

  // Go to a specific step
  const goToStep = useCallback((step: InviteStep) => {
    const currentIndex = getStepIndex(currentStep);
    const newIndex = getStepIndex(step);
    setDirection(newIndex >= currentIndex ? 1 : -1);
    setCurrentStep(step);
  }, [currentStep]);

  // Reset to initial state
  const resetSteps = useCallback(() => {
    setCurrentStep("method");
    setDirection(1);
  }, []);

  return {
    currentStep,
    direction,
    goToStep,
    resetSteps,
  };
}
