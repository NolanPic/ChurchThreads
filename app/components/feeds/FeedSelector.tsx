import Button from "../ui/Button";
import Modal from "../ui/Modal";
import { Card, CardBody } from "../ui/Card";
import { CardList } from "../ui/CardList";
import FeedCard from "./FeedCard";
import styles from "./FeedSelector.module.css";
import { CurrentFeedAndThreadContext } from "@/app/context/CurrentFeedAndThreadProvider";
import React, { useContext, useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { usePaginatedQuery, useQuery } from "convex/react";
import { useOrganization } from "@/app/context/OrganizationProvider";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useScrollToTop } from "@/app/shared/hooks/useScrollToTop";
import classNames from "classnames";
import { useRouter } from "next/navigation";
import { useUserAuth } from "@/auth/client/useUserAuth";
import PreviewingFeedCard from "./discovery/PreviewingFeedCard";
import JoinFeedCard from "./discovery/JoinFeedCard";
import { AnimatePresence, motion } from "framer-motion";

type FeedSelectorVariant = "topOfFeed" | "inToolbar";
type FeedSelectorScreen = "yourFeeds" | "openFeeds" | "selectForThread";
type CardListStatus =
  | "LoadingFirstPage"
  | "CanLoadMore"
  | "LoadingMore"
  | "Exhausted";

interface FeedSelectorProps {
  variant: FeedSelectorVariant;
  activeScreen?: FeedSelectorScreen;
  onClose?: () => void;
}

interface FeedSelectorCardListConfig {
  data: Doc<"feeds">[];
  status: CardListStatus;
  loadMore?: (numItems: number) => void;
  itemsPerPage: number;
  emptyMessage: string;
  renderCard: (feed: Doc<"feeds">) => React.ReactNode;
}

export default function FeedSelector({
  variant,
  activeScreen = "yourFeeds",
  onClose,
}: FeedSelectorProps) {
  const { feedId: selectedFeedId, setFeedId } = useContext(
    CurrentFeedAndThreadContext
  );
  const org = useOrganization();
  const [auth, { isLoading: isAuthLoading, user, userFeeds }] = useUserAuth();
  const [isOpen, setIsOpen] = useState(activeScreen !== "yourFeeds");
  const [currentScreen, setCurrentScreen] =
    useState<FeedSelectorScreen>(activeScreen);
  const [isUserPreviewingOpenFeed, setIsUserPreviewingOpenFeed] =
    useState(false);
  const scrollToTop = useScrollToTop();
  const router = useRouter();

  const onlyIncludeFeedsUserCanPostIn = currentScreen === "selectForThread";
  const isAdmin = user?.role === "admin";
  const isOpenFeedsScreen = currentScreen === "openFeeds";

  const queriedFeeds = useQuery(
    api.feeds.getUserFeeds,
    org
      ? {
          orgId: org._id,
          onlyIncludeFeedsUserCanPostIn,
        }
      : "skip"
  );
  const feeds = queriedFeeds ?? [];
  const userFeedIds = new Set(userFeeds.map((membership) => membership.feedId));
  const memberFeeds = feeds.filter((feed) => userFeedIds.has(feed._id));

  const FEEDS_PER_PAGE = 20;
  const {
    results: openFeeds,
    status: openFeedsStatus,
    loadMore: loadMoreOpenFeeds,
  } = usePaginatedQuery(
    api.feeds.getAllOpenFeeds,
    org && isOpen && isOpenFeedsScreen ? { orgId: org._id } : "skip",
    { initialNumItems: FEEDS_PER_PAGE }
  );

  const visibleFeeds = isOpenFeedsScreen ? openFeeds : memberFeeds;

  const memberFeedIds = visibleFeeds.map((feed) => feed._id);
  const memberPreviews = useQuery(
    api.userMemberships.getFeedMemberPreviews,
    org && memberFeedIds.length > 0
      ? { orgId: org._id, feedIds: memberFeedIds }
      : "skip"
  );

  const previewFeed = useQuery(
    api.feeds.getFeed,
    !isAuthLoading && selectedFeedId && org
      ? { orgId: org._id, feedId: selectedFeedId }
      : "skip"
  );

  useEffect(() => {
    setCurrentScreen(activeScreen);
    setIsOpen(activeScreen !== "yourFeeds");
  }, [activeScreen]);

  useEffect(() => {
    if (!isAuthLoading && selectedFeedId && auth) {
      auth
        .feed(selectedFeedId)
        .hasRole("member")
        .then((result) => {
          setIsUserPreviewingOpenFeed(!result.allowed);
        });
    } else {
      setIsUserPreviewingOpenFeed(false);
    }
  }, [auth, isAuthLoading, selectedFeedId]);

  if (!org) return null;

  const selectedFeed =
    feeds.find((feed) => feed._id === selectedFeedId)?.name ||
    previewFeed?.name ||
    "All feeds";

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const onSelectFeed = (feedId: Id<"feeds"> | undefined) => {
    setIsOpen(false);
    setFeedId(feedId);
    scrollToTop();

    const targetPath = feedId ? `/feed/${feedId}` : `/`;
    const pathWithQuery =
      currentScreen === "selectForThread"
        ? `${targetPath}?openEditor=true`
        : targetPath;

    router.push(pathWithQuery);
  };

  const cardListConfig: FeedSelectorCardListConfig = (() => {
    if (isOpenFeedsScreen) {
      return {
        data: openFeeds as Doc<"feeds">[],
        status: openFeedsStatus,
        loadMore: loadMoreOpenFeeds,
        itemsPerPage: FEEDS_PER_PAGE,
        emptyMessage: "No open feeds available",
        renderCard: (feed: Doc<"feeds">) => (
          <JoinFeedCard
            feed={feed}
            isUserMember={userFeedIds.has(feed._id)}
            users={memberPreviews?.[feed._id] || []}
          />
        ),
      };
    }

    return {
      data: memberFeeds as Doc<"feeds">[],
      status: queriedFeeds === undefined ? "LoadingFirstPage" : "Exhausted",
      loadMore: undefined,
      itemsPerPage: FEEDS_PER_PAGE,
      emptyMessage: "No feeds available.",
      renderCard: (feed: Doc<"feeds">) => (
        <FeedCard
          key={feed._id}
          feed={feed}
          users={(memberPreviews?.[feed._id] || []).map((member) => ({
            _id: member._id,
            name: member.name,
            image: member.image,
          }))}
          primaryActionLabel={
            currentScreen === "selectForThread" ? "New thread" : "View threads"
          }
          onPrimaryAction={() => onSelectFeed(feed._id)}
        />
      ),
    };
  })();

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
                setIsOpen(true);
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

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
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
                      onClick={() => setCurrentScreen("yourFeeds")}
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
                        onViewAllFeeds={() => setCurrentScreen("openFeeds")}
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

            <CardList
              data={cardListConfig.data}
              status={cardListConfig.status}
              loadMore={cardListConfig.loadMore}
              itemsPerPage={cardListConfig.itemsPerPage}
              emptyMessage={cardListConfig.emptyMessage}
              renderCard={cardListConfig.renderCard}
            />

            {currentScreen === "yourFeeds" && auth && (
              <Button
                className={styles.browseOpenFeedsButton}
                onClick={() => setCurrentScreen("openFeeds")}
                noBackground
              >
                Browse more feeds
              </Button>
            )}
          </motion.div>
        </AnimatePresence>
      </Modal>
    </>
  );
}
