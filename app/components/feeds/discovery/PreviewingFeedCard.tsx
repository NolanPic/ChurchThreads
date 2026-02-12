"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardBody } from "../../ui/Card";
import Button from "../../ui/Button";
import { useOrganization } from "@/app/context/OrganizationProvider";
import styles from "./PreviewingFeedCard.module.css";
import { useRouter } from "next/navigation";

interface PreviewingFeedCardProps {
  feedTitle: string;
  feedId: Id<"feeds">;
}

const PreviewingFeedCard = ({ feedTitle, feedId }: PreviewingFeedCardProps) => {
  const org = useOrganization();
  const orgId = org?._id as Id<"organizations">;
  const joinOpenFeed = useMutation(api.userMemberships.joinOpenFeed);

  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const router = useRouter();

  const handleJoin = async () => {
    setIsJoining(true);
    setJoinError(null);

    try {
      await joinOpenFeed({
        orgId,
        feedId,
      });
      setHasJoined(true);
    } catch (error) {
      setJoinError(
        error instanceof Error ? error.message : "Failed to join feed",
      );
    } finally {
      setIsJoining(false);
    }
  };

  const getJoinButtonText = () => {
    if (isJoining) return "Joining...";
    if (hasJoined) return "Joined";
    return "Join";
  };

  return (
    <Card className={styles.currentlyViewingCard}>
      <CardBody>
        <div className={styles.content}>
          <p className={styles.label}>You are viewing the feed:</p>
          <h3 className={styles.feedTitle}>{feedTitle}</h3>
          <div className={styles.actions}>
            <Button
              variant="primary"
              onClick={handleJoin}
              disabled={isJoining || hasJoined}
            >
              {getJoinButtonText()}
            </Button>
            <Button onClick={() => router.push("/")}>View all feeds</Button>
          </div>
          {joinError && <p className={styles.error}>{joinError}</p>}
        </div>
      </CardBody>
    </Card>
  );
};

export default PreviewingFeedCard;
