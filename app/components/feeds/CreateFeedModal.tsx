"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useOrganization } from "@/app/context/OrganizationProvider";
import { Stepper, StepperRef } from "../ui/Stepper";
import Modal from "../ui/Modal";
import FeedNameStep from "./steps/FeedNameStep";
import FeedDescriptionStep from "./steps/FeedDescriptionStep";
import FeedPrivacyStep from "./steps/FeedPrivacyStep";
import FeedPostingPermissionStep from "./steps/FeedPostingPermissionStep";
import FeedMessagingPermissionStep from "./steps/FeedMessagingPermissionStep";
import FeedCreationSuccessStep from "./steps/FeedCreationSuccessStep";
import styles from "./CreateFeedModal.module.css";

interface CreateFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateFeedModal({
  isOpen,
  onClose,
}: CreateFeedModalProps) {
  const stepperRef = useRef<StepperRef>(null);
  const router = useRouter();
  const org = useOrganization();
  const createFeed = useMutation(api.feeds.createFeed);

  // Step state
  const [currentStep, setCurrentStep] = useState(0);

  // Form state
  const [feedName, setFeedName] = useState("");
  const [feedDescription, setFeedDescription] = useState("");
  const [feedPrivacy, setFeedPrivacy] = useState<"public" | "private" | "open">(
    "private",
  );
  const [canPost, setCanPost] = useState(false);
  const [canMessage, setCanMessage] = useState(false);

  // Ref to track form data synchronously (no batching delays)
  const formDataRef = useRef({
    feedName: "",
    feedDescription: "",
    feedPrivacy: "private" as "public" | "private" | "open",
    canPost: false,
    canMessage: false,
  });

  // Update both state (for UI) and ref (for mutation)
  const setFeedNameSync = (value: string) => {
    formDataRef.current.feedName = value;
    setFeedName(value);
  };

  const setFeedDescriptionSync = (value: string) => {
    formDataRef.current.feedDescription = value;
    setFeedDescription(value);
  };

  const setFeedPrivacySync = (value: "public" | "private" | "open") => {
    formDataRef.current.feedPrivacy = value;
    setFeedPrivacy(value);
  };

  const setCanPostSync = (value: boolean) => {
    formDataRef.current.canPost = value;
    setCanPost(value);
  };

  const setCanMessageSync = (value: boolean) => {
    formDataRef.current.canMessage = value;
    setCanMessage(value);
  };

  // Creation state
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdFeedId, setCreatedFeedId] = useState<Id<"feeds"> | null>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Reset ref
      formDataRef.current = {
        feedName: "",
        feedDescription: "",
        feedPrivacy: "private",
        canPost: false,
        canMessage: false,
      };

      // Reset state
      setCurrentStep(0);
      setFeedName("");
      setFeedDescription("");
      setFeedPrivacy("private");
      setCanPost(false);
      setCanMessage(false);
      setIsCreating(false);
      setError(null);
      setCreatedFeedId(null);
      stepperRef.current?.reset();
    }
  }, [isOpen]);

  const handleCreateFeed = async (): Promise<Id<"feeds"> | null> => {
    if (!org) return null;

    setIsCreating(true);
    setError(null);

    try {
      // Read from ref instead of state - always has latest values
      const { canPost, canMessage, feedName, feedDescription, feedPrivacy } =
        formDataRef.current;

      const memberPermissions: ("post" | "message")[] = [];
      if (canPost) memberPermissions.push("post");
      if (canMessage) memberPermissions.push("message");

      const feedId = await createFeed({
        orgId: org._id,
        name: feedName,
        description: feedDescription || undefined,
        privacy: feedPrivacy,
        memberPermissions:
          memberPermissions.length > 0 ? memberPermissions : undefined,
      });

      setCreatedFeedId(feedId);
      return feedId;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create feed");
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  const handleNavigateToFeed = () => {
    onClose();
    router.push(`/feed/${createdFeedId}`);
  };

  const handleNavigateToInvite = () => {
    onClose();
    router.push(`/feed/${createdFeedId}/settings`);
  };

  return (
    <Modal
      title="Create feed"
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel="Create a new feed"
      dragToClose
    >
      <Stepper
        ref={stepperRef}
        className={styles.content}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
      >
        <FeedNameStep value={feedName} onChange={setFeedNameSync} />
        <FeedDescriptionStep
          value={feedDescription}
          onChange={setFeedDescriptionSync}
        />
        <FeedPrivacyStep
          feedName={feedName}
          value={feedPrivacy}
          onChange={setFeedPrivacySync}
        />
        <FeedPostingPermissionStep
          feedName={feedName}
          value={canPost}
          onChange={setCanPostSync}
        />
        <FeedMessagingPermissionStep
          feedName={feedName}
          value={canMessage}
          onChange={setCanMessageSync}
          onComplete={handleCreateFeed}
          isCreating={isCreating}
          error={error}
        />
        <FeedCreationSuccessStep
          feedName={feedName}
          feedId={createdFeedId!}
          onInvite={handleNavigateToInvite}
          onSkip={handleNavigateToFeed}
        />
      </Stepper>
    </Modal>
  );
}
