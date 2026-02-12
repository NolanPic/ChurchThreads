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
import IconButton from "../ui/IconButton";

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
      : "skip",
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

  // Card display logic - determines which navigation card should show
  const shouldShowPreviewingCard =
    currentScreen === "yourFeeds" &&
    isUserPreviewingOpenFeed &&
    previewFeed != null &&
    selectedFeedId != null;

  const shouldShowBackToAllThreads =
    currentScreen === "yourFeeds" &&
    selectedFeedId != null &&
    !shouldShowPreviewingCard;

  const shouldShowBackToYourFeeds = currentScreen === "openFeeds";

  // Configure back navigation card (null if no card should show)
  let backNavigation: {
    label: string;
    action: () => void;
    ariaLabel: string;
  } | null = null;

  if (shouldShowBackToYourFeeds) {
    backNavigation = {
      label: "Back to your feeds",
      action: () => onScreenChange("yourFeeds"),
      ariaLabel: "Back to your feeds",
    };
  } else if (shouldShowBackToAllThreads) {
    backNavigation = {
      label: "Back to all threads",
      action: () => onSelectFeed(undefined),
      ariaLabel: "Back to all threads",
    };
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      dragToClose
      fullScreen
      ariaLabel="Feed selector"
      toolbar={() =>
        currentScreen === "yourFeeds" &&
        auth && (
          <Button
            className={styles.browseOpenFeedsButton}
            onClick={() => onScreenChange("openFeeds")}
            noBackground
          >
            Browse more feeds
          </Button>
        )
      }
      toolbarClass={styles.browseMoreFeeds}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentScreen}
          className={styles.container}
          initial={{
            opacity: 0,
            x: currentScreen === "openFeeds" ? "100%" : "-100%",
          }}
          animate={{ opacity: 1, x: 0 }}
          exit={{
            opacity: 0,
            x: currentScreen === "openFeeds" ? "100%" : "-100%",
          }}
          transition={{ duration: 0.1 }}
        >
          {/* User is previewing an open feed they're not a member of */}
          {shouldShowPreviewingCard && (
            <div className={styles.previewingFeedCard}>
              <PreviewingFeedCard
                feedTitle={previewFeed.name}
                feedId={selectedFeedId}
              />
            </div>
          )}

          {/* Shows "Back to your feeds" or "Back to all threads" */}
          {backNavigation && (
            <div
              role="button"
              tabIndex={0}
              className={styles.backCard}
              onClick={backNavigation.action}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  backNavigation.action();
                }
              }}
              aria-label={backNavigation.ariaLabel}
            >
              <Card>
                <CardBody className={styles.backCardBody}>
                  <p>{backNavigation.label}</p>
                  <Button
                    variant="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      backNavigation.action();
                    }}
                    ariaLabel={backNavigation.ariaLabel}
                  >
                    Go
                  </Button>
                </CardBody>
              </Card>
            </div>
          )}

          <div className={styles.headingRow}>
            <h1 className={styles.heading}>
              {currentScreen === "selectForThread"
                ? "Choose a feed"
                : currentScreen === "openFeeds"
                  ? "Open feeds"
                  : "Your feeds"}
            </h1>
            {currentScreen === "yourFeeds" && isAdmin && (
              <IconButton
                icon="plus-dark"
                variant="primary"
                ariaLabel="Create feed"
              />
            )}
          </div>

          <FeedSelectorItems
            currentScreen={currentScreen}
            selectedFeedId={selectedFeedId}
            onSelectFeed={onSelectFeed}
          />
        </motion.div>
      </AnimatePresence>
    </Modal>
  );
}
