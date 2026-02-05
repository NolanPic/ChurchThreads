import styles from "./Thread.module.css";
import userContentStyles from "@/app/shared/styles/user-content.module.css";
import { Doc, Id } from "@/convex/_generated/dataModel";
import Image from "next/image";
import Link from "next/link";
import { getTimeAgoLabel } from "@/app/utils/ui-utils";
import UserAvatar from "../../users/UserAvatar";
import SanitizedUserContent from "../../ui/SanitizedUserContent";
import classNames from "classnames";
import { useState, useEffect, useRef, memo } from "react";
import { useUserAuth } from "@/auth/client/useUserAuth";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useOrganization } from "@/app/context/OrganizationProvider";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../../ui/Button";

interface ThreadProps {
  thread: Doc<"threads"> & {
    author: Omit<Doc<"users">, "image"> & { image: string | null };
  } & {
    feed: Doc<"feeds"> | null;
    messageCount?: number;
  };
  variant: "feed" | "threadDetails";
  showSourceFeed: boolean;
  onOpenThread?: (threadId: Id<"threads">) => void;
  onThreadDeleted?: () => void;
}

export default memo(function Thread({
  thread,
  variant,
  showSourceFeed,
  onOpenThread,
  onThreadDeleted,
}: ThreadProps) {
  const { _id, content } = thread;
  const [auth] = useUserAuth();
  const org = useOrganization();
  const orgId = org?._id as Id<"organizations">;
  const deleteThread = useMutation(api.threads.deleteThread);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const postedAt = thread.postedAt ?? thread._creationTime;
  const timeAgoLabel = getTimeAgoLabel(postedAt);
  const postedInLink = thread.feed ? (
    <Link
      href={`/feed/${thread.feed._id}`}
      onClick={(e) => e.stopPropagation()}
    >
      {thread.feed.name}
    </Link>
  ) : null;

  // Check if user can delete this thread
  useEffect(() => {
    if (!auth || !thread.feed) {
      setCanDelete(false);
      return;
    }

    const user = auth.getUser();
    if (!user) {
      setCanDelete(false);
      return;
    }

    // User can delete if they're the author or a feed owner
    const isAuthor = thread.posterId === user._id;

    auth
      .feed(thread.feed._id)
      .hasRole("owner")
      .then((result) => {
        setCanDelete(isAuthor || result.allowed);
      });
  }, [auth, thread.posterId, thread.feed]);

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleDeleteThread = async () => {
    if (!confirm("Are you sure you want to delete this thread?")) {
      return;
    }

    try {
      onThreadDeleted?.();

      // Hack: wait for the navigation/modal close animation to complete
      // before deleting the thread to avoid query errors
      await new Promise((resolve) => setTimeout(resolve, 300));

      await deleteThread({ orgId, threadId: _id });
    } catch (error) {
      console.error("Failed to delete thread:", error);
      alert("Failed to delete thread. Please try again.");
    }
  };

  const handleThreadClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only handle left clicks
    if (e.button !== 0) return;

    // Ignore clicks with modifier keys
    if (e.ctrlKey || e.metaKey || e.shiftKey) return;

    // Don't open thread if user has selected text
    if (window.getSelection()?.toString().length) return;

    // If menu is open, close it instead of opening thread
    if (isMenuOpen) {
      setIsMenuOpen(false);
      return;
    }

    // Open the thread
    if (variant === "feed" && onOpenThread) {
      onOpenThread(thread._id);
    }
  };

  const handleThreadKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Support keyboard navigation: Enter and Space keys
    if (
      variant === "feed" &&
      onOpenThread &&
      (e.key === "Enter" || e.key === " ")
    ) {
      e.preventDefault();
      onOpenThread(thread._id);
    }
  };

  const getTimeAndSourceFeed = () => {
    if (showSourceFeed && thread.feed) {
      return (
        <>
          {timeAgoLabel}
          <span className={styles.postedIn_tabletUp}>
            {" in "}
            {postedInLink}
          </span>
        </>
      );
    }
    return timeAgoLabel;
  };

  const messageCount =
    variant === "feed" && thread.messageCount && thread.messageCount > 0
      ? thread.messageCount > 99
        ? "99+"
        : thread.messageCount
      : null;

  return (
    <article key={_id} className={styles.threadWrapper}>
      <div
        className={styles.thread}
        onClick={handleThreadClick}
        onKeyDown={handleThreadKeyDown}
        role={variant === "feed" ? "button" : undefined}
        tabIndex={variant === "feed" ? 0 : undefined}
        aria-label={
          variant === "feed"
            ? `View thread by ${thread.author?.name}`
            : undefined
        }
      >
        <div className={styles.authorAvatar}>
          <UserAvatar user={thread.author} />
        </div>
        <p className={styles.authorName}>{thread.author?.name}</p>
        <p
          className={styles.metadata}
          title={`Posted ${timeAgoLabel}${thread.feed ? ` in ${thread.feed.name}` : ""}`}
        >
          {getTimeAndSourceFeed()}
        </p>
        {canDelete && (
          <div
            className={styles.threadMenu}
            ref={menuRef}
            data-menu-open={isMenuOpen}
          >
            <Button
              icon="ellipsis"
              ariaLabel="Thread options"
              iconSize={24}
              className={styles.threadMenuButton}
              onClick={(e: React.MouseEvent<HTMLElement>) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              noBackground
            />
            <AnimatePresence>
              {isMenuOpen && (
                <motion.ul
                  className={styles.threadMenuList}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.1 }}
                >
                  <li className={styles.threadMenuItem}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMenuOpen(false);
                        handleDeleteThread();
                      }}
                    >
                      Delete thread
                    </button>
                  </li>
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        )}
        {variant === "feed" && (
          <button
            className={styles.messageThreadButton}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenThread?.(thread._id);
            }}
          >
            {messageCount && (
              <span className={styles.messageThreadCount}>{messageCount}</span>
            )}
            <Image
              className={styles.messageThreadIcon}
              src="/icons/messages.svg"
              alt="View message thread"
              width={20}
              height={20}
            />
          </button>
        )}
        <div
          className={classNames(styles.content, userContentStyles.userContent)}
          onClick={(e) => {
            // Stop propagation if clicking on a link
            if ((e.target as HTMLElement).tagName === "A") {
              e.stopPropagation();
            }
          }}
          onKeyDown={(e) => {
            // Stop propagation if navigating a link via keyboard
            if (
              (e.target as HTMLElement).tagName === "A" &&
              (e.key === "Enter" || e.key === " ")
            ) {
              e.stopPropagation();
            }
          }}
        >
          <SanitizedUserContent html={content} />
        </div>
      </div>

      {showSourceFeed && thread.feed && (
        <p className={styles.postedIn}>Posted in {postedInLink}</p>
      )}
    </article>
  );
});
