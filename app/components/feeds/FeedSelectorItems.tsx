"use client";

import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useOrganization } from "@/app/context/OrganizationProvider";
import { useUserAuth } from "@/auth/client/useUserAuth";
import { CardList } from "../ui/CardList";
import FeedCard from "./FeedCard";
import JoinFeedCard from "./discovery/JoinFeedCard";
import { FeedSelectorScreen } from "./FeedSelector.types";

type CardListStatus =
  | "LoadingFirstPage"
  | "CanLoadMore"
  | "LoadingMore"
  | "Exhausted";

interface FeedSelectorItemsProps {
  currentScreen: FeedSelectorScreen;
  onSelectFeed: (feedId: Id<"feeds"> | undefined) => void;
}

const FEEDS_PER_PAGE = 20;

export default function FeedSelectorItems({
  currentScreen,
  onSelectFeed,
}: FeedSelectorItemsProps) {
  const org = useOrganization();
  const [, { userFeeds }] = useUserAuth();

  const queriedFeeds = useQuery(
    api.feeds.getUserFeeds,
    org && currentScreen !== "openFeeds"
      ? {
          orgId: org._id,
          onlyIncludeFeedsUserCanPostIn: currentScreen === "selectForThread",
        }
      : "skip",
  );
  const feeds = queriedFeeds ?? [];

  const userFeedIds = new Set(userFeeds.map((membership) => membership.feedId));
  const memberFeeds = feeds.filter((feed) => userFeedIds.has(feed._id));

  const {
    results: openFeeds,
    status: openFeedsStatus,
    loadMore: loadMoreOpenFeeds,
  } = usePaginatedQuery(
    api.feeds.getAllOpenFeeds,
    org && currentScreen === "openFeeds" ? { orgId: org._id } : "skip",
    { initialNumItems: FEEDS_PER_PAGE },
  );

  const visibleFeeds = currentScreen === "openFeeds" ? openFeeds : memberFeeds;
  const visibleFeedIds = visibleFeeds.map((feed) => feed._id);

  const feedMemberPreviews = useQuery(
    api.userMemberships.getFeedMemberPreviews,
    org && visibleFeedIds.length > 0
      ? { orgId: org._id, feedIds: visibleFeedIds }
      : "skip",
  );
  const getFeedUsers = (feedId: Id<"feeds">) =>
    feedMemberPreviews?.[feedId] || [];

  if (currentScreen === "openFeeds") {
    return (
      <CardList
        data={openFeeds}
        status={openFeedsStatus}
        loadMore={loadMoreOpenFeeds}
        itemsPerPage={FEEDS_PER_PAGE}
        emptyMessage="No open feeds available"
        renderCard={(feed) => (
          <JoinFeedCard
            feed={feed}
            isUserMember={userFeedIds.has(feed._id)}
            users={getFeedUsers(feed._id)}
          />
        )}
      />
    );
  }

  // We have to "spoof" this since queriedFeeds is not paginated
  const memberFeedsStatus: CardListStatus =
    queriedFeeds === undefined ? "LoadingFirstPage" : "Exhausted";

  return (
    <CardList
      data={memberFeeds}
      status={memberFeedsStatus}
      itemsPerPage={queriedFeeds?.length} // spoof since queriedFeeds isn't paginated
      emptyMessage="No feeds available."
      renderCard={(feed) => (
        <FeedCard
          feed={feed}
          users={getFeedUsers(feed._id).map((member) => ({
            _id: member._id,
            name: member.name,
            image: member.image,
          }))}
          primaryActionLabel={
            currentScreen === "selectForThread" ? "New thread" : "View threads"
          }
          onPrimaryAction={() => onSelectFeed(feed._id)}
        />
      )}
    />
  );
}
