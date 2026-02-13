"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Stepper, Step, StepperRef } from "../ui/Stepper";
import Modal from "../ui/Modal";
import InviteMethodStep from "./steps/InviteMethodStep";
import SelectFeedsStep from "./steps/SelectFeedsStep";
import QRCodeStep from "./steps/QRCodeStep";
import EmailInviteStep from "./steps/EmailInviteStep";
import styles from "./InviteModal.module.css";
import methodStyles from "./steps/InviteMethodStep.module.css";
import feedsStyles from "./steps/SelectFeedsStep.module.css";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  feed?: Doc<"feeds">;
}

export default function InviteModal({
  isOpen,
  onClose,
  feed,
}: InviteModalProps) {
  const stepperRef = useRef<StepperRef>(null);

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
      stepperRef.current?.reset();
    }
  }, [isOpen, feed]);

  // Feeds selection complete handler
  const handleFeedsComplete = useCallback(
    (feedIds: Id<"feeds">[], token: string) => {
      setSelectedFeedIds(feedIds);
      setInviteToken(token);
    },
    [],
  );

  // Handle skip (when a feed is pre-selected)
  const handleSkip = useCallback((token: string) => {
    setInviteToken(token);
  }, []);

  // Email sent handler
  const handleEmailsSent = useCallback(() => {
    // Keep modal open to show success, user can close manually
  }, []);

  return (
    <Modal
      title="Invite"
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel="Invite new users"
      dragToClose
    >
      <Stepper ref={stepperRef} className={styles.content}>
        <Step className={methodStyles.step}>
          <InviteMethodStep onSelectMethod={setInviteMethod} />
        </Step>
        <Step className={feedsStyles.step}>
          <SelectFeedsStep
            feed={feed}
            selectedFeedIds={selectedFeedIds}
            onFeedIdsChange={setSelectedFeedIds}
            onComplete={handleFeedsComplete}
            onSkip={handleSkip}
          />
        </Step>
        <Step>
          {inviteMethod === "qr" ? (
            <QRCodeStep inviteToken={inviteToken} />
          ) : (
            <EmailInviteStep
              selectedFeedIds={selectedFeedIds}
              emailAddresses={emailAddresses}
              onEmailAddressesChange={setEmailAddresses}
              onSent={handleEmailsSent}
            />
          )}
        </Step>
      </Stepper>
    </Modal>
  );
}
