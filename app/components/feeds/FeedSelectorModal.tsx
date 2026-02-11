"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useOrganization } from "@/app/context/OrganizationProvider";
import { useUserAuth } from "@/auth/client/useUserAuth";
import { AnimatePresence, motion } from "framer-motion";
import Modal from "../ui/Modal";
import { Card, CardBody } from "../ui/Card";
import Button from "../ui/Button";
import PreviewingFeedCard from "./discovery/PreviewingFeedCard";
import FeedSelectorItems from "./FeedSelectorItems";
import { FeedSelectorScreen } from "./FeedSelector.types";
import styles from "./FeedSelectorModal.module.css";

interface FeedSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScreen: FeedSelectorScreen;
  onScreenChange: (screen: FeedSelectorScreen) => void;
  selectedFeedId?: Id<"feeds">;
  onSelectFeed: (feedId: Id<"feeds"> | undefined) => void;
}

export default function FeedSelectorModal({
  isOpen,
  onClose,
  currentScreen,
  onScreenChange,
  selectedFeedId,
  onSelectFeed,
}: FeedSelectorModalProps) {
  const org = useOrganization();
  const [auth, { isLoading: isAuthLoading, user }] = useUserAuth();
  const [isUserPreviewingOpenFeed, setIsUserPreviewingOpenFeed] =
    useState(false);

  const isAdmin = user?.role === "admin";

  const previewFeed = useQuery(
    api.feeds.getFeed,
    isOpen &&
      currentScreen === "yourFeeds" &&
      !isAuthLoading &&
      selectedFeedId &&
      org
      ? { orgId: org._id, feedId: selectedFeedId }
      : "skip"
  );

  useEffect(() => {
    if (
      isOpen &&
      currentScreen === "yourFeeds" &&
      !isAuthLoading &&
      selectedFeedId &&
      auth
    ) {
      auth
        .feed(selectedFeedId)
        .hasRole("member")
        .then((result) => {
          setIsUserPreviewingOpenFeed(!result.allowed);
        });
      return;
    }

    setIsUserPreviewingOpenFeed(false);
  }, [auth, currentScreen, isAuthLoading, isOpen, selectedFeedId]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      dragToClose
      fullScreen
      ariaLabel="Feed selector"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          className={styles.feedList}
          initial={{
            opacity: 0,
            x: currentScreen === "openFeeds" ? "100%" : "-100%",
          }}
          animate={{ opacity: 1, x: 0 }}
          exit={{
            opacity: 0,
            x: currentScreen === "openFeeds" ? "100%" : "-100%",
          }}
          transition={{ duration: 0.2 }}
        >
          {currentScreen === "openFeeds" ? (
            <>
              <Card>
                <CardBody>
                  <p>Back to your feeds</p>
                  <Button
                    variant="primary"
                    onClick={() => onScreenChange("yourFeeds")}
                    ariaLabel="Back to your feeds"
                  >
                    Go
                  </Button>
                </CardBody>
              </Card>
              <h1 className={styles.chooseFeedHeading}>Open feeds</h1>
            </>
          ) : (
            <>
              {currentScreen === "yourFeeds" &&
                isUserPreviewingOpenFeed &&
                previewFeed &&
                selectedFeedId && (
                  <div className={styles.previewingFeedCard}>
                    <PreviewingFeedCard
                      feedTitle={previewFeed.name}
                      feedId={selectedFeedId}
                      onViewAllFeeds={() => onScreenChange("openFeeds")}
                    />
                  </div>
                )}

              {currentScreen === "yourFeeds" && selectedFeedId && (
                <Card>
                  <CardBody>
                    <p>Back to all threads</p>
                    <Button
                      variant="primary"
                      onClick={() => onSelectFeed(undefined)}
                    >
                      Go
                    </Button>
                  </CardBody>
                </Card>
              )}

              <div className={styles.headingRow}>
                <h2 className={styles.chooseFeedHeading}>
                  {currentScreen === "selectForThread"
                    ? "Choose a feed"
                    : "Your feeds"}
                </h2>
                {currentScreen === "yourFeeds" && isAdmin && (
                  <Button icon="plus" ariaLabel="Create feed" />
                )}
              </div>
            </>
          )}

          <FeedSelectorItems
            currentScreen={currentScreen}
            onSelectFeed={onSelectFeed}
          />

          {currentScreen === "yourFeeds" && auth && (
            <Button
              className={styles.browseOpenFeedsButton}
              onClick={() => onScreenChange("openFeeds")}
              noBackground
            >
              Browse more feeds
            </Button>
          )}
        </motion.div>
      </AnimatePresence>
    </Modal>
  );
}
