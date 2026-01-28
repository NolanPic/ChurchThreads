/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth_actionAuth from "../auth/actionAuth.js";
import type * as emailNotifications from "../emailNotifications.js";
import type * as feeds from "../feeds.js";
import type * as http from "../http.js";
import type * as invites from "../invites.js";
import type * as invitesActions from "../invitesActions.js";
import type * as messages from "../messages.js";
import type * as notifications from "../notifications.js";
import type * as organizations from "../organizations.js";
import type * as pushNotifications from "../pushNotifications.js";
import type * as pushSubscriptions from "../pushSubscriptions.js";
import type * as registration from "../registration.js";
import type * as renderEmailTemplate from "../renderEmailTemplate.js";
import type * as seed_seed from "../seed/seed.js";
import type * as seed_storage from "../seed/storage.js";
import type * as threads from "../threads.js";
import type * as types_notifications from "../types/notifications.js";
import type * as uploadAction from "../uploadAction.js";
import type * as uploads from "../uploads.js";
import type * as user from "../user.js";
import type * as userMemberships from "../userMemberships.js";
import type * as utils_threadContentConverter from "../utils/threadContentConverter.js";
import type * as utils_tokenGenerator from "../utils/tokenGenerator.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "auth/actionAuth": typeof auth_actionAuth;
  emailNotifications: typeof emailNotifications;
  feeds: typeof feeds;
  http: typeof http;
  invites: typeof invites;
  invitesActions: typeof invitesActions;
  messages: typeof messages;
  notifications: typeof notifications;
  organizations: typeof organizations;
  pushNotifications: typeof pushNotifications;
  pushSubscriptions: typeof pushSubscriptions;
  registration: typeof registration;
  renderEmailTemplate: typeof renderEmailTemplate;
  "seed/seed": typeof seed_seed;
  "seed/storage": typeof seed_storage;
  threads: typeof threads;
  "types/notifications": typeof types_notifications;
  uploadAction: typeof uploadAction;
  uploads: typeof uploads;
  user: typeof user;
  userMemberships: typeof userMemberships;
  "utils/threadContentConverter": typeof utils_threadContentConverter;
  "utils/tokenGenerator": typeof utils_tokenGenerator;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
