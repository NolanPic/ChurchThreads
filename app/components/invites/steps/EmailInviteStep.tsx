"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useOrganization } from "@/app/context/OrganizationProvider";
import MultiSelectComboBox from "../../ui/MultiSelectComboBox";
import Button from "../../ui/Button";
import Icon from "../../ui/Icon";
import styles from "./EmailInviteStep.module.css";

interface EmailInviteStepProps {
  selectedFeedIds: Id<"feeds">[];
  emailAddresses: string[];
  onEmailAddressesChange: (emails: string[]) => void;
  onSent: () => void;
}

// Simple email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export default function EmailInviteStep({
  selectedFeedIds,
  emailAddresses,
  onEmailAddressesChange,
  onSent,
}: EmailInviteStepProps) {
  const org = useOrganization();
  const orgId = org?._id as Id<"organizations">;

  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const createAndSendEmailInvitations = useAction(
    api.invitesActions.createAndSendEmailInvitations,
  );

  const handleCustomValuesAdded = (values: string[]) => {
    // Add only valid emails
    const validEmails = values.filter(validateEmail);
    onEmailAddressesChange([...emailAddresses, ...validEmails]);
  };

  const handleRemoveEmail = (email: string) => {
    onEmailAddressesChange(emailAddresses.filter((e) => e !== email));
  };

  const handleSend = async () => {
    if (emailAddresses.length === 0) return;

    setIsSending(true);
    setError(null);

    try {
      const usersToInvite = emailAddresses.map((email) => ({
        email: email.trim(),
      }));

      const results = await createAndSendEmailInvitations({
        orgId,
        feeds: selectedFeedIds,
        usersToInvite,
      });

      // Check for any failures
      const failures = results.filter((r) => !r.success);
      if (failures.length > 0) {
        const failedEmails = failures.map((f) => f.email).join(", ");
        setError(`Failed to send to: ${failedEmails}`);
      }

      // If any succeeded, show success
      const successes = results.filter((r) => r.success);
      if (successes.length > 0) {
        setShowSuccess(true);
        // Clear the sent emails
        const failedEmailSet = new Set(failures.map((f) => f.email));
        onEmailAddressesChange(
          emailAddresses.filter((e) => failedEmailSet.has(e)),
        );
        onSent();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send invitations",
      );
    } finally {
      setIsSending(false);
    }
  };

  if (showSuccess && emailAddresses.length === 0) {
    return (
      <div className={styles.successCard}>
        <Icon name="send" size={48} className={styles.cardIcon} />
        <h2 className={styles.successTitle}>Invites sent!</h2>
        <p className={styles.cardDescription}>
          Your invitation emails have been sent successfully.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <Icon name="send" size={24} className={styles.cardIcon} />
        <h2 className={styles.cardTitle}>Send invites</h2>
      </div>
      <div className={styles.emailContent}>
        <p className={styles.instructions}>
          Enter email addresses separated by commas, spaces, or press Enter
          after each one.
        </p>

        <MultiSelectComboBox
          allowCustomValues
          validateCustomValue={validateEmail}
          onCustomValuesAdded={handleCustomValuesAdded}
          customSelections={emailAddresses}
          onChange={(value, isDeselecting) => {
            if (isDeselecting) {
              handleRemoveEmail(value);
            }
          }}
          placeholder="Enter email addresses..."
          disabled={isSending}
        />

        {error && (
          <p className={`${styles.cardDescription} ${styles.errorText}`}>
            {error}
          </p>
        )}

        <Button
          variant="primary"
          className={styles.primaryButton}
          onClick={handleSend}
          disabled={isSending || emailAddresses.length === 0}
        >
          {isSending ? "Sending..." : "Send"}
        </Button>
      </div>
    </div>
  );
}
