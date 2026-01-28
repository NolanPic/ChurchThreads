This is part 2 of implementing the invites system. The backend requirements can be found [here](docs/specs/2026-01-22-invites/requirements-backend.md).

## Frontend

- See design assets in the /assets folder. Design files are also referenced below, so be sure you understand the functionality in relation to the design.
- Create `InviteModal` component
  - Takes an optional `feed` prop - this is for when a feed owner is inviting a new user to their feed
  - The modal has multiple steps, and when going to the next step there should be an animation from right to left
  - Each step should use Nextjs router/keep the step in browser history so that the user can swipe to go back to the previous step
  - Each step uses card components to give the user options
  - Step 1: user is given two options: 1) Invite by email, or 2) Invite by QR code. This selection should be stored in state. Design: assets/1-invite-user-options.png
  - Step 2: Select feeds for the invited users to be added to
    - Two options for user: 1) Add feeds, or 2) Skip
    - In the Add feeds card, use a `MultiSelectComboBox`
      - The options should be populated by the `getUserFeeds` query,
      - This will return all feeds that the authenticated user is a member of, but we only want to display the feeds that the user is an owner of, e.g. `auth.feed(feedId).hasRole("owner")`
    - If the `feed` prop is set, this should be the first feed that the user is added to. If so, the message in the card should say, "Should the invited user(s) be added to other feeds besides “{feed.name}”?" Otherwise, it should say, "Select feeds to add the invited user(s) to."
    - When the user hits "Continue", call `createInvitation` with the type `link` and the selected feeds as `feeds`, then continue to the next step
    - If no `feed` prop is supplied, do not render the Skip option
    - Design: /assets/2-add-user-to-more-feeds.png and /assets/3-more-feeds-selected.png
  - Step 3:
    - If the user chose to invite by QR code:
      - Render the ChurchThreads logo at the top of the modal, and underneath it render a QR code using `qrcode.react` (`npm install qrcode.react`). The code's value should be `https://{orgHost}/register?token={invite.token}`
    - Design: /assets/4-QR-code.png
    - If the user chose to invite by email:
      - Render a "Send invites" card. The message to the user should be, "Enter emails to send invites to below. Please use a comma between each email."
      - Below the message, render a `MultiSelectComboBox` where the user can type in emails
      - NOTE: `MultiSelectComboBox` currently only supports selecting from predefined values. It will need to be modified so that it can also take in user values, separated by a comma. When the user types a comma, the previous text should be turned into a pill
        - Pasting values should also work, and it should automatically create pills from pasted values. If there are commas in the pasted text, it should be treated as separate values
      - When the user hits "Send", call `createAndSendEmailInvitations` with the user emails
    - Design: /assets/5-send-email-invites.png and /assets/6-email-invites-sent.png
  - Please create logical subcomponents to break up `InviteModal` into more files
- In the `FeedMembersTab` component, add a "Invite new user" button at the top. This should trigger `InviteModal`
