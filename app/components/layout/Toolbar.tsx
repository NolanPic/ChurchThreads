import styles from "./Toolbar.module.css";
import IconButton from "../ui/IconButton";
import { useUserAuth } from "@/auth/client/useUserAuth";
import OverflowMenu from "./OverflowMenu";
import FeedSelector from "../feeds/FeedSelector";
import { useContext, RefObject, useState, useEffect, memo } from "react";
import { CurrentFeedAndThreadContext } from "@/app/context/CurrentFeedAndThreadProvider";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useFloating, offset } from "@floating-ui/react-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useOrganization } from "@/app/context/OrganizationProvider";
import { Id } from "@/convex/_generated/dataModel";
import NotificationsSidebar from "../notifications/NotificationsSidebar";

interface ToolbarProps {
  onNewThread: () => void;
  isNewThreadOpen: boolean;
  setIsNewThreadOpen: (isNewThreadOpen: boolean) => void;
  feedWrapperRef: RefObject<HTMLDivElement | null>;
}

export default memo(function Toolbar({
  onNewThread,
  isNewThreadOpen,
  setIsNewThreadOpen,
  feedWrapperRef,
}: ToolbarProps) {
  const [auth, { user }] = useUserAuth();
  const { feedId } = useContext(CurrentFeedAndThreadContext);
  const [isFeedOwner, setIsFeedOwner] = useState(false);
  const [isFeedMember, setIsFeedMember] = useState(false);
  const [isNotificationsSidebarOpen, setIsNotificationsSidebarOpen] =
    useState(false);
  const [canUserPostInSelectedFeed, setCanUserPostInSelectedFeed] =
    useState(false);

  const org = useOrganization();
  const orgId = org?._id as Id<"organizations">;

  const isSignedIn = auth !== null;
  const isAdmin = user?.role === "admin";

  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    isSignedIn && orgId ? { orgId } : "skip",
  );

  // Check feed ownership and membership asynchronously
  useEffect(() => {
    if (!auth || !feedId) {
      setIsFeedOwner(false);
      setIsFeedMember(false);
      return;
    }

    // Check if user is an owner
    auth
      .feed(feedId)
      .hasRole("owner")
      .then((result) => {
        setIsFeedOwner(result.allowed);
      });

    // Check if user is a member (includes owners)
    auth
      .feed(feedId)
      .hasRole("member")
      .then((result) => {
        setIsFeedMember(result.allowed);
      });
  }, [auth, feedId]);

  useEffect(() => {
    if (!auth) {
      return;
    }

    // Check if user can post a thread
    if (!feedId) {
      setCanUserPostInSelectedFeed(true); // show the thread button, which will open up feed selection
    } else {
      auth
        .feed(feedId)
        .canPost()
        .then((result) => setCanUserPostInSelectedFeed(result.allowed));
    }
  }, [auth, feedId]);

  const showNewThreadButton = !isNewThreadOpen;
  const showCloseButton = !showNewThreadButton;

  // position the close button relative to the feed
  const { refs, floatingStyles } = useFloating({
    elements: {
      reference: feedWrapperRef.current,
    },
    placement: "right-start",
    middleware: [offset({ mainAxis: 32 })],
  });

  return (
    <>
      <div className={styles.toolbar}>
        {isSignedIn && (
          <>
            <div className={styles.feedSelectorContainer}>
              <FeedSelector variant="inToolbar" />
            </div>
            <IconButton
              icon="ellipsis"
              ariaLabel="More options"
              className={styles.overflowMenuButton}
              popoverTarget="overflow-menu"
            />
            {showNewThreadButton && canUserPostInSelectedFeed && (
              <IconButton
                icon="pen"
                variant="primary"
                label="New thread"
                className={styles.newThreadButton}
                onClick={onNewThread}
              />
            )}
            <div className={styles.notificationBellButton}>
              <IconButton
                icon="bell"
                ariaLabel="Notifications"
                onClick={() => setIsNotificationsSidebarOpen(true)}
              />
              {unreadCount !== undefined && unreadCount > 0 && (
                <span className={styles.badge}>{unreadCount}</span>
              )}
            </div>

            {isFeedOwner && feedId && (
              <IconButton
                icon="toggles"
                label="Feed settings"
                className={styles.feedSettingsButton}
                as="link"
                href={`/feed/${feedId}/settings`}
              />
            )}
            {!isFeedOwner && isFeedMember && feedId && (
              <IconButton
                icon="users"
                label="Members"
                className={styles.feedMembersButton}
                as="link"
                href={`/feed/${feedId}/settings`}
              />
            )}
            {isAdmin && (
              <IconButton
                icon="gear"
                label="Admin"
                className={styles.adminSettingsButton}
                iconSize={32}
              />
            )}
            <OverflowMenu
              showAdminSettings={isAdmin}
              showFeedSettings={isFeedOwner}
              showFeedMembers={!isFeedOwner && isFeedMember}
            />
          </>
        )}
      </div>

      {isSignedIn &&
        typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {showCloseButton && (
              <motion.div
                ref={refs.setFloating}
                style={floatingStyles}
                initial={{ opacity: 0, marginTop: `var(--spacing13)` }}
                animate={{ opacity: 1, marginTop: 0 }}
                exit={{ opacity: 0, marginTop: `var(--spacing13)` }}
                transition={{ duration: 0.2 }}
                className={styles.closeNewThreadButton}
              >
                <IconButton
                  icon="close"
                  ariaLabel="Close thread editor"
                  onClick={() => setIsNewThreadOpen(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}

      <AnimatePresence>
        {isNotificationsSidebarOpen && (
          <NotificationsSidebar
            isOpen={isNotificationsSidebarOpen}
            onClose={() => setIsNotificationsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
});
