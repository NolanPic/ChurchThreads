"use client";

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useImperativeHandle,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./Stepper.module.css";

// --- Context ---

interface StepperContextValue {
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
}

const StepperContext = createContext<StepperContextValue | null>(null);

export function useStepper(): StepperContextValue {
  const ctx = useContext(StepperContext);
  if (!ctx) {
    throw new Error("useStepper must be used within a <Stepper>");
  }
  return ctx;
}

// --- Ref ---

export interface StepperRef {
  reset: () => void;
  goToStep: (step: number) => void;
}

// --- Animation ---

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

const slideTransition = {
  x: { type: "spring" as const, stiffness: 300, damping: 30 },
  opacity: { duration: 0.2 },
};

// --- Step ---

export function Step({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// --- Stepper ---

interface StepperProps {
  children: React.ReactNode;
  className?: string;
}

export const Stepper = forwardRef<StepperRef, StepperProps>(function Stepper(
  { children, className },
  ref,
) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);

  // Collect Step children
  const steps = Array.isArray(children) ? children : [children];

  const goToStep = useCallback(
    (step: number) => {
      setDirection(step >= currentStep ? 1 : -1);
      setCurrentStep(step);
    },
    [currentStep],
  );

  const nextStep = useCallback(() => {
    setDirection(1);
    setCurrentStep((prev) => prev + 1);
  }, []);

  const previousStep = useCallback(() => {
    setDirection(-1);
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setDirection(1);
  }, []);

  useImperativeHandle(ref, () => ({ reset, goToStep }), [reset, goToStep]);

  const contextValue: StepperContextValue = { nextStep, previousStep, goToStep };

  return (
    <StepperContext.Provider value={contextValue}>
      <div className={className}>
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={slideTransition}
            className={styles.stepWrapper}
          >
            {steps[currentStep]}
          </motion.div>
        </AnimatePresence>
      </div>
    </StepperContext.Provider>
  );
});
