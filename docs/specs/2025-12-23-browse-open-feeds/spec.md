# Browse Open Feeds Specification

## Overview
This feature enables logged-in users to browse and join open and public feeds within their organization. The implementation consists of backend queries/mutations to support browsing and joining feeds, and frontend components to display and interact with these feeds.

## Part 1: Backend

### 1. `getAllOpenFeeds` Query
**Location:** `@/convex/feeds.ts`

A paginated query that returns all feeds with `privacy` set to `"open"` or `"public"` within the user's organization.

**Arguments:**
- `orgId: Id<"organizations">` - The organization ID to scope the query
- `paginationOpts` - Standard Convex pagination options

**Authorization:**
- Only authenticated users can call this query
- Results are scoped to the specified organization

**Behavior:**
- Returns feeds regardless of whether the user is already a member
- Uses the existing `by_org_privacy` index on the feeds table
- Implements standard Convex pagination pattern (see `app/components/Feed.tsx` for example)

**Return Type:**
- Paginated result containing feeds with `privacy` of `"open"` or `"public"`

---

### 2. `joinOpenFeed` Mutation
**Location:** `@/convex/userMemberships.ts`

A mutation that adds the authenticated user as a member of an open or public feed.

**Arguments:**
- `orgId: Id<"organizations">` - The organization ID
- `feedId: Id<"feeds">` - The feed to join

**Authorization:**
- Only authenticated users can call this mutation
- User must belong to the specified organization

**Validation:**
- Must verify the feed's `privacy` is `"open"` or `"public"` before allowing join
- Must verify the feed belongs to the specified organization
- Must throw an error if the user is already a member of the feed

**Behavior:**
- Creates a `userFeeds` record with:
  - `orgId`: The organization ID
  - `userId`: The authenticated user's ID
  - `feedId`: The feed ID
  - `owner`: `false` (user is a member, not an owner)
  - `updatedAt`: Current timestamp
- Sends notifications to feed owners using `sendNotifications(ctx, orgId, "new_feed_member", { userId, feedId })`
  - This matches the pattern in `inviteUsersToFeed`

**Error Cases:**
- Throws error if user is already a member
- Throws error if feed privacy is `"private"`
- Throws error if feed doesn't exist
- Throws error if feed doesn't belong to the organization

---

### 3. `getOpenFeedMembers Query
**Location:** `@/convex/userMemberships.ts`

`getOpenFeedMembers` should be similar to the `getFeedMembers` query, but should support fetching members for multiple feeds at once.

**Arguments:**
- `orgId`: `v.id("organizations")`
- `feedIds: v.array(v.id("feeds"))` - Array of feed IDs for batch fetching

**Authorization Changes:**
- Use the Convex `getAll` helper wherever possible
- Only return if feed privacy is `"open"` or `"public"` and the user is authenticated

**Return Type:**
- Return `Record<Id<"feeds">, Doc<"users">[]>`
  - Each key is a feed ID
  - Each value is the member list for that feed, truncated to the first 50 users of each feed

**Behavior:**
- Return detailed member information including:
  - `_id`, `name`, `email`, `image` (avatar URL via `getStorageUrl`), `isOwner`
- Sort members by owner status first, then by name

---

## Part 2: Frontend

### Component Structure

New components will be created in the following locations:
- `@/app/components/feeds/OpenFeedCard.tsx` - Card for displaying individual open feeds
- `@/app/components/feeds/CurrentlyViewingOpenFeedCard.tsx` - Card shown when viewing non-member feed
- `@/app/components/feeds/OpenFeedsBrowser.tsx` - Full browser interface for open feeds
- `@/app/components/common/StackedUsers.tsx` - Reusable stacked avatar component

### 1. `<StackedUsers>` Component
**Location:** `@/app/components/common/StackedUsers.tsx`

A reusable component that displays a horizontal list of overlapping user avatars with a count of remaining users.

**Props:**
- `users: AvatarUser[]` - Array of users to display (same type as `UserAvatar` component)
- `numberOfAvatarsToShow: number` - How many avatars to render
- `showRemainingCount: boolean` - Whether to show the "+X" count

**Styling:**
- Each avatar is 34x34px
- Each avatar has a 1px border using `--accent` color
- Avatars overlap using a CSS variable for the overlap amount (to be defined, e.g., `--avatar-overlap`)
- Remaining count displays next to avatars in `--accent` color
- Remaining count format: "+X" where X is `users.length - numberOfAvatarsToShow`

**Implementation Notes:**
- Use the existing `<UserAvatar>` component for each avatar
- Apply border via CSS to the avatar wrapper
- Use flexbox with negative margins for overlapping effect
- Add the component to Storybook with a couple examples once completed

---

### 2. `<OpenFeedCard>` Component
**Location:** `@/app/components/feeds/OpenFeedCard.tsx`

A card component for displaying an open or public feed in the browse interface.

**Props:**
- `feed: Doc<"feeds">` - The feed document from Convex
- `isUserMember: boolean` - Whether the current user is a member
- `users: AvatarUser[]` - List of feed members for stacked avatars

**Structure:**
- Composed using `<Card>`, `<CardHeader>`, and `<CardBody>` components
- **Card Header:**
  - Feed title
  - Globe icon (from `/public/icons/globe.svg`) if feed privacy is `"public"`
  - `<StackedUsers>` component showing 3 avatars with remaining count
- **Card Body:**
  - Feed description with "Read more" functionality (see below)
  - Two buttons:
    - "Join" button (primary variant) - calls `joinOpenFeed` mutation
    - "View" button (secondary/default variant) - navigates to `/feed/${feedId}`

**Description "Read More" Functionality:**
- If description exceeds 3 lines of text:
  - Show ellipsis "..." and a "Read more" button styled as a link
  - Clicking "Read more" expands the description inline within the card
  - Once expanded, the description remains expanded (no "Read less" option)
- Implement using the "checkbox hack" for truncation (see: https://css-tricks.com/multiline-truncated-text-with-show-more-button/)
  - Use a hidden checkbox to toggle to expanded state
  - Use `<button>` element styled to look like a link (matching design) for accessibility
  - Ensure keyboard navigation and screen reader compatibility

**Join Button States:**
- **Default:** "Join" (enabled, primary variant)
- **Loading:** "Joining..." (disabled, primary variant) - while `joinOpenFeed` mutation is in progress
- **Joined:** "Joined" (disabled, primary variant) - after successful join OR if `isUserMember` is true

**Implementation Notes:**
- Use `useMutation` hook for `joinOpenFeed`
- Track local loading state during mutation
- After successful join, update button to "Joined" state
- Handle errors from mutation by displaying inline error message below the button
  - Show error text in `--error` color
  - Clear error when user attempts to join again

---

### 3. `<CurrentlyViewingOpenFeedCard>` Component
**Location:** `@/app/components/feeds/CurrentlyViewingOpenFeedCard.tsx`

A card displayed at the top of the feed selector when the user is viewing a feed they are not a member of.

**Props:**
- `feedTitle: string` - The name of the feed being viewed
- `feedId: Id<"feeds">` - The feed ID for the join mutation

**Structure:**
- Composed using `<Card>` and `<CardBody>`
- Text: "You are viewing an open feed:"
- Feed title in larger type (using appropriate text size variable)
- Primary "Join" button that calls `joinOpenFeed` mutation

**Join Button Behavior:**
- Same states as `<OpenFeedCard>`: default, loading ("Joining..."), and joined ("Joined")
- After successful join, button updates to "Joined" and is disabled

**Styling:**
- Follow the design in `/assets/375 x 812 - feed selector - viewing open feed.png`
- Center-aligned text and button

---

### 4. `<OpenFeedsBrowser>` Component
**Location:** `@/app/components/feeds/OpenFeedsBrowser.tsx`

The main interface for browsing all open and public feeds in the organization.

**Data Fetching:**
- Use `usePaginatedQuery` to call `getAllOpenFeeds` with 20 feeds per page
- For each page of feeds, call `getOpenFeedMembers` with all feed IDs from that page
  - Results will be `Record<Id<"feeds">, Doc<"users">[]>`
- Extract the first 3 members from each feed's result for `<StackedUsers>`

**Structure:**
- **Header:**
  - "< Back to my feeds" link at top left
  - Title: "All open feeds" (centered)
- **Feed List:**
  - Use `<CardList>` component with `<OpenFeedCard>` for each feed
  - Pass `renderCardBody` or custom rendering to `<CardList>`
  - Set gap between cards to `--spacing8` (32px)
- **Pagination:**
  - `<CardList>` handles infinite scroll automatically via intersection observer
  - Load 20 feeds per page
  - As user scrolls, fetch next page and append

**Membership Detection:**
- Use `useUserAuth` hook to access the user's feed memberships
- The hook returns `userFeeds` array containing all user's feed memberships
- Build a Set of feed IDs from `userFeeds` array
- Pass `isUserMember` prop to each `<OpenFeedCard>` based on this Set

**Back Navigation:**
- "< Back to my feeds" link closes the browser view
- Returns to previous feed selector state (no route change)
- Implement via state management in parent component

**Styling:**
- Full-screen overlay similar to feed selector
- Use Framer Motion for animated slide-up reveal when opening
- Match the design in `/assets/375 x 812 - browse open feeds.png`

---

### 5. Feed Selector Modifications
**Location:** `@/app/components/FeedSelector.tsx`

**Change 1: Add "Browse open feeds" Link**
- Add a "Browse open feeds" link/button at the bottom of the feed selector list
- Only visible to logged-in users (feed selector already requires auth)
- Clicking opens `<OpenFeedsBrowser>` component
- Use Framer Motion for animated slide-up transition (similar to existing feed selector modal)
- Implement as full-screen overlay

**Change 2: Show `<CurrentlyViewingOpenFeedCard>` When Viewing Non-Member Feed**
- Use `useUserAuth` hook to access the user's feed memberships
- Check if current `feedId` from `CurrentFeedAndPostContext` is in the user's `userFeeds` array
- If user is viewing a feed they are NOT a member of:
  - Display `<CurrentlyViewingOpenFeedCard>` at the top of the feed selector
  - Pass feed title and feed ID from the current feed
- Reference design: `/assets/375 x 812 - feed selector - viewing open feed.png`
- After user joins the feed via this card:
  - Convex will automatically update the `userFeeds` data via real-time subscription
  - The card will automatically hide when the feed appears in the user's list
  - No manual state updates needed

**Implementation Notes:**
- Add state to manage `<OpenFeedsBrowser>` visibility
- Use `useUserAuth` hook for membership checking (not `getUserFeeds` query)
- Fetch current feed details to get feed title for display
- Coordinate animations between feed selector and browser views
