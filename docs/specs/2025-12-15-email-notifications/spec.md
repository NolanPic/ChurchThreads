# Email Notifications Specification

This spec extends the existing notifications system (2025-11-14-notifications) to add email as a notification channel.

## Overview

Users can receive notifications via email when enabled in their preferences. This spec covers:
- Part 1: Email template implementation using React Email and Resend
- Part 2: Email notification sending logic integrated with the existing notification system

---

## Part 1: Email Templates

### 1.1 Dependencies

Install the following packages:
- `resend` - Email sending service
- `@react-email/components` - React components for email templates
- `isomorphic-dompurify` - HTML sanitization for server-side rendering

### 1.2 Directory Structure

```
email/
  components/
    Button.tsx         # Email-specific button component
    Avatar.tsx         # Avatar component with size variants
  notifications/
    Notification.tsx   # Base notification template
    NewPost.tsx        # New post notification
    NewMessages.tsx    # New messages notification
    UserJoinedFeed.tsx # User joined feed notification
```

### 1.3 Design System

**Colors:**
- Background gradient: `#424769` (top) to `#5B628B` (bottom), fallback to `#424769`
- Accent color (buttons, links, chevron): `#F6B17A`
- Content card background: `#424769`
- Text color: `#E0E0E0`

**Typography:**
- Title font: Gentium Plus (Google Font)
- Body font: Lato (Google Font)

**Layout:**
- Email width: 600px (desktop), fluid (mobile)
- Content card border radius: 32px
- Content card padding: 47px (left/right), 57px (top/bottom)
- Content card box shadow: `21px 16px 63px -36px rgba(0, 0, 0, 0.25), -21px 16px 63px -36px rgba(0, 0, 0, 0.25)`

**Avatar Sizes:**
- Small: 34px (for post authors and message senders)
- Large: 80px (for user joined notification)

### 1.4 Shared Components

#### Button Component (`email/components/Button.tsx`)

Built on top of React Email's `<Button>` component.

Props:
```typescript
{
  children: React.ReactNode;
  url: string;
}
```

Styling (based on existing Button component primary variant):
- Background color: `#F6B17A`
- Text color: `#424769` (dark text on light background)
- Font: Lato, 700 weight
- Border radius: 12px
- Height: 30px
- Padding: 12px 24px (equivalent to --spacing3 and --spacing6)
- No border
- Does not open in new tab
- No tracking parameters

#### Avatar Component (`email/components/Avatar.tsx`)

Props:
```typescript
{
  imageUrl: string;
  size: 34 | 80;
}
```

Renders a circular image with the specified size using React Email's `<Img>` component.

### 1.5 Base Template

#### Notification Component (`email/notifications/Notification.tsx`)

Built using React Email components (`Html`, `Head`, `Body`, `Container`, etc.).

Props:
```typescript
{
  title: string;
  children: React.ReactNode;
}
```

The base template includes:
1. React Email's `<Html>`, `<Head>`, and `<Body>` components (not custom HTML structure)
2. Google Fonts import for Gentium Plus and Lato in the `<Head>`
3. Background gradient from `#424769` to `#5B628B` on the body
4. Title text in Gentium Plus italic font at the top
5. Down-pointing chevron icon below the title (color: `#F6B17A`)
6. Content card wrapper with specified styling
7. Children rendered inside the content card
8. Footer with "Manage notification settings" link to `/profile` (for unsubscribe functionality)

The template should be responsive: 600px fixed width on desktop, fluid width on mobile devices.

**Email HTML Best Practices:**
- Use table-based layouts for better email client compatibility
- Inline all CSS styles (React Email handles this automatically)
- Avoid CSS features with poor email client support
- Test rendering across major email clients (Gmail, Outlook, Apple Mail) before launch

### 1.6 Notification Type Templates

#### NewPost Component (`email/notifications/NewPost.tsx`)

Props:
```typescript
{
  author: Doc<"users">;        // User who created the post
  feed: Doc<"feeds">;          // Feed where post was created
  postHtml: string;            // HTML content of the post
  postId: Id<"posts">;
  notificationId: Id<"notifications">;
}
```

Layout (as shown in design):
1. Avatar component (size 34) with author's image
2. Author name and feed name: `{author.name} in {feed.name}:`
3. Post content (sanitized HTML)
4. Button with text "View post" linking to `/post/{postId}`

Note: Feed name should be displayed with orange (#F6B17A) color and as a link to the feed.

#### NewMessages Component (`email/notifications/NewMessages.tsx`)

Props:
```typescript
{
  messages: Array<{
    message: Doc<"messages">;
    author: Doc<"users">;
    messageHtml: string;
  }>;
  postId: Id<"posts">;
  notificationId: Id<"notifications">;
}
```

Layout (as shown in design):
- For each message in the array:
  1. Avatar component (size 34) with author's image
  2. Author name
  3. Message content (sanitized HTML)
- Button with text "View messages" linking to `/post/{postId}/#{notificationId}`

Note: The messages array should contain unread messages from the post, determined by querying unread notifications for `new_message_in_post` type. The notificationId should reference the most recent message notification.

#### UserJoinedFeed Component (`email/notifications/UserJoinedFeed.tsx`)

Props:
```typescript
{
  author: Doc<"users">;        // User who joined
  feed: Doc<"feeds">;          // Feed that was joined
  feedId: Id<"feeds">;
  notificationId: Id<"notifications">;
}
```

Layout (as shown in design):
1. Large centered Avatar component (size 80) with user's image
2. Text: "John joined:" (replace John with author.name)
3. Feed name in italic font
4. Button with text "View feed" linking to `/feed/{feedId}`

### 1.7 Content Sanitization and Rendering

Use `isomorphic-dompurify` to sanitize HTML content before rendering in emails:
- Forbid `<script>` and `<style>` tags
- Allow rich text formatting (bold, italic, links, etc.)
- Do not truncate long posts or messages

Rich text formatting should be handled the same way as in the app (reference existing post and message styling).

### 1.8 Image URLs

User avatars are stored as upload IDs (`Id<"uploads">`) in the user schema. The email templates will need image URLs. The email sending action (Part 2) should:
1. Fetch the upload document using the user's `image` field
2. Generate a URL using Convex's storage URL API
3. Pass the complete URL to email templates

### 1.9 Preview Route

Create a Next.js app route at `/dev/email-preview` that:

**Security:**
- Only works when `process.env.NODE_ENV === 'development'`
- Requires user to be authenticated as an admin
- Returns 404 in production or for non-admin users

**Functionality:**
- Accepts query parameters to specify notification type and IDs:
  - `type`: One of `new_post_in_member_feed`, `new_message_in_post`, `new_feed_member`
  - Required IDs based on type (see notification-types.md):
    - `new_post_in_member_feed`: `userId`, `feedId`, `postId`
    - `new_message_in_post`: `userId`, `postId`, `messageId`
    - `new_feed_member`: `userId`, `feedId`
- Fetches required data from Convex using the provided IDs
- Renders the appropriate email template
- Displays the rendered email in the browser

Example URL: `/dev/email-preview?type=new_post_in_member_feed&userId=abc123&feedId=def456&postId=ghi789`

---

## Part 2: Send Notification Emails

### 2.1 Overview

Integrate email notifications into the existing notification system by:
1. Creating an email sending action using Convex Resend component
2. Creating queries to fetch and prepare data for email templates
3. Modifying `sendNotificationBatch` to schedule email notifications
4. Implementing conversation lull detection for message notifications

### 2.2 Environment Configuration

Required environment variables:
- `RESEND_API_KEY` - Resend API key (already added)
- `RESEND_FROM_EMAIL` - Email address to send notifications from (e.g., "ChurchFeed <notifications@churchfeed.com>")

### 2.3 Email Notification Action

#### File: `convex/emailNotifications.ts`

Create an internal action `sendEmailNotifications` that:

**Signature:**
```typescript
export const sendEmailNotifications = internalAction({
  args: {
    orgId: v.id("organizations"),
    type: notificationTypeValidator,
    data: notificationDataValidator,
    recipients: v.array(
      v.object({
        userId: v.id("users"),
        preferences: v.array(v.union(v.literal("push"), v.literal("email"))),
        notificationId: v.id("notifications"),
      }),
    ),
  },
  handler: async (ctx, args) => { ... }
});
```

**Implementation steps:**

1. **Configure Resend** - Use the Convex Resend component with `RESEND_API_KEY`

2. **Fetch email data** - Call `getNotificationDataForEmail` query to get enriched notification data for all recipients

3. **For each recipient:**
   - Skip if notification data is missing
   - Generate subject line based on notification type (see 2.4)
   - Wrap template rendering in try-catch:
     - Render appropriate email template based on type:
       - `new_post_in_member_feed` → `NewPost` component
       - `new_message_in_post` → `NewMessages` component
       - `new_feed_member` → `UserJoinedFeed` component
     - Use `render()` from `@react-email/render` to convert React template to HTML
     - If rendering fails, log error and skip this recipient
   - Send email via Resend with:
     - `from`: `RESEND_FROM_EMAIL` environment variable
     - `to`: Recipient's email address
     - `subject`: Generated subject line
     - `html`: Rendered HTML
     - `replyTo`: Not set (no-reply emails)

4. **Error handling:**
   - Log errors for individual email failures
   - Continue sending to other recipients (don't block)
   - Return counts: `{ sent: number, failed: number }`

### 2.4 Email Subject Lines

Subject lines should be personalized based on notification type and user relationship:

**new_post_in_member_feed:**
- If user owns the feed: `{name} just published a post in your feed, {feed}`
- Otherwise: `{name} just published a post in {feed}`

**new_message_in_post:**
- If user owns the post: `{name} messaged in your post`
- Otherwise: `{name} responded in a post`

**new_feed_member:**
- `{name} just joined {feed}`

Replace `{name}` with the actor's name and `{feed}` with the feed name.

### 2.5 Data Fetching Queries

#### getNotificationDataForEmail

Create an internal query similar to `getNotificationDataForPush`:

```typescript
export const getNotificationDataForEmail = internalQuery({
  args: {
    orgId: v.id("organizations"),
    type: notificationTypeValidator,
    data: notificationDataValidator,
    recipients: v.array(
      v.object({
        userId: v.id("users"),
        notificationId: v.id("notifications"),
      }),
    ),
  },
  handler: async (ctx, args) => { ... }
});
```

**For each recipient, return:**

Common structure:
```typescript
{
  userId: Id<"users">;
  recipientEmail: string;
  notificationId: Id<"notifications">;
  emailData: /* type-specific data */
}
```

**Type-specific data structures:**

**new_post_in_member_feed:**
```typescript
{
  type: "new_post_in_member_feed";
  author: Doc<"users">;
  authorImageUrl: string | null;
  feed: Doc<"feeds">;
  postHtml: string;
  postId: Id<"posts">;
  userOwnsFeed: boolean;  // For subject line personalization
}
```

**new_message_in_post:**
```typescript
{
  type: "new_message_in_post";
  messages: Array<{
    message: Doc<"messages">;
    author: Doc<"users">;
    authorImageUrl: string | null;
    messageHtml: string;
  }>;
  postId: Id<"posts">;
  userOwnsPost: boolean;  // For subject line personalization
  actorName: string;      // For subject line (author of most recent message)
}
```

For messages: Fetch the absolute most recent message in the post, plus the 4 messages before it (5 total). Convert each message's `content` to HTML using `fromJSONToHTML` from `@/convex/utils/postContentConverter.ts`.

**new_feed_member:**
```typescript
{
  type: "new_feed_member";
  author: Doc<"users">;  // User who joined
  authorImageUrl: string | null;
  feed: Doc<"feeds">;
  feedId: Id<"feeds">;
}
```

**Image URL generation:**
- For users with an `image` field (Id<"uploads">), fetch the upload document
- Get the `storageId` from the upload document
- Use `ctx.storage.getUrl(storageId)` to generate a public URL
- If no image or upload not found, use `null`

#### getLastMessageSentInPost

Create an internal query to support conversation lull detection:

```typescript
export const getLastMessageSentInPost = internalQuery({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    // Query messages for this post, ordered by _creationTime descending
    // Return the most recent message document
    // Return null if no messages found
  }
});
```

#### getScheduledMessageNotifications

Create an internal query to check for already-scheduled email notifications:

```typescript
export const getScheduledMessageNotifications = internalQuery({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const scheduled = await ctx.db.system.query("_scheduled_functions").collect();

    // Filter to find scheduled sendEmailNotifications calls for this post
    // Check each scheduled function's name and args
    // Look for functions where:
    //   - name is "sendEmailNotifications"
    //   - args.type is "new_message_in_post"
    //   - args.data.postId matches the provided postId (extract from notification data)

    return scheduled.filter(/* matching criteria */);
  }
});
```

Note: `_scheduled_functions` returns objects with `{ name, scheduledTime, id, args }`. Parse the args to extract the notification type and postId.

### 2.6 Integration with Notification System

#### Modify `sendNotificationBatch` in `convex/notifications.ts`

Around lines 695-705, add email notification scheduling:

```typescript
// Existing push notification code
if (pushRecipients.length > 0) {
  await ctx.scheduler.runAfter(
    0,
    internal.pushNotifications.sendPushNotifications,
    {
      orgId,
      type,
      data,
      recipients: pushRecipients,
    },
  );
}

// Add email notification scheduling
if (emailRecipients.length > 0) {
  // Special handling for new_message_in_post
  if (type === "new_message_in_post") {
    // Check if email already scheduled for this post
    const messageId = (data as { messageId: Id<"messages"> }).messageId;
    const message = await ctx.db.get(messageId);
    if (!message) {
      console.error("Message not found for notification");
      return;
    }
    const postId = message.postId;

    const alreadyScheduled = await ctx.runQuery(
      internal.notifications.getScheduledMessageNotifications,
      { postId }
    );

    if (alreadyScheduled.length === 0) {
      // Schedule with 15-minute delay
      await ctx.scheduler.runAfter(
        15 * 60 * 1000,  // 15 minutes
        internal.emailNotifications.sendEmailNotifications,
        {
          orgId,
          type,
          data,
          recipients: emailRecipients,
        },
      );
    }
  } else {
    // Send immediately for other notification types
    await ctx.scheduler.runAfter(
      0,
      internal.emailNotifications.sendEmailNotifications,
      {
        orgId,
        type,
        data,
        recipients: emailRecipients,
      },
    );
  }
}
```

### 2.7 Conversation Lull Detection

For `new_message_in_post` notifications, implement a 15-minute delay with lull detection:

**In `sendEmailNotifications` action:**

When handling `new_message_in_post` type:

1. **Get the post from notification data:**
   - Extract `messageId` from notification data
   - Query the message to get its `postId`

2. **Check conversation lull:**
   - Call `getLastMessageSentInPost` with the postId
   - Get the most recent message's `_creationTime`
   - Calculate time since last message: `Date.now() - lastMessage._creationTime`

3. **Decision logic:**
   - If time since last message ≥ 15 minutes: Send emails immediately
   - If time since last message < 15 minutes:
     - Calculate remaining wait time: `15 minutes - time since last message`
     - Reschedule this action using `ctx.scheduler.runAfter(remainingTime, ...)`
     - **Important:** When rescheduling, recalculate recipients by querying current notification preferences and active users in the post (users may have joined/left the conversation)

4. **Avoid duplicate scheduling:**
   - Before rescheduling, check `getScheduledMessageNotifications` to ensure no duplicate is created
   - If a scheduled notification already exists for this post, don't reschedule

**Recipient recalculation:**
When rescheduling, recalculate recipients using the existing `getNotificationRecipients` function from `@/convex/notifications.ts`:
- Call `getNotificationRecipients` with the postId and notification type
- This function handles:
  - Finding all users who should receive the notification
  - Checking their notification preferences for email
  - Excluding users who have disabled email notifications
  - Returning properly formatted recipient list
- This ensures the email goes to all current participants with correct preferences

### 2.8 Testing

Use the `/dev/email-preview` route (created in Part 1) to test email rendering before implementing the sending logic. Once sending is implemented, test with:
- Real notification triggers in development environment
- Verify 15-minute delay and lull detection for message notifications
- Verify no duplicate emails are sent when multiple messages arrive quickly
