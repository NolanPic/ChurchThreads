"use client";

import { useContext, useEffect, useState } from "react";
import classNames from "classnames";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { CurrentFeedAndThreadContext } from "@/app/context/CurrentFeedAndThreadProvider";
import { useOrganization } from "@/app/context/OrganizationProvider";
import { useScrollToTop } from "@/app/shared/hooks/useScrollToTop";
import Button from "../ui/Button";
import FeedSelectorModal from "./FeedSelectorModal";
import { FeedSelectorScreen, FeedSelectorVariant } from "./FeedSelector.types";
import styles from "./FeedSelector.module.css";

interface FeedSelectorProps {
  variant: FeedSelectorVariant;
  activeScreen?: FeedSelectorScreen;
  onClose?: () => void;
}

export default function FeedSelector({
  variant,
  activeScreen = "yourFeeds",
  onClose,
}: FeedSelectorProps) {
  const { feedId: selectedFeedId, setFeedId } = useContext(
    CurrentFeedAndThreadContext,
  );
  const org = useOrganization();
  const [isModalOpen, setIsModalOpen] = useState(activeScreen !== "yourFeeds");
  const [currentScreen, setCurrentScreen] =
    useState<FeedSelectorScreen>(activeScreen);
  const scrollToTop = useScrollToTop();
  const router = useRouter();

  const selectedFeedData = useQuery(
    api.feeds.getFeed,
    selectedFeedId && org ? { orgId: org._id, feedId: selectedFeedId } : "skip",
  );

  useEffect(() => {
    setCurrentScreen(activeScreen);
    setIsModalOpen(activeScreen !== "yourFeeds");
  }, [activeScreen]);

  if (!org) {
    return null;
  }

  const selectedFeed = selectedFeedData?.name || "All feeds";

  const handleClose = () => {
    setIsModalOpen(false);
    onClose?.();
  };

  const handleSelectFeed = (feedId: Id<"feeds"> | undefined) => {
    setIsModalOpen(false);
    setFeedId(feedId);
    scrollToTop();

    const targetPath = feedId ? `/feed/${feedId}` : "/";
    const pathWithQuery =
      currentScreen === "selectForThread"
        ? `${targetPath}?openEditor=true`
        : targetPath;

    router.push(pathWithQuery);
  };

  return (
    <>
      {activeScreen !== "selectForThread" && (
        <>
          <div className={classNames(styles.selectedFeed, styles[variant])}>
            <h2 className={styles.feedSelectorTitle}>
              What&apos;s happening in
            </h2>
            <Button
              icon="dropdown-arrow"
              iconSize={10}
              className={styles.feedSelector}
              onClick={() => {
                setCurrentScreen("yourFeeds");
                setIsModalOpen(true);
              }}
            >
              {selectedFeed}
            </Button>
          </div>

          <hr
            className={classNames(styles.feedSelectorRule, styles[variant])}
          />
        </>
      )}

      <FeedSelectorModal
        isOpen={isModalOpen}
        onClose={handleClose}
        currentScreen={currentScreen}
        onScreenChange={setCurrentScreen}
        selectedFeedId={selectedFeedId}
        onSelectFeed={handleSelectFeed}
      />
    </>
  );
}
