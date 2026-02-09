"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { Resend } from "@convex-dev/resend";
import { render } from "@react-email/render";
import { Register } from "@/email/registration/Register";
import { generateInviteToken } from "./utils/tokenGenerator";
import type { ReactElement } from "react";

/**
 * Create an invitation - action wrapper for token generation
 * Uses crypto.randomBytes which requires Node.js runtime
 */
export const createInvitation = action({
  args: {
    orgId: v.id("organizations"),
    type: v.union(v.literal("email"), v.literal("link")),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    feeds: v.array(v.id("feeds")),
  },
  handler: async (ctx, args): Promise<{ inviteId: Id<"invites">; token: string }> => {
    const token = generateInviteToken();

    const inviteId: Id<"invites"> = await ctx.runMutation(
      internal.invites.createInvitationInternal,
      {
        ...args,
        token,
      }
    );

    return { inviteId, token };
  },
});

type InviteResult = {
  email: string;
  success: boolean;
  error?: string;
  inviteId?: Id<"invites">;
};

/**
 * Create and send email invitations to multiple recipients
 */
export const createAndSendEmailInvitations = action({
  args: {
    orgId: v.id("organizations"),
    feeds: v.array(v.id("feeds")),
    usersToInvite: v.array(
      v.object({
        email: v.string(),
        name: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args): Promise<InviteResult[]> => {
    const { orgId, feeds, usersToInvite } = args;

    const org = await ctx.runQuery(internal.organizations.getOrganization, { orgId });
    if (!org) {
      throw new Error("Organization not found");
    }

    const { user: inviter } = await ctx.runQuery(
      internal.auth.actionAuth.getAuthenticatedUser,
      { orgId }
    );

    if (!inviter) {
      throw new Error("Not authenticated");
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL;

    if (!fromEmail) {
      throw new Error("RESEND_FROM_EMAIL environment variable not set");
    }

    const resend = new Resend(components.resend, { testMode: false });

    const results: InviteResult[] = [];

    for (const userToInvite of usersToInvite) {
      try {
        const token = generateInviteToken();

        const inviteId: Id<"invites"> = await ctx.runMutation(
          internal.invites.createInvitationInternal,
          {
            orgId,
            type: "email",
            name: userToInvite.name,
            email: userToInvite.email.toLowerCase(),
            feeds,
            token,
          }
        );

        const html = await render(
          Register({
            orgHost: org.host,
            inviteToken: token,
            inviterName: inviter.name,
            orgName: org.name,
          }) as ReactElement
        );

        await resend.sendEmail(ctx, {
          from: fromEmail,
          to: userToInvite.email,
          subject: `${inviter.name} invited you to join ${org.name} on ChurchThreads`,
          html,
        });

        results.push({
          email: userToInvite.email,
          success: true,
          inviteId: inviteId,
        });
      } catch (error) {
        results.push({
          email: userToInvite.email,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  },
});
