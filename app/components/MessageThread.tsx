"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import MessageEditor from "./editor/MessageEditor";
import Message from "./Message";
import { useUserAuth } from "@/auth/client/useUserAuth";
import { useOrganization } from "../context/OrganizationProvider";
import { useMediaQuery } from "@/app/hooks/useMediaQuery";
import styles from "./MessageThread.module.css";
import { getTimeAgoLabel } from "../utils/ui-utils";
import Hint from "./common/Hint";
import Link from "next/link";
import { motion, useMotionValue, animate } from "motion/react";
import { useState, useEffect } from "react";

export default function MessageThread({ threadId }: { threadId: Id<"threads"> }) {
  const org = useOrganization();
  const orgId = org?._id as Id<"organizations">;
  const thread = useQuery(api.threads.getById, {
    orgId,
    threadId,
  });
  const messages = useQuery(api.messages.getForThread, { orgId, threadId });
  const [auth, { isLoading: isUserLoading, user }] = useUserAuth();
  const [canSendMessage, setCanSendMessage] = useState(false);

  const isSignedIn = auth !== null;

  // Check if user can send message using new auth system
  useEffect(() => {
    if (!auth || !thread?.feedId) {
      setCanSendMessage(false);
      return;
    }

    auth
      .feed(thread.feedId)
      .canMessage()
      .then((result) => {
        setCanSendMessage(result.allowed);
      });
  }, [auth, thread?.feedId]);

  const isTabletOrUp = useMediaQuery("(min-width: 34.375rem)");
  const doAnimateTimeStampRevealOnPhone = !isTabletOrUp;
  const x = useMotionValue(0);

  if (messages === undefined) {
    return <p>Loading messages...</p>;
  }

  return (
    <>
      {messages?.length > 0 && (
        <div className={styles.messagesContainer}>
          <motion.ol
            className={styles.messages}
            drag={doAnimateTimeStampRevealOnPhone ? "x" : false}
            dragConstraints={{ left: -80, right: 0 }}
            dragElastic={0.01}
            dragMomentum={false}
            style={{ x }}
            onDragEnd={() => {
              animate(x, 0, {
                type: "spring",
                stiffness: 400,
                damping: 30,
              });
            }}
          >
            {messages?.map((m) => {
              const postedAt = m?._creationTime;
              const timeAgoLabel = getTimeAgoLabel(postedAt);
              return (
                <Message
                  key={m._id}
                  message={m}
                  feedId={thread!.feedId}
                  timeAgoLabel={timeAgoLabel}
                  isCurrentUser={m.sender._id === user?._id}
                  isTabletOrUp={isTabletOrUp}
                />
              );
            })}
          </motion.ol>
        </div>
      )}
      {!isSignedIn ? (
        <Hint type="info" className={styles.hint}>
          <p>
            You can <Link href="/login">sign in</Link> to send messages.
          </p>
        </Hint>
      ) : !canSendMessage && !isUserLoading ? (
        <Hint type="info" className={styles.hint}>
          <p>You don&apos;t have permission to send messages in this feed.</p>
        </Hint>
      ) : (
        <div className={styles.messageEditorWrapper}>
          <MessageEditor threadId={threadId} />
        </div>
      )}
    </>
  );
}
