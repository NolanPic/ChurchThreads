**IMPORTANT**: Be sure to read and understand @/docs/specs/spec-instructions.md before proceeding.

# Overview
There are three types of feeds in churchfeed:

1. Public feeds: anyone, regardless of being logged in, can view
2. Open feeds: logged-in users can view
3. Private feeds: invited logged-in users can view

Logged-in users should be able to browse a list of open and public feeds (we can consider these two feed types as both being "open" as it concerns the user). They should be able to view the contents of the feed or join the feed.

There are design screenshots available in the `/assets` folder.

# Part 1: Backend
We need the following Convex queries/mutations:

1. `getAllOpenFeeds` query. This should return feeds that have a `privacy` of `open` or `public`. Only logged-in users should be able to call. This should be a paginated query (you can find examples of these elsewhere in the app). This query should be in `@/convex/feeds.ts`
2. `joinOpenFeed` query. This should add the authenticated user as a member of the feed. Should be in `@/convex/userMemberships.ts`. This should be similar to `inviteUsersToFeed` but for the authenticated user instead of inviting other users.
3. `getFeedMembers` this is already an existing query in `@/convex/userMemberships.ts`. However, two modifications need to be made:
	1. We need to be able to pass in an array of feed IDs instead of just one feed ID, and return an array of objects (each object has the feed ID as the key and the value is the list of members).
	2. Currently, there's a member check that requires you to be a member of the feed to get the members. We should change this so that this check ONLY applies if the feed has a `privacy` of `private` (in other words, a logged-in user can view the members of open and public feeds).
	3. Be sure that you check for existing usages of `getFeedMembers` and update them to support the array being returned.

## Questions

**Q1: For `getAllOpenFeeds`, should it return feeds ONLY for the current organization (like `getUserFeeds` does with the `by_org_privacy` index)?**
**Answer:** Yes, all data in ANY query/mutation should always be scoped to the org ID.

**Q2: For `getAllOpenFeeds`, should it exclude feeds that the user is already a member of, or include all open/public feeds regardless of membership status?**
**Answer:** No, don't exclude feeds the user is a member of.

**Q3: For `joinOpenFeed` (item 2), you mentioned it should be a "query" but joining a feed would modify the database. Should this be a "mutation" instead?**
**Answer:** Yes, pardon me, a mutation.

**Q4: For `joinOpenFeed`, should it check if the user is already a member and handle that gracefully (no-op or error)?**
**Answer:** It should error. The frontend should handle it more gracefully.

**Q5: For `joinOpenFeed`, should it send notifications to feed owners like `inviteUsersToFeed` does?**
**Answer:** Yes.

**Q6: For `joinOpenFeed`, should it validate that the feed's privacy is actually "open" or "public" before allowing the join?**
**Answer:** Yes.

**Q7: For `getFeedMembers` modifications (item 3.1), when you say "an array is an object where the feed ID is the key", do you mean the return type should be a Record/dictionary like `Record<Id<"feeds">, Member[]>` rather than an actual array?**
**Answer:** Yes.

**Q8: For `getFeedMembers` modifications (item 3.2), when checking if a feed is private, should we fetch each feed document for each feed ID to check its privacy setting?**
**Answer:** You should fetch all the feeds using Convex's `getAll` helper function.

**Q9: For `getFeedMembers`, should the existing pagination remain when accepting an array of feed IDs, or should pagination be removed/modified since we're fetching members for multiple feeds?**
**Answer:** It can remain

**Q10: For `getFeedMembers`, the current implementation returns detailed member info including avatars with pagination. When accepting multiple feed IDs, should we maintain the same level of detail for all feeds, or would a simpler member list be acceptable for the multi-feed case?**
**Answer:** You should still get all the details. The frontend will grab only the first 50 users from each using the query's pagination (I have updated Part 2 to reflect this).

# Part 2: Frontend

## Questions

**Q1: The design shows a globe icon for public feeds. Since there's no globe icon in `/public/icons`, should I create one, or would you prefer to use a different existing icon or emoji?**
**Answer:** I have added `/public/icons/globe.svg`.

**Q2: For the `<OpenFeedCard>` "Read more" functionality (item 5), should clicking "Read more" expand inline within the card, or open a modal/popover with the full description?**
**Answer:** Expand inline.

**Q3: For `<StackedUsers>`, the design shows avatars overlapping. Should there be a specific overlap amount (e.g., negative margin) or a CSS variable for this?**
**Answer:** Use a CSS variable that I can modify.

**Q4: For `<CurrentlyViewingOpenFeedCard>`, should the "Join" button be a primary button (matching the design with the accent color background)?**
**Answer:** Yes.

**Q5: For `<OpenFeedsBrowser>`, the "< Back to my feeds" link should navigate back to the feed selector. Should this close the browser view and return to the previous feed selector state, or navigate to a specific route?**
**Answer:** For now it should just close and return to the previous state.

**Q6: For the feed selector changes (item 1), you mentioned "animated slide up to reveal" for opening `<OpenFeedsBrowser>`. Should this use Framer Motion like the existing feed selector modal, and should it be a full-screen overlay similar to the feed selector itself?**
**Answer:** Yes and yes.

**Q7: For feed selector changes (item 2), to determine if "the user is viewing/previewing a feed that they are not a member of", should we check if the current `feedId` from context is not in the user's list of feeds from `getUserFeeds`?**
**Answer:** Yes.

**Q8: Should `<OpenFeedCard>` have any loading/pending states for the "Join" button while the mutation is in progress?**
**Answer:** The button should read "Joining..." while the mutation is in progress. The button should be disabled in this state.

**Q9: After successfully joining a feed via the "Join" button in `<OpenFeedCard>`, should the button update to show "Joined" and become disabled, or should the card remain unchanged until a refetch occurs?**
**Answer:** It should update to show "Joined" and be disabled.

**Q10: Where should the `<OpenFeedCard>`, `<StackedUsers>`, `<CurrentlyViewingOpenFeedCard>`, and `<OpenFeedsBrowser>` components be located in the file structure?**
**Answer:** `<CurrentlyViewingOpenFeedCard>`, `<OpenFeedCard>`, and `<OpenFeedsBrowser>` should go under `@/app/components/feeds`. `<StackedUsers>` should go under `@/app/components/common`.

## `<OpenFeedCard>`
We need to create a new feed card, e.g. `<OpenFeedCard />` for displaying open feeds.

1. Compose `<OpenFeedCard />` with the existing `<Card>` component.
2. The card component should have the feed title and a list of users (as stacked avatars - see next heading) in the card heading. If the feed's `privacy` is `public`, there should be a globe icon after the feed's title.
3. The card body should have the feed's description and two `<Button>`s: "Join" (primary button) and "View" (secondary button) - which allow you to join and view the feed respectively. See `/assets/375 x 812 - feed selector - viewing open feed.png` for an example of what this component looks like.
4. The "Join" button should call `joinOpenFeed`. The "View" button should navigate the user to that feed (e.g. `/feeds/${feedId}`).
5. If the description is more than three lines, show an ellipses "..." and "Read more". Clicking/tapping on "Read more" should expand the description.

It should have the following props:
1. `feed`: the feed from convex
2. `isUserMember`: if true, the "Join" button should read "Joined" and be disabled
3. `users`: the list of users for the stacked avatars

## `<StackedUsers>`
`<OpenFeedCard>` needs a list of stacked user avatars, and a count to the side of the remaining users in the list.

1. Each avatar should be 34x34px.
2. Each avatar should have a 1px border using `--accent`.
3. The remaining user count should have a color of `--accent`.

It should have the following props:

1. `users`: a list of users whose avatars you want to display
2. `numberOfAvatarsToShow`: the number of avatars you want to show
3. `showRemainingCount`: The remaining number of `users` after taking  `numberOfAvatarsToShow`. For example, if you have 16 users and are showing 3 avatars, the remaining count should read "+13" next to the avatars

## `<CurrentlyViewingOpenFeedCard>`
This is a card that is displayed when the user is viewing a feed that they are *not* a member of. It should read, "You are viewing an open feed:" followed by the feed name in larger type, followed by a "Join" button that calls `joinOpenFeed`.

Props:
1. `feedTitle`
2. `feedId` - needed to pass to `joinOpenFeed`

## `<OpenFeedsBrowser>`
This component will be a list of `<OpenFeedCard>`, and will be navigated to from the feed selector (see `/assets/375 x 812 - feed selector.png` - which is implemented in `@/app/components/FeedSelector.tsx`).

1. At the very top left, show a "< Back to my feeds"  link that will take the user back to the feed selector.
2. The title at the top should read "All open feeds".
3. Get all of the feeds from `getAllOpenFeeds` and display them using `<CardList>`.
4. More feeds should load as the user scrolls down (CardList works with paginated queries). 
5. Get all of the feed IDs, and use them to call `getFeedMembers` for passing to the feed card's `users` prop. You should set the page size of `getFeedMembers` at 50. Note that this needs to be done for each new "page" of `getAllOpenFeeds` pagination.
6. Use `--spacing8` as the gap between cards.
7. Load 20 feeds at a time in the pagination.
8. Show 3 stacked avatars at a time, and show the remaining count.

See `/assets/375 x 812 - browse open feeds.png` for how this should look.

## Changes to the feed selector
To tie everything above together, we need to make some changes to the feed selector, which is implemented in `@/app/components/FeedSelector.tsx`.

1. Add a "Browse open feeds" link at the bottom of the selector. It should only be visible to logged-in users. This should open `<OpenFeedsBrowser>` with an animated slide up to reveal.
2. If the user is viewing/previewing a feed that they are not a member of, we should display `<CurrentlyViewingOpenFeedCard>` at the top of the feed selector (see `/assets/375 x 812 - feed selector - viewing open feed.png`)  
