"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useOrganization } from "@/app/context/OrganizationProvider";
import { Stepper, StepperRef } from "../../ui/Stepper";
import FeedNameStep from "./steps/FeedNameStep";
import FeedDescriptionStep from "./steps/FeedDescriptionStep";
import FeedPrivacyStep from "./steps/FeedPrivacyStep";
import FeedPostingPermissionStep from "./steps/FeedPostingPermissionStep";
import FeedMessagingPermissionStep from "./steps/FeedMessagingPermissionStep";
import FeedCreationSuccessStep from "./steps/FeedCreationSuccessStep";

interface CreateFeedStepperProps {
  onClose: () => void;
  onBack: () => void;
}

export default function CreateFeedStepper({ onClose, onBack }: CreateFeedStepperProps) {
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

  // Name check state
  const [checkingName, setCheckingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const nameExistsResult = useQuery(
    api.feeds.feedNameExists,
    checkingName && org ? { orgId: org._id, name: feedName } : "skip",
  );

  useEffect(() => {
    if (!checkingName) return;
    if (nameExistsResult === undefined) return;

    setCheckingName(false);
    if (nameExistsResult) {
      setNameError("A feed with this name already exists.");
    } else {
      setNameError(null);
      stepperRef.current?.goToStep(currentStep + 1);
    }
  }, [nameExistsResult, checkingName, currentStep]);

  // Creation state
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdFeedId, setCreatedFeedId] = useState<Id<"feeds"> | null>(null);

  const handleCreateFeed = async (): Promise<Id<"feeds"> | null> => {
    if (!org) return null;

    setIsCreating(true);
    setError(null);

    try {
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
    if (!createdFeedId) return;
    onClose();
    router.push(`/feed/${createdFeedId}`);
  };

  const handleNavigateToInvite = () => {
    if (!createdFeedId) return;
    onClose();
    router.push(`/feed/${createdFeedId}/settings`);
  };

  return (
    <Stepper
      ref={stepperRef}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
    >
      <FeedNameStep
        value={feedName}
        onChange={(v) => { setFeedNameSync(v); setNameError(null); }}
        onBack={onBack}
        onContinue={() => setCheckingName(true)}
        nameError={nameError ?? undefined}
        isCheckingName={checkingName}
      />
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
        feedPrivacy={feedPrivacy}
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
        onInvite={handleNavigateToInvite}
        onSkip={handleNavigateToFeed}
      />
    </Stepper>
  );
}
