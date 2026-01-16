"use client";

import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useOrganization } from "@/app/context/OrganizationProvider";
import { motion } from "motion/react";
import JoinFeedCard from "./JoinFeedCard";
import Button from "../common/Button";
import { CardList } from "../common/CardList";
import styles from "./PreviewFeedsSelector.module.css";
import { useUserAuth } from "@/auth/client/useUserAuth";

interface PreviewFeedsSelectorProps {
  onClose: () => void;
}

const FEEDS_PER_PAGE = 20;

const PreviewFeedsSelector = ({ onClose }: PreviewFeedsSelectorProps) => {
  const org = useOrganization();
  const orgId = org?._id as Id<"organizations">;
  const [, { userFeeds }] = useUserAuth();

  const userFeedIds = new Set(userFeeds.map((uf) => uf.feedId));

  const {
    results: feeds,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.feeds.getAllOpenFeeds,
    { orgId },
    { initialNumItems: FEEDS_PER_PAGE }
  );

  const feedIds = feeds.map((feed) => feed._id);

  const feedMembers = useQuery(
    api.userMemberships.getOpenFeedMembers,
    feedIds.length > 0 ? { orgId, feedIds } : "skip"
  );

  return (
    <motion.div
      className={styles.browser}
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "100%" }}
      transition={{ duration: 0.2 }}
    >
      <div className={styles.header}>
        <Button
          onClick={onClose}
          noBackground
          className={styles.backButton}
          ariaLabel="Back to my feeds"
        >
          &lt; Back to my feeds
        </Button>
        <h1 className={styles.title}>All open feeds</h1>
      </div>

      <div className={styles.feedList}>
        <CardList
          data={feeds}
          status={status}
          loadMore={loadMore}
          itemsPerPage={FEEDS_PER_PAGE}
          emptyMessage="No open feeds available"
          className={styles.cardListContainer}
          renderCard={(feed) => {
            const members = feedMembers?.[feed._id] || [];
            return (
              <JoinFeedCard
                feed={feed}
                isUserMember={userFeedIds.has(feed._id)}
                users={members}
              />
            );
          }}
        />
      </div>
    </motion.div>
  );
};

export default PreviewFeedsSelector;
