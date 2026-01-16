"use client";

import { useState, useEffect } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { useUserAuth } from "@/auth/client/useUserAuth";
import Button from "./common/Button";
import styles from "./FeedEmptyState.module.css";

interface FeedEmptyStateProps {
  feedId: Id<"feeds"> | undefined;
  onNewThread: () => void;
}

export default function FeedEmptyState({
  feedId,
  onNewThread,
}: FeedEmptyStateProps) {
  const [auth] = useUserAuth();
  const [canUserPost, setCanUserPost] = useState(false);

  useEffect(() => {
    if (!auth) {
      setCanUserPost(false);
      return;
    }

    if (!feedId) {
      return;
    }

    auth
      .feed(feedId)
      .canPost()
      .then((result) => setCanUserPost(result.allowed));
  }, [auth, feedId]);

  return (
    <div className={styles.emptyState}>
      <p className={styles.emptyStateMessage}>
        {canUserPost
          ? "There's nothing here yet. Post your first thread!"
          : "There's nothing here yet!"}
      </p>
      {canUserPost && (
        <Button
          variant="primary"
          icon="pen"
          onClick={onNewThread}
          className={styles.newThreadButton}
          iconSize={20}
        >
          New thread
        </Button>
      )}
    </div>
  );
}
