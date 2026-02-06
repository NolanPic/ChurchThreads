"use client";

import { useContext, useEffect } from "react";
import { CurrentFeedAndThreadContext } from "@/app/context/CurrentFeedAndThreadProvider";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import styles from "./ThreadModalContent.module.css";
import { useOrganization } from "@/app/context/OrganizationProvider";
import MessageThread from "../messages/MessageThread";
import Thread from "./Thread";
import { useUserAuth } from "@/auth/client/useUserAuth";

export default function ThreadModalContent({
  threadId,
  onClose,
}: {
  threadId: Id<"threads">;
  onClose: () => void;
}) {
  const org = useOrganization();
  const [, { isLoading: isAuthLoading }] = useUserAuth();
  const { setFeedIdOfCurrentThread } = useContext(CurrentFeedAndThreadContext);
  const thread = useQuery(
    api.threads.getById,
    !isAuthLoading && org?._id ? { orgId: org._id, threadId } : "skip"
  );

  const feedId = thread?.feedId;

  useEffect(() => {
    setFeedIdOfCurrentThread(feedId);

    return () => setFeedIdOfCurrentThread(undefined);
  }, [feedId, setFeedIdOfCurrentThread]);

  if (!thread) {
    return <p>Loading thread...</p>;
  }

  return (
    <div>
      <div className={styles.threadWrapper}>
        <Thread
          thread={thread}
          variant="threadDetails"
          showSourceFeed
          onThreadDeleted={onClose}
        />
      </div>
      <hr className={styles.threadSeparator} />
      <MessageThread threadId={thread._id} />
    </div>
  );
}
