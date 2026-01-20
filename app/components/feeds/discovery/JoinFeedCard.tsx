"use client";

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { Card, CardHeader, CardBody } from "../../ui/Card";
import Button from "../../ui/Button";
import StackedUsers from "../../users/StackedUsers";
import { useOrganization } from "@/app/context/OrganizationProvider";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ShowMore,
  type ShowMoreRef,
  type ShowMoreToggleLinesFn,
} from "@re-dev/react-truncate";
import styles from "./JoinFeedCard.module.css";

type AvatarUser = {
  _id: Id<"users">;
  name: string;
  image: string | null;
};

interface JoinFeedCardProps {
  feed: Doc<"feeds">;
  isUserMember: boolean;
  users: AvatarUser[];
}

const JoinFeedCard = ({ feed, isUserMember, users }: JoinFeedCardProps) => {
  const org = useOrganization();
  const orgId = org?._id as Id<"organizations">;
  const router = useRouter();
  const joinOpenFeed = useMutation(api.userMemberships.joinOpenFeed);
  const showMoreRef = useRef<ShowMoreRef>(null);

  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(isUserMember);
  const [joinError, setJoinError] = useState<string | null>(null);

  const toggleLines: ShowMoreToggleLinesFn = (e) => {
    showMoreRef.current?.toggleLines(e);
  };

  const handleJoin = async () => {
    setIsJoining(true);
    setJoinError(null);

    try {
      await joinOpenFeed({
        orgId,
        feedId: feed._id,
      });
      setHasJoined(true);
    } catch (error) {
      setJoinError(
        error instanceof Error ? error.message : "Failed to join feed"
      );
    } finally {
      setIsJoining(false);
    }
  };

  const handleView = () => {
    router.push(`/feed/${feed._id}`);
  };

  const getJoinButtonText = () => {
    if (isJoining) return "Joining...";
    if (hasJoined) return "Joined";
    return "Join";
  };

  return (
    <Card>
      <CardHeader className={styles.cardHeader}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <h2 className={styles.title}>{feed.name}</h2>
            {feed.privacy === "public" && (
              <Image
                src="/icons/globe.svg"
                alt="Public feed"
                width={20}
                height={20}
                className={styles.globeIcon}
              />
            )}
          </div>
          <StackedUsers
            users={users}
            numberOfAvatarsToShow={3}
            showRemainingCount={true}
          />
        </div>
      </CardHeader>
      <CardBody className={styles.cardBody}>
        {feed.description && (
          <div className={styles.descriptionContainer}>
            <ShowMore
              ref={showMoreRef}
              lines={3}
              more={
                <>
                  {" ... "}
                  <button
                    className={styles.readMoreButton}
                    onClick={toggleLines}
                  >
                    Read more
                  </button>
                </>
              }
              less={
                <>
                  {" "}
                  <button
                    className={styles.readMoreButton}
                    onClick={toggleLines}
                  >
                    Read less
                  </button>
                </>
              }
            >
              {feed.description}
            </ShowMore>
          </div>
        )}
        <div className={styles.actions}>
          <Button
            variant="primary"
            onClick={handleJoin}
            disabled={isJoining || hasJoined}
          >
            {getJoinButtonText()}
          </Button>
          <Button onClick={handleView}>View</Button>
        </div>
        {joinError && <p className={styles.error}>{joinError}</p>}
      </CardBody>
    </Card>
  );
};

export default JoinFeedCard;
