"use client";

import { useState, useMemo } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useOrganization } from "@/app/context/OrganizationProvider";
import ActionCard from "../ActionCard";
import MultiSelectComboBox, {
  MultiSelectOption,
} from "../../ui/MultiSelectComboBox";
import Button from "../../ui/Button";
import styles from "./SelectFeedsStep.module.css";

interface FeedOption extends MultiSelectOption {
  _id: Id<"feeds">;
}

interface SelectFeedsStepProps {
  feed?: Doc<"feeds">; // Pre-selected feed
  selectedFeedIds: Id<"feeds">[];
  onFeedIdsChange: (feedIds: Id<"feeds">[]) => void;
  onComplete: (feedIds: Id<"feeds">[], token: string) => void;
  onSkip: (token: string) => void;
}

export default function SelectFeedsStep({
  feed,
  selectedFeedIds,
  onFeedIdsChange,
  onComplete,
  onSkip,
}: SelectFeedsStepProps) {
  const org = useOrganization();
  const orgId = org?._id as Id<"organizations">;

  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createInvitation = useAction(api.invitesActions.createInvitation);

  // Get user's feeds with memberships
  const feedsData = useQuery(api.feeds.getUserFeedsWithMemberships, { orgId });
  const { userFeeds = [], feeds = [] } = feedsData || {};

  // Filter to feeds where user is owner
  const ownedFeeds = useMemo(() => {
    const ownerFeedIds = new Set(
      userFeeds.filter((uf) => uf.owner).map((uf) => uf.feedId),
    );
    return feeds.filter((f) => ownerFeedIds.has(f._id));
  }, [userFeeds, feeds]);

  // Create options for the multiselect, excluding the pre-selected feed
  const feedOptions: FeedOption[] = useMemo(() => {
    return ownedFeeds
      .filter((f) => !feed || f._id !== feed._id)
      .map((f) => ({
        _id: f._id,
        text: f.name,
        value: f._id,
      }));
  }, [ownedFeeds, feed]);

  // Get the additional selected feed IDs (excluding the pre-selected feed)
  const additionalSelectedIds = useMemo(() => {
    if (!feed) return selectedFeedIds;
    return selectedFeedIds.filter((id) => id !== feed._id);
  }, [selectedFeedIds, feed]);

  const handleFeedChange = (value: string, isDeselecting: boolean) => {
    const feedId = value as Id<"feeds">;
    if (isDeselecting) {
      onFeedIdsChange(selectedFeedIds.filter((id) => id !== feedId));
    } else {
      onFeedIdsChange([...selectedFeedIds, feedId]);
    }
  };

  const handleCreateInvitation = async (feedIds: Id<"feeds">[]) => {
    setIsCreating(true);
    setError(null);

    try {
      const result = await createInvitation({
        orgId,
        type: "link",
        feeds: feedIds,
      });
      return result.token;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create invitation",
      );
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  const handleContinue = async () => {
    const feedIds =
      selectedFeedIds.length > 0 ? selectedFeedIds : feed ? [feed._id] : [];
    const token = await handleCreateInvitation(feedIds);
    if (token) {
      onComplete(feedIds, token);
    }
  };

  const handleSkip = async () => {
    if (!feed) return;
    const token = await handleCreateInvitation([feed._id]);
    if (token) {
      onSkip(token);
    }
  };

  const hasOtherFeeds = feedOptions.length > 0;

  const message = feed
    ? `Should the invited user(s) be added to other feeds besides "${feed.name}"?`
    : "Select feeds to add the invited user(s) to.";

  return (
    <div className={styles.options}>
      <ActionCard title="Add to feeds" titleIcon="plus" description={message}>
        {hasOtherFeeds ? (
          <MultiSelectComboBox
            options={feedOptions}
            values={additionalSelectedIds}
            onChange={handleFeedChange}
            placeholder="Select feeds..."
            disabled={isCreating}
            className={styles.feedSelect}
          />
        ) : (
          <p className={styles.description}>
            You don&apos;t have any other feeds to add to.
          </p>
        )}

        {error && <p className={styles.errorText}>{error}</p>}

        <Button
          variant="primary"
          className={styles.continueWithSelectedFeedsBtn}
          onClick={handleContinue}
          disabled={isCreating}
        >
          {isCreating ? "Preparing invite..." : "Continue"}
        </Button>
      </ActionCard>

      {feed && (
        <ActionCard
          title="Skip"
          titleIcon="arrow-right"
          onClick={handleSkip}
        ></ActionCard>
      )}
    </div>
  );
}
