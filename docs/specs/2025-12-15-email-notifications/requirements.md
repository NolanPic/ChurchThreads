**IMPORTANT**: Be sure to read and understand @/docs/specs/spec-instructions.md before proceeding.

Adding on top of the @/docs/specs/2025-11-14-notifications spec, we need to add email as a notification channel.

User perspective: When something of note happens in the app, the user is notified via email if they have email notifications enabled in their preferences.

# Part 1: Email templates
We will use Resend for sending emails from the app and, in this case, for sending notifications.

- Install Resend (`npm install resend`)
- Install React Email (`npm install @react-email/components`)
- You will be creating the email templates for the design files available in the `/assets` folder. Use React Email to create the templates.
- Create a `Notification.tsx` template under `@/email/notifications`
	- `Notification.tsx` should take `title` and `children` as props. See the design files in the `/assets` folder -- the title is at the top, and the children will be the body of the email
	- The email should be 600px wide
	- The email background should be a gradient: #424769 at themail to #5B628B at the bottom. It should fall back to #424769 for email clients that don't support gradients
- Create email-only components for shared elements:
	- Title (include the down-pointing chevron under the title in the designs)
	- Button (should take `children` and `url` as props)
	- Avatar (should take `imageUrl` and `size` as props)
- Next, create a component for each of the three different notification types that are shown in the `/assets` folder:
	- New post
	- New messages
	- User joined feed
- For the New post and New messages components, they should accept `postHtml` and `messagesHtml` props respectively. `messagesHtml` should be an array of html messages
- Add a Next.js route that can be used to preview the different emails. You will need to fetch the required data to render the template, so look at @/docs/notification-types.md to see what data is required. Then, allow the user of the Next.js route to define querystring params, e.g. "?type=new_post_in_member_feed&userId=abc123&feedId=abc123&postId=abc123"
	- Be sure that the route can only be accessed in development/locally (should not work with production convex db)

## Questions

**Q1: Email template structure and styling**
The requirements specify creating a `Notification.tsx` template that takes `title` and `children`. Should this base template include:
- The full HTML email structure (doctype, html/head/body tags)?
- Common footer elements (unsubscribe link, company info, etc.)?
- Any padding/margin around the content card?

**Answer:** The template should include be everything minus the content. I've added an additional screenshot `/assets/Notification email template.png` to show you what I mean.

**Q2: Color specifications**
The requirements mention:
- Background gradient from #424769 to #5B628B
- The chevron icon color appears to be orange/peach (#F4A261 or similar?)
- The button color also appears to be the same orange/peach
- The content card background appears to be a slightly lighter purple
- Text colors (white for title, lighter text for body)

Can you provide the exact hex values for all colors shown in the designs?

**Answer:** orange/peach for chevron/button/links: #F6B17A; content card: #424769; text color should all be #E0E0E0

**Q3: Typography**
What fonts should be used? The designs show what appears to be an italic serif font. Should we:
- Use a web-safe font stack?
- Load Google Fonts or similar?
- What specific fonts for titles vs body text?

**Answer:** Two google fonts are used: Gentium Plus for the title, and Lato for the body.

**Q4: Notification type coverage**
The requirements mention creating components for three notification types (New post, New messages, User joined feed), but `@/docs/notification-types.md` shows four types including `new_user_needs_approval`. Should we:
- Only implement email templates for the three types shown in designs?
- Plan to add `new_user_needs_approval` later?

**Answer:** Only add the three. The others will be added later.

**Q5: Avatar component sizing**
The Avatar component should take `imageUrl` and `size` props. What specific sizes should be supported? From the designs I see:
- Small avatars for post author and message senders (maybe 40px?)
- Large avatar for user joined notification (maybe 120px?)

**Answer:** Post author and message senders should be 34px. The large user joined avatar should be 80px.

**Q6: Post and message content rendering**
For the New post component with `postHtml` prop and New messages component with `messagesHtml` array:
- Should we sanitize the HTML for security?
- Should there be a max length/truncation for long posts or messages in emails?
- How should we handle rich text formatting (bold, italic, links, etc.)?

**Answer:** If you can, sanitize the HTML with the @/app/components/common/SanitizedUserContent.tsx component. I'm not sure if it will work with the runtime, but we can try it. Do not truncate posts or messages. Rich text formatting can be handled the same way that it is in the app (check out how posts and messages are styled).

**Q7: Button styling and URLs**
The Button component takes `children` and `url` props:
- Should buttons open in new tabs?
- Any tracking parameters to add to URLs?
- Exact padding, border-radius, font-size for buttons?

**Answer:** This button is for email only, so don't open in new tab. No tracking params. Take a look at the `primary` variant styles for the existing Button component (@/app/components/common/Button.tsx). You could even try just using the existing Button component, though I'm not sure it'll work in the runtime.

**Q8: Preview route location**
Where should the preview route be located? Options:
- `/api/email-preview` (API route)
- `/dev/email-preview` (app route)
- Other location?

**Answer:** The app route looks good.

**Q9: Preview route authentication**
The preview route should only work in development. Should it:
- Check `process.env.NODE_ENV === 'development'`?
- Check against Convex deployment type?
- Require any authentication even in dev?

**Answer:** Check the `NODE_ENV`.

**Q10: Email directory structure**
The requirements mention creating templates under `@/email/notifications`. Should the structure be:
```
email/
  notifications/
    Notification.tsx (base template)
    NewPost.tsx
    NewMessages.tsx
    UserJoinedFeed.tsx
  components/ (for shared elements like Button, Avatar, Title)
```

**Answer:** Yes, looks good.

**Q11: Content card styling**
The content cards in the designs have:
- Rounded corners (what radius?)
- Padding (what values?)
- Background color (exact hex?)
- Box shadow or border?

**Answer:** 
- Rounded corners: 32px
- Padding: 47px (sides), 57px (top/bottom)
- Background color: #424769
- Box shadow or border: `box-shadow: 21px 16px 63px -36px rgba(0, 0, 0, 0.25),
           -21px 16px 63px -36px rgba(0, 0, 0, 0.25);`

**Q12: Responsive design**
The requirements specify 600px width. Should the templates:
- Use responsive techniques for smaller screens?
- Be fixed at 600px?
- How should content behave on mobile email clients?

**Answer:** It should be a fixed 600px for desktop, and fluid width for mobile.

## Follow-up Questions

**Q13: New messages data structure**
The "New messages" email design shows multiple message cards with avatar, author name, and message content. Should the `messagesHtml` prop be an array of objects like:
```typescript
{
  html: string;
  authorName: string;
  authorImageUrl: string;
}[]
```
Or a different structure?

**Answer:** Just pass in an `author` prop that is a `user` in convex - the `user` should have those properties on it. You should also pass in the `postId` and `notificationId` to generate the "View" link.

**Q14: HTML sanitization in email runtime**
The SanitizedUserContent component uses "use client" and DOMPurify (browser-only). React Email runs on the server/in Node.js. Should we:
- Skip sanitization for emails (trusting the content is already sanitized)?
- Use a server-side sanitization library like isomorphic-dompurify?
- Handle sanitization before passing HTML to email templates?

**Answer:** Use `isomorphic-dompurify`.

**Q15: CSS variables in emails**
The Button component uses CSS variables (--accent, --spacing3, etc.) which won't work in email clients. For the email button, should I:
- Extract the actual values and use inline styles (e.g., backgroundColor: "#F6B17A", padding: "12px 24px")?
- Create a simplified email-specific button component?

**Answer:** Create a simplified button.

**Q16: New post email content**
The "New post" design shows "John Jenkin in Jenkins homegroup:" above the post content. Should the NewPost component props include:
- `postHtml` (the post content)
- `authorName` (e.g., "John Jenkin")
- `feedName` (e.g., "Jenkins homegroup")
- `authorImageUrl`

Or should this info be embedded in the `postHtml`?

**Answer:** pass in `author` (`user` in convex) and `feed` props.  You should also pass in the `postId` and `notificationId` to generate the "View" link.

**Q17: Multiple messages in email vs single message notification**
The requirements say "New messages" component should accept `messagesHtml` (array), and the design shows multiple message cards. However, looking at the notification schema, each `new_message_in_post` notification only contains a single messageId. Should the email:
- Show only the single message that triggered the notification?
- Query for recent messages in the post and show multiple (e.g., last 3-5 messages)?
- Or is the design showing a different scenario than what's in the current notification system?

**Answer:** The `notificationId` should be the notification for the most recent message in the thread. The email should show the messages for the past N unread messages in that post (unread messages can be inferred from unread notifications for those messages).

## Part 2: Send notification emails
- Reference Convex's documentation: https://www.convex.dev/components/resend#using-react-email
- Make sure to understand how notifications are queued by reading @/convex/notifications.ts and @/convex/pushNotifications.ts. Then, create an `emailNotifications.ts` file with a `sendEmailNotifications` action that can be called in a similar way to `pushNotifications.ts`' -> `sendPushNotifications`.
- In `emailNotifications.ts` -> `sendEmailNotifications` render the correct email notification template and send it using Resend.
- In @/convex/notifications.ts ->`sendNotificationBatch`, modify it around lines 695-705 to schedule `sendEmailNotifications`, similarly to how it schedules push notifications. Be sure that it only sends the notification emails to users who have that preference set (the code should already have this check).
- For the `new_message_in_post` notification type, we do not want to send an email right away. We should wait for a lull in the conversation.
	- When scheduling the `sendEmailNotifications` function, add a delay of 15 minutes. Once called, `sendEmailNotifications` should check to see how long ago the last message was sent. If it was 15 minutes ago or greater, send the emails. If it was less than 15 minutes ago, schedule `sendEmailNotifications` to check again in `15 minutes - minutes since last message was sent`.
	- You will need to create a new internal query `getLastMessageSentInPost` to use in the above logic.

## Questions - Part 2

**Q18: Resend configuration**
Should we use:
- The Convex Resend component (as suggested in the docs link)?
- Or the Resend SDK directly with API keys in environment variables?

What environment variables are needed (e.g., `RESEND_API_KEY`)?

**Answer:** Yes, use the Convex Resend component. I have added the `RESEND_API_KEY` to the env as per the Convex docs instructions.

**Q19: Email subject lines**
What should the subject line be for each notification type?
- New post in feed: ?
- New messages in post: ?
- User joined feed: ?

**Answer:** 
- New post in feed: "{name} just published a post in {feed}" (or "{name} just published a post in your feed, {feed}" if the user owns the feed)
- New messages in post: "{name} responded in a post" (or "{name} messaged in your post" if the user owns the post)
- User joined feed: "{name} just joined {feed}"

**Q20: From email address**
What email address should notifications be sent from? Should it be:
- Configurable via environment variable?
- Hardcoded?
- Include a display name (e.g., "ChurchFeed Notifications <notifications@churchfeed.com>")?

**Answer:** Use the `RESEND_FROM_EMAIL` env variable

**Q21: Email rendering**
Should we use `render()` from `@react-email/render` to convert React Email templates to HTML before sending?

**Answer:** Yes.

**Q22: Data fetching for emails**
Similar to `getNotificationDataForPush`, should I create a `getNotificationDataForEmail` internal query that:
- Fetches user, feed, post data based on notification type
- Converts upload IDs to public image URLs
- Prepares all data needed by email templates
- Returns enriched data for each recipient?

**Answer:** Yes.

**Q23: Image URL generation**
User avatars are stored as `Id<"uploads">` which reference `_storage` IDs. How should we generate public URLs for email templates?
- Use `ctx.storage.getUrl(storageId)` in the query?
- Are these URLs publicly accessible without authentication?

**Answer:** Use `ctx.storage.getUrl(storageId)`

**Q24: Error handling for email sending**
If an email fails to send, should we:
- Log the error and continue (don't block other notifications)?
- Retry with exponential backoff?
- Mark the notification with a failure status?

**Answer:** Log and continue.

**Q25: Message batching for new_message_in_post emails**
For the NewMessages email that shows multiple unread messages, should the logic:
1. Query all unread `new_message_in_post` notifications for the user in that specific post?
2. Fetch all message documents referenced by those notifications?
3. Fetch author data for each message?
4. Pass the complete array to the NewMessages template?

**Answer:** Actually, let's simplify. It should fetch the most recent message along with the top 4 before it (so five total). For each message, fetch the author data and pass the array to the `NewMessages` template.

**Q26: 15-minute delay mechanism**
For the conversation lull detection:
- Should we use `ctx.scheduler.runAfter(ms, action, args)` to schedule the delayed check?
- When rescheduling, should we pass the same recipient list and notification data?
- Should we track state anywhere, or just recalculate everything on each check?

**Answer:** Yes, use `runAfter`. You should recalculate who the recipients should be (more users may have joined the conversation since the first scheduling). You can also recalculate the other data/state.

Additionally, we do not want to schedule more emails if there is already a email scheduled for this post. You should create a query `getScheduledMessageNotifications` that calls `return await ctx.db.system.query("_scheduled_functions").collect();` (see more at the docs here: https://docs.convex.dev/scheduling/scheduled-functions#retrieving-scheduled-function-status) and only schedule if there isn't already a scheduled email notification for this same post.

**Q27: getLastMessageSentInPost query**
This new internal query should:
- Take `postId` as input
- Return what? The timestamp of the most recent message? The full message document?

**Answer:** The `message` document.

**Q28: Notification delivery tracking**
Should we track whether an email was successfully sent? For example:
- Add a field to notifications table?
- Create a separate delivery log?
- Or just log to console?

**Answer:** No, not for now.

**Q29: HTML content for emails**
Posts and messages have `content` field (JSON format?). How should we convert this to HTML for emails?
- Is there a utility function like the `fromJSONToPlainText` I saw in notifications.ts?
- Should we use a `fromJSONToHTML` function?

**Answer:** @/convex/utils/postContentConverter.ts has a `fromJSONToHTML` you can use.

**Q30: Reply-to address**
Should notification emails have a reply-to address? Or should they be no-reply emails?

**Answer:** No-reply.

## Follow-up Questions - Part 2

**Q31: Which message is "most recent" for message batching?**
For Q25, you said to fetch "the most recent message along with the top 4 before it". Should "most recent message" be:
- The message that triggered the notification (from `notification.data.messageId`)?
- Or the absolute most recent message in the post at the time we send the email (in case more messages came in after the notification was created)?

**Answer:** The absolute most recent message.

**Q32: Identifying scheduled emails by post**
For Q26, to check if an email is already scheduled for "this same post", how should we identify which post a scheduled function is for?
- Should we look at the args passed to the scheduled function to find the postId?
- The scheduled functions system returns `{ name, scheduledTime, id, args }` - should we parse the args to extract the postId and compare?

**Answer:** Look at the args and check for the notification type and postId.

**Q33: NewMessages template props structure**
Given that we're fetching 5 messages with author data, should the NewMessages component props be:
```typescript
{
  messages: Array<{
    message: Doc<"messages">;
    author: Doc<"users">;
    authorImageUrl: string;
    messageHtml: string;
  }>;
  postId: Id<"posts">;
  notificationId: Id<"notifications">;
}
```

**Answer:** Yes, that works.