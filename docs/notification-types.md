# Notification Types

Notifications are available as push notifications and email, with the possibility of extending to SMS. Below is a breakdown of each type of notification.

## New post in feed

**Trigger**: A new post is published in a feed that the user is a member of
**Label**: `new_post_in_member_feed`
**Details**: If the user is the owner of the feed, the title and body are customized accordingly.
**Push title**: "New post" (or "New post in your feed" if the user owns the feed)
**Push body**: "{name} just published a post in {feed}" (or "{name} just published a post in your feed, {feed}" if the user owns the feed)
**Action**: Navigates to `/post/{postId}`
**Data**: `userId`, `feedId`, `postId`

## New message in post

**Trigger**: A new message is sent in a post that the user has messaged in
**Label**: `new_message_in_post`
**Details**: If the user is the owner of the post (the poster), the title is customized accordingly.
**Push title**: "{name} responded in a post" (or "{name} messaged in your post" if the user owns the post)
**Push body**: "{message contents}"
**Action**: Navigates to `/post/{postId}/#{messageId}`
**Data**: `messageId` and the message content (`message.content` is the source data, which then needs to be converted into HTML or plain text, for email and push respectively)

## Someone joins a feed user owns

**Trigger**: Somebody joins a feed that the user is an owner of
**Label**: `new_feed_member`
**Details**:
**Push title**: "Someone joined your feed"
**Push body**: "{name} just joined {feed}"
**Action**: Navigates to`/feed/{feedId}`
**Data**: `userId` and `feedId`

## Someone registers

**Trigger**: Someone registers after they have been invited
**Label**: `user_registration`
**Details**:
**Push title**: "New user joined"
**Push body**: "{name} just registered"
**Action**: None (just opens the app)
**Data**: `userId`

---

## Template

**Trigger**:  
**Label**:
**Details**:
**Push title**:
**Push body**:
