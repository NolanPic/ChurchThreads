"use node";

import crypto from "crypto";

/**
 * Generate a secure random token for invitations
 * Returns a base64url-encoded string (43 characters, URL-safe)
 */
export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}
