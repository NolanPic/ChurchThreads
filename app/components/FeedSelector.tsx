import Button from "./common/Button";
import styles from "./FeedSelector.module.css";
import { CurrentFeedAndThreadContext } from "@/app/context/CurrentFeedAndThreadProvider";
import React, { useContext, useEffect } from "react";
import { api } from "../../convex/_generated/api";
import { useQuery } from "convex/react";
import { useOrganization } from "@/app/context/OrganizationProvider";
import { useState } from "react";
import Backdrop from "./common/Backdrop";
import { Id } from "../../convex/_generated/dataModel";
import { AnimatePresence, motion } from "framer-motion";
import { useScrollToTop } from "@/app/hooks/useScrollToTop";
import classNames from "classnames";
import { useRouter } from "next/navigation";
import { useUserAuth } from "@/auth/client/useUserAuth";
import PreviewingFeedCard from "./feeds/PreviewingFeedCard";
import PreviewFeedsSelector from "./feeds/PreviewFeedsSelector";

type FeedSelectorVariant = "topOfFeed" | "inToolbar";
interface FeedSelectorProps {
  variant: FeedSelectorVariant;
  chooseFeedForNewThread?: boolean;
  onClose?: () => void;
}

export default function FeedSelector({
  variant,
  chooseFeedForNewThread = false,
  onClose,
}: FeedSelectorProps) {
  const { feedId: selectedFeedId, setFeedId } = useContext(
    CurrentFeedAndThreadContext
  );
  const org = useOrganization();
  const [isFeedSelectorOpen, setIsFeedSelectorOpen] = useState(
    chooseFeedForNewThread
  );
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);
  const [isUserPreviewingOpenFeed, setIsUserPreviewingOpenFeed] =
    useState(false);
  const scrollToTop = useScrollToTop();
  const router = useRouter();
  const [auth] = useUserAuth();

  const feeds =
    useQuery(
      api.feeds.getUserFeeds,
      org
        ? {
            orgId: org._id,
            onlyIncludeFeedsUserCanPostIn: chooseFeedForNewThread,
          }
        : "skip"
    ) || [];

  // Get current feed if viewing a non-member open feed.
  // Note: this will always have a value if there's a feed selected,
  // but it's only used for displaying a card when the user's
  // previewing a feed.
  const previewFeed = useQuery(
    api.feeds.getFeed,
    selectedFeedId && org ? { orgId: org._id, feedId: selectedFeedId } : "skip"
  );

  useEffect(() => {
    if (selectedFeedId) {
      auth
        ?.feed(selectedFeedId)
        .hasRole("member")
        .then((result) => {
          setIsUserPreviewingOpenFeed(!result.allowed);
        });
    }
  }, [auth, selectedFeedId]);

  if (!org) return null;

  const selectedFeed =
    feeds.find((feed) => feed._id === selectedFeedId)?.name ||
    previewFeed?.name ||
    "All feeds";

  const onSelectFeed = (feedId: Id<"feeds"> | undefined) => {
    setIsFeedSelectorOpen(false);
    setFeedId(feedId);
    scrollToTop();

    const targetPath = feedId ? `/feed/${feedId}` : `/`;
    const pathWithQuery = chooseFeedForNewThread
      ? `${targetPath}?openEditor=true`
      : targetPath;

    router.push(pathWithQuery);
  };

  const handleClose = (e: React.MouseEvent<HTMLElement>) => {
    // check to make sure the click wasn't caused by selecting a feed
    const element = e.target as HTMLElement;
    const doClose = !["LABEL", "INPUT"].includes(element.tagName);
    if (doClose) {
      setIsFeedSelectorOpen(false);
      if (onClose) {
        onClose();
      }
    }
  };

  return (
    <>
      {!chooseFeedForNewThread && (
        <>
          <div className={classNames(styles.selectedFeed, styles[variant])}>
            <h2 className={styles.feedSelectorTitle}>
              What&apos;s happening in
            </h2>
            <Button
              icon="dropdown-arrow"
              iconSize={10}
              className={styles.feedSelector}
              onClick={() => setIsFeedSelectorOpen(true)}
            >
              {selectedFeed}
            </Button>
          </div>

          <hr
            className={classNames(styles.feedSelectorRule, styles[variant])}
          />
        </>
      )}
      <AnimatePresence>
        {isFeedSelectorOpen && !isBrowserOpen && (
          <motion.div
            key="feed-selector"
            className={styles.feedList}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            onClick={handleClose}
          >
            {!chooseFeedForNewThread &&
              isUserPreviewingOpenFeed &&
              previewFeed && (
                <div className={styles.previewingFeedCard}>
                  <PreviewingFeedCard
                    feedTitle={previewFeed.name}
                    feedId={selectedFeedId!}
                  />
                </div>
              )}
            <ol>
              {chooseFeedForNewThread && (
                <li>
                  <h2 className={styles.chooseFeedHeading}>
                    Select a feed to post in
                  </h2>
                </li>
              )}
              {!chooseFeedForNewThread && (
                <li
                  key="all"
                  className={!selectedFeedId ? styles.selected : ""}
                >
                  <label>
                    <input
                      type="radio"
                      checked={!selectedFeedId}
                      onChange={() => onSelectFeed(undefined)}
                    />
                    All feeds
                  </label>
                </li>
              )}
              {feeds.map((feed) => (
                <li
                  key={feed._id}
                  className={selectedFeedId === feed._id ? styles.selected : ""}
                >
                  <label>
                    <input
                      type="radio"
                      checked={selectedFeedId === feed._id}
                      onChange={() => onSelectFeed(feed._id)}
                    />
                    {feed.name}
                  </label>
                </li>
              ))}
            </ol>
            {!chooseFeedForNewThread && auth && (
              <Button
                className={styles.browseOpenFeedsButton}
                onClick={() => {
                  setIsFeedSelectorOpen(false);
                  setIsBrowserOpen(true);
                }}
                noBackground
              >
                Browse open feeds
              </Button>
            )}
          </motion.div>
        )}
        {isBrowserOpen && (
          <PreviewFeedsSelector
            key="open-feeds-browser"
            onClose={() => {
              setIsBrowserOpen(false);
              setIsFeedSelectorOpen(true);
            }}
          />
        )}

        {(isFeedSelectorOpen || isBrowserOpen) && (
          <Backdrop key="backdrop" onClick={handleClose} />
        )}
      </AnimatePresence>
    </>
  );
}
