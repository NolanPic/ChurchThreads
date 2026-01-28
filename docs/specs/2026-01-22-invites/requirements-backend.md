Now with the `invites` table and registration complete (https://github.com/NolanPic/ChurchThreads/issues/116), we need to add the ability for feed owners to invite new users (eventually admins will be able to invite from the Directory as well).

Note that there are two types of invites: `email` and `link`. Email invites have one invite record per user, always have a `invites.name` and `invites.email` set, and should only be used once. Link invites can be used to invite many users (one invite to many users) and will not set the `invites.name` or `invites.email`.

This is part 1 of 2. The frontend requirements can be found [here](docs/specs/2026-01-22-invites/requirements-frontend.md).
## Backend

- Add a new email component under `@email/registration/Register.tsx`
	- Takes:
		- `orgHost` - for creating the invite link
		- `inviteToken` - also for creating the invite link
		- `inviterName` - name of the person who invited
		- `orgName` - name of the org
	- The email should be very simple and read, "{inviterName} from {orgName} invited you to join ChurchThreads!"
	- Below the text should be a "Join" button that goes to: `https://{orgHost}/register?token={inviteToken}`
- Add a `createInvitation` mutation
	- Only an authenticated user can call this
	- Takes:
		- `orgId`
		- `type` (`link` or `email`)
		- `name` (optional)
		- `email` (optional)
		- `feeds` (array of feed IDs)
	- `createInvitation` will create a new `invites` record with the arguments passed, and also set some things internally:
		- `createdBy` should be set to the authenticated user
		- `expiresAt` should be set to 3 days in the future for `email` invites and 1 day for `link` invites
		- `token` should be created using a utility function that uses `crypto.randomBytes(32).toString('base64url')`
	- Validation:
		- Validate that, if `email` is provided, a user with that email does not exist already
		- Validate that each of the IDs in `feeds` is an actual feed, belongs to the org, and that the authenticated user is an owner of that feed or an admin
- Add a `createAndSendEmailInvitations` mutation
	- Only an authenticated user can call this
	- Takes:
		- `orgId`
		- `feeds` (array of feed IDs)
		- `usersToInvite` (looks like `[{ email: string, name: string }, ...]`)
	  For each user in`usersToInvite`, call `createInvitation` with `type` set to `email`, and the `name` and `email` from `usersToInvite`
	- Once the invites are created, for each invite send an email to the user using Resend and  the new `Register` email component. Right now the notification system is the only thing using Resend, so we may need to refactor this a bit so that both systems can use the same basic Resend "send email" code