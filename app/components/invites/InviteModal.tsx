"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useInviteSteps, InviteStep } from "./hooks/useInviteSteps";
import Modal from "../ui/Modal";
import InviteMethodStep from "./steps/InviteMethodStep";
import SelectFeedsStep from "./steps/SelectFeedsStep";
import QRCodeStep from "./steps/QRCodeStep";
import EmailInviteStep from "./steps/EmailInviteStep";
import styles from "./InviteModal.module.css";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  feed?: Doc<"feeds">;
}

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

export default function InviteModal({
  isOpen,
  onClose,
  feed,
}: InviteModalProps) {
  const { currentStep, direction, goToStep, resetSteps } = useInviteSteps();

  // State management
  const [inviteMethod, setInviteMethod] = useState<"email" | "qr" | null>(null);
  const [selectedFeedIds, setSelectedFeedIds] = useState<Id<"feeds">[]>([]);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [emailAddresses, setEmailAddresses] = useState<string[]>([]);

  // Pre-select feed if provided
  useEffect(() => {
    if (feed && isOpen) {
      setSelectedFeedIds([feed._id]);
    }
  }, [feed, isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setInviteMethod(null);
      setSelectedFeedIds(feed ? [feed._id] : []);
      setInviteToken(null);
      setEmailAddresses([]);
      resetSteps();
    }
  }, [isOpen, feed, resetSteps]);

  // Method selection handler
  const handleMethodSelect = useCallback(
    (method: "email" | "qr") => {
      setInviteMethod(method);
      goToStep("feeds");
    },
    [goToStep],
  );

  // Feeds selection complete handler
  const handleFeedsComplete = useCallback(
    (feedIds: Id<"feeds">[], token: string) => {
      setSelectedFeedIds(feedIds);
      setInviteToken(token);
      if (inviteMethod === "qr") {
        goToStep("qr");
      } else {
        goToStep("email");
      }
    },
    [inviteMethod, goToStep],
  );

  // Handle skip (when a feed is pre-selected)
  const handleSkip = useCallback(
    (token: string) => {
      setInviteToken(token);
      if (inviteMethod === "qr") {
        goToStep("qr");
      } else {
        goToStep("email");
      }
    },
    [inviteMethod, goToStep],
  );

  // Email sent handler
  const handleEmailsSent = useCallback(() => {
    // Keep modal open to show success, user can close manually
  }, []);

  // Render current step
  const renderStep = (step: InviteStep) => {
    switch (step) {
      case "method":
        return <InviteMethodStep onSelectMethod={handleMethodSelect} />;
      case "feeds":
        return (
          <SelectFeedsStep
            feed={feed}
            selectedFeedIds={selectedFeedIds}
            onFeedIdsChange={setSelectedFeedIds}
            onComplete={handleFeedsComplete}
            onSkip={handleSkip}
          />
        );
      case "qr":
        return <QRCodeStep inviteToken={inviteToken} />;
      case "email":
        return (
          <EmailInviteStep
            selectedFeedIds={selectedFeedIds}
            emailAddresses={emailAddresses}
            onEmailAddressesChange={setEmailAddresses}
            onSent={handleEmailsSent}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      title="Invite"
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel="Invite new users"
      dragToClose
    >
      <div className={styles.content}>
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
            {renderStep(currentStep)}
          </motion.div>
        </AnimatePresence>
      </div>
    </Modal>
  );
}
