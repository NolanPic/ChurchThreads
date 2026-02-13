"use client";

import ActionCard from "@/app/components/invites/ActionCard";
import { useStepper } from "./Stepper";

interface StepperControls {
  nextStep: () => void;
  previousStep: () => void;
}

interface StepOptionCardProps {
  title?: string;
  titleIcon?: string;
  description?: string;
  onClick?: (controls: StepperControls) => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  iconPosition?: "left" | "right";
}

export default function StepOptionCard({
  onClick,
  iconPosition,
  ...rest
}: StepOptionCardProps) {
  const { nextStep, previousStep } = useStepper();

  const handleClick = onClick
    ? () => onClick({ nextStep, previousStep })
    : undefined;

  return (
    <ActionCard {...rest} onClick={handleClick} iconPosition={iconPosition} />
  );
}
