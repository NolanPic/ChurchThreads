"use client";

import { useUser, useAuth } from "@clerk/nextjs";
import type { UserResource } from "@clerk/types";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useOrganization } from "@/app/context/OrganizationProvider";
import { useMemo } from "react";
import { Id, Doc } from "@/convex/_generated/dataModel";
import {
  UserRole,
  FeedRole,
  FeedAuthContext,
  PermissionResult,
  AuthUser,
} from "../core/types";
import {
  checkUserRole,
  checkFeedRole,
  checkFeedPermission,
  createPermissionResult,
} from "../core/permissions";

/**
 * Extended user type that includes image URL (from getUserByClerkId query)
 */
type UserWithImageUrl = Omit<Doc<"users">, "image"> & {
  image: string | null;
};

/**
 * Client-side authentication class
 * Provides methods for checking user roles and feed permissions on the frontend
 */
export class UserAuthClient {
  private user: UserWithImageUrl | null;
  private clerkUser: UserResource | null;

  constructor(
    dbUser: UserWithImageUrl | null,
    clerkUser: UserResource | null,
    private userFeeds: Doc<"userFeeds">[],
    private feeds: Doc<"feeds">[]
  ) {
    this.user = dbUser;
    this.clerkUser = clerkUser;
  }

  /**
   * Get the authenticated user document
   * @returns The full user document with image URL, or null if not authenticated
   */
  getUser(): UserWithImageUrl | null {
    return this.user;
  }

  /**
   * Get the authenticated user document or throw an error
   * @throws Error if user is not authenticated or not found
   * @returns The full user document with image URL
   */
  getUserOrThrow(): UserWithImageUrl {
    if (!this.clerkUser) {
      throw new Error("User not authenticated with Clerk");
    }
    if (!this.user) {
      throw new Error("User not found in database");
    }
    return this.user;
  }

  /**
   * Get the Clerk user
   * @returns The Clerk User object, or null if not authenticated
   */
  getClerkUser(): UserResource | null {
    return this.clerkUser;
  }

  /**
   * Convert stored user to AuthUser format for permission checks
   * @private
   */
  private toAuthUser(): AuthUser | null {
    if (!this.user) {
      return null;
    }
    return {
      id: this.user._id,
      clerkId: this.user.clerkId,
      role: this.user.role,
      deactivatedAt: this.user.deactivatedAt,
      orgId: this.user.orgId,
    };
  }

  /**
   * Check if user has a specific role (admin or user)
   * @param role - The required user role
   * @returns PermissionResult indicating if user has the role
   */
  hasRole(role: UserRole): PermissionResult {
    return checkUserRole(this.toAuthUser(), role);
  }

  /**
   * Create a feed context for checking feed-specific permissions
   * @param feedId - The ID of the feed
   * @param feedData - Optional feed document to avoid lookup
   * @returns FeedAuthContext for checking feed permissions
   */
  feed(feedId: Id<"feeds">, feedData?: Doc<"feeds">): FeedAuthContext {
    return new FeedAuthContextClient(
      this.toAuthUser(),
      this.userFeeds,
      this.feeds,
      feedId,
      feedData
    );
  }
}

/**
 * Feed-specific authentication context for client
 * Provides methods for checking feed membership, ownership, and permissions
 */
class FeedAuthContextClient implements FeedAuthContext {
  constructor(
    private user: AuthUser | null,
    private userFeeds: Doc<"userFeeds">[],
    private feeds: Doc<"feeds">[],
    private feedId: Id<"feeds">,
    private feedData?: Doc<"feeds">
  ) {}

  /**
   * Check if user has a specific role in the feed (member or owner)
   * @param role - The required feed role
   * @returns Promise resolving to permission result
   */
  async hasRole(role: FeedRole): Promise<PermissionResult> {
    if (!this.user) {
      return createPermissionResult(false, "unauthenticated");
    }

    if (this.user.deactivatedAt) {
      return createPermissionResult(false, "user_deactivated");
    }

    // Find userFeed in the cached array
    const userFeed = this.userFeeds.find((uf) => uf.feedId === this.feedId);
    if (!userFeed) {
      return createPermissionResult(false, "not_feed_member");
    }

    return checkFeedRole(true, userFeed.owner, role);
  }

  /**
   * Check if user can post in the feed
   * Composite check: authenticated, member, and feed has 'post' permission
   * Owners can always post regardless of feed permissions
   * @returns Promise resolving to permission result
   */
  async canPost(): Promise<PermissionResult> {
    const memberCheck = await this.hasRole("member");
    if (!memberCheck.allowed) {
      return memberCheck;
    }

    // Get feed data from provided data or cached feeds
    let feed = this.feedData;
    if (!feed) {
      feed = this.feeds.find((f) => f._id === this.feedId);
    }

    if (!feed) {
      return createPermissionResult(false, "not_feed_member");
    }

    // Get ownership status from userFeed
    const userFeed = this.userFeeds.find((uf) => uf.feedId === this.feedId);
    const isOwner = userFeed?.owner ?? false;

    return checkFeedPermission(true, isOwner, feed, "post");
  }

  /**
   * Check if user can message in the feed
   * Composite check: authenticated, member, and feed has 'message' permission
   * Owners can always message regardless of feed permissions
   * @returns Promise resolving to permission result
   */
  async canMessage(): Promise<PermissionResult> {
    const memberCheck = await this.hasRole("member");
    if (!memberCheck.allowed) {
      return memberCheck;
    }

    // Get feed data from provided data or cached feeds
    let feed = this.feedData;
    if (!feed) {
      feed = this.feeds.find((f) => f._id === this.feedId);
    }

    if (!feed) {
      return createPermissionResult(false, "not_feed_member");
    }

    // Get ownership status from userFeed
    const userFeed = this.userFeeds.find((uf) => uf.feedId === this.feedId);
    const isOwner = userFeed?.owner ?? false;

    return checkFeedPermission(true, isOwner, feed, "message");
  }
}

/**
 * React hook for accessing the authentication system
 * Returns a tuple of [auth, state] where auth is the UserAuthClient instance
 * and state contains loading, error, user, and clerkUser information
 *
 * @returns Tuple of [UserAuthClient | null, state]
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const [auth, { isLoading, error, user, clerkUser }] = useUserAuth();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!auth) return <div>Not authenticated</div>;
 *
 *   // Access user directly from state
 *   console.log(user?.name); // or auth.getUser()?.name
 *
 *   // Check user role
 *   const adminCheck = auth.hasRole('admin');
 *   if (adminCheck.allowed) {
 *     // Show admin UI
 *   }
 *
 *   // Check feed permissions
 *   const canPost = await auth.feed(feedId).canPost();
 *   if (canPost.allowed) {
 *     // Show post button
 *   }
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useUserAuth(): [
  auth: UserAuthClient | null,
  state: {
    isLoading: boolean;
    error: Error | null;
    user: UserWithImageUrl | null;
    clerkUser: UserResource | null;
    userFeeds: Doc<"userFeeds">[];
    signOut: (options?: { redirectUrl?: string }) => Promise<void>;
  }
] {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut } = useAuth();
  const org = useOrganization();
  const orgId = org?._id ?? ("" as Id<"organizations">);

  // Query user data
  const user = useQuery(api.user.getUserByClerkId, {
    clerkId: clerkUser?.id ?? "",
    orgId,
  });

  // Query feeds with membership data
  const feedsData = useQuery(api.feeds.getUserFeedsWithMemberships, {
    orgId,
  });

  const { userFeeds = [], feeds = [] } = feedsData || {};

  // Memoize auth instance before any early returns to satisfy Rules of Hooks.
  // Returns null when user/clerkUser aren't available yet.
  const auth = useMemo(
    () => user && clerkUser ? new UserAuthClient(user, clerkUser, userFeeds, feeds) : null,
    [user, clerkUser, userFeeds, feeds]
  );

  // Handle loading state
  if (!isLoaded || user === undefined || feedsData === undefined) {
    return [
      null,
      { isLoading: true, error: null, user: null, clerkUser: null, userFeeds: [], signOut },
    ];
  }

  // Handle unauthenticated or user not found
  if (!auth) {
    return [
      null,
      { isLoading: false, error: null, user: null, clerkUser: null, userFeeds: [], signOut },
    ];
  }

  return [
    auth,
    { isLoading: false, error: null, user, clerkUser, userFeeds, signOut },
  ];
}
