"use client";

import styles from "./Feed.module.css";
import { useQuery, usePaginatedQuery } from "convex/react";
import { useState, useRef, useEffect, useContext } from "react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Thread from "../content/threads/Thread";
import FeedSkeleton from "./FeedSkeleton";
import useViewportHeight from "@/app/shared/hooks/useViewportHeight";
import { AnimatePresence } from "framer-motion";
import { useOrganization } from "@/app/context/OrganizationProvider";
import ThreadEditor from "../content/threads/ThreadEditor";
import ThreadModalContent from "../content/threads/ThreadModalContent";
import FeedSettingsTab, { FeedSettingsTabHandle } from "./FeedSettingsTab";
import FeedMembersTab from "./FeedMembersTab";
import Modal from "../ui/Modal";
import useHistoryRouter from "@/app/shared/hooks/useHistoryRouter";
import { CurrentFeedAndThreadContext } from "@/app/context/CurrentFeedAndThreadProvider";
import FeedSelector from "./FeedSelector";
import Toolbar from "../layout/Toolbar";
import ThreadEditorPhone from "../content/threads/phone/ThreadEditorPhone";
import { useMediaQuery } from "@/app/shared/hooks/useMediaQuery";
import { useSearchParams, useRouter } from "next/navigation";
import { useUserAuth } from "@/auth/client/useUserAuth";
import FeedEmptyState from "./FeedEmptyState";
import FeedFooter from "./FeedFooter";

interface FeedProps {
  feedIdSlug: Id<"feeds"> | null;
  threadIdSlug?: Id<"threads"> | null;
  feedSettingsFeedIdSlug?: Id<"feeds"> | null;
}

export default function Feed({
  feedIdSlug,
  threadIdSlug,
  feedSettingsFeedIdSlug,
}: FeedProps) {
  const itemsPerPage = 10;
  const {
    feedId,
    threadId: openThreadId,
    setFeedId,
    setThreadId: setOpenThreadId,
  } = useContext(CurrentFeedAndThreadContext);
  const [isNewThreadOpen, setIsNewThreadOpen] = useState(false);
  const [isSelectingFeedForThread, setIsSelectingFeedForThread] =
    useState(false);
  const [settingsActiveTab, setSettingsActiveTab] = useState("settings");
  const [isFeedOwner, setIsFeedOwner] = useState(false);
  const [, setIsFeedMember] = useState(false);
  const [auth] = useUserAuth();
  const org = useOrganization();
  const orgId = org?._id as Id<"organizations">;
  const searchParams = useSearchParams();
  const router = useRouter();
  const feedWrapperRef = useRef<HTMLDivElement>(null);
  const feedSettingsTabRef = useRef<FeedSettingsTabHandle | null>(null);

  const historyRouter = useHistoryRouter((path) => {
    const segments = path.split("/").filter(Boolean);
    if (segments[0] === "thread" && segments[1]) {
      setOpenThreadId(segments[1] as Id<"threads">);
    } else {
      setOpenThreadId(undefined);
    }
  });

  // Fix TS type mismatch: context setter expects undefined to clear, not null
  useEffect(
    () => setFeedId(feedIdSlug ?? undefined),
    [org, feedIdSlug, setFeedId]
  );

  useEffect(() => {
    if (threadIdSlug) {
      setOpenThreadId(threadIdSlug);
    }
  }, [threadIdSlug, setOpenThreadId]);

  // Keep modal state in sync with browser back/forward
  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname;
      const segments = path.split("/").filter(Boolean);
      if (segments[0] === "thread" && segments[1]) {
        setOpenThreadId(segments[1] as Id<"threads">);
      } else {
        setOpenThreadId(undefined);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [setOpenThreadId]);

  const { results, status, loadMore } = usePaginatedQuery(
    api.threads.getThreadsForUserFeed,
    {
      orgId,
      selectedFeedId: feedId === null ? undefined : feedId,
    },
    {
      initialNumItems: itemsPerPage,
    }
  );

  const feed = useQuery(
    api.feeds.getFeed,
    feedSettingsFeedIdSlug && org
      ? { orgId, feedId: feedSettingsFeedIdSlug }
      : "skip"
  );

  const vh = useViewportHeight();
  const endOfFeed = useRef<HTMLDivElement>(null);

  const intersectionCb = useRef<IntersectionObserverCallback | null>(null);

  const handleIntersection = (entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting && status === "CanLoadMore") {
      loadMore(itemsPerPage);
    }
  };

  useEffect(() => {
    intersectionCb.current = handleIntersection;
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries, observer) => {
        intersectionCb.current?.(entries, observer);
      },
      {
        rootMargin: `${vh * 0.5}px`,
      }
    );
    if (endOfFeed.current) {
      observer.observe(endOfFeed.current);
    }
    return () => observer.disconnect();
  }, [vh]);

  const isTabletOrUp = useMediaQuery("(min-width: 34.375rem)");

  const handleOpenThread = (threadId: Id<"threads">) => {
    setOpenThreadId(threadId);
    historyRouter.push(`/thread/${threadId}`);
  };

  const handleCloseThread = () => {
    setOpenThreadId(undefined);
    historyRouter.push(feedId ? `/feed/${feedId}` : `/`);
  };

  const handleNewThreadClick = () => {
    if (!feedId) {
      setIsSelectingFeedForThread(true);
    } else {
      setIsNewThreadOpen(true);
    }
  };

  const handleCloseFeedSelector = () => {
    setIsSelectingFeedForThread(false);
  };

  const handleCloseFeedSettings = () => {
    // Check for unsaved changes via the component ref
    const feedSettingsContent = feedSettingsTabRef.current;
    const hasUnsavedChanges =
      feedSettingsContent?.hasUnsavedChanges?.() ?? false;

    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to leave?"
      );
      if (!confirmed) {
        return;
      }
    }

    // Navigate back to the feed
    router.push(feedId ? `/feed/${feedId}` : `/`);
  };

  const removeEditorQueryParam = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("openEditor");
    window.history.replaceState({}, "", url.pathname);
  };

  // Watch for openEditor query parameter to open editor after navigation
  useEffect(() => {
    if (searchParams.get("openEditor") === "true") {
      setIsSelectingFeedForThread(false);
      setIsNewThreadOpen(true);
      removeEditorQueryParam();
    }
  }, [searchParams]);

  // Check feed ownership and membership when the modal opens
  useEffect(() => {
    if (!auth || !feedSettingsFeedIdSlug) {
      setIsFeedOwner(false);
      setIsFeedMember(false);
      setSettingsActiveTab("settings");
      return;
    }

    // Check if user is an owner
    auth
      .feed(feedSettingsFeedIdSlug)
      .hasRole("owner")
      .then((result) => {
        setIsFeedOwner(result.allowed);
        // If user is not an owner, switch to members tab
        if (!result.allowed) {
          setSettingsActiveTab("members");
        }
      });

    // Check if user is a member (includes owners)
    auth
      .feed(feedSettingsFeedIdSlug)
      .hasRole("member")
      .then((result) => {
        setIsFeedMember(result.allowed);
      });
  }, [auth, feedSettingsFeedIdSlug]);

  // Define modal tabs
  const settingsTab = {
    id: "settings",
    label: "Settings",
    content: feedSettingsFeedIdSlug ? (
      <FeedSettingsTab
        ref={feedSettingsTabRef}
        feedId={feedSettingsFeedIdSlug}
      />
    ) : null,
  };

  const membersTab = {
    id: "members",
    label: "Members",
    content: feedSettingsFeedIdSlug ? (
      <FeedMembersTab feedId={feedSettingsFeedIdSlug} />
    ) : null,
  };

  const modalTabs = isFeedOwner ? [settingsTab, membersTab] : [membersTab];

  return (
    <>
      <div className={styles.feedWrapper} ref={feedWrapperRef}>
        <Toolbar
          onNewThread={handleNewThreadClick}
          isNewThreadOpen={isNewThreadOpen}
          setIsNewThreadOpen={setIsNewThreadOpen}
          feedWrapperRef={feedWrapperRef}
        />
        <div className={styles.feedSelectorTabletUp}>
          <FeedSelector variant="topOfFeed" />
        </div>
        {isSelectingFeedForThread && (
          <FeedSelector
            variant="topOfFeed"
            chooseFeedForNewThread
            onClose={handleCloseFeedSelector}
          />
        )}
        <AnimatePresence>
          {isNewThreadOpen && isTabletOrUp && (
            <ThreadEditor
              isOpen={isNewThreadOpen}
              setIsOpen={setIsNewThreadOpen}
              feedId={feedId ?? null}
            />
          )}
        </AnimatePresence>
        <main className={styles.feedPosts} data-testid="feed-posts">
          {status === "LoadingFirstPage" ? (
            <FeedSkeleton />
          ) : results.length === 0 ? (
            <FeedEmptyState
              feedId={feedId}
              onNewThread={handleNewThreadClick}
            />
          ) : (
            results.map((thread) => {
              return (
                <div key={thread._id} className={styles.feedPost}>
                  <Thread
                    thread={thread}
                    variant="feed"
                    showSourceFeed={!feedId}
                    onOpenThread={handleOpenThread}
                  />
                </div>
              );
            })
          )}
        </main>
        <div ref={endOfFeed} />
      </div>

      <FeedFooter />

      {!isTabletOrUp && (
        <ThreadEditorPhone
          isOpen={isNewThreadOpen}
          onClose={() => setIsNewThreadOpen(false)}
          feedId={feedId ?? null}
        />
      )}

      <Modal
        isOpen={!!openThreadId}
        onClose={handleCloseThread}
        ariaLabel="Thread details and messages"
        dragToClose
      >
        {openThreadId && (
          <ThreadModalContent
            threadId={openThreadId}
            onClose={handleCloseThread}
          />
        )}
      </Modal>

      <Modal
        isOpen={!!feedSettingsFeedIdSlug}
        onClose={handleCloseFeedSettings}
        title={isFeedOwner ? "Feed settings" : "Feed members"}
        subtitle={feed ? feed.name : undefined}
        tabs={modalTabs}
        activeTabId={settingsActiveTab}
        onTabChange={setSettingsActiveTab}
        dragToClose
      ></Modal>
    </>
  );
}
