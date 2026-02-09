// @vitest-environment edge-runtime
/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import resendTest from "@convex-dev/resend/test";
import schema from "@/convex/schema";
import { internal } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const modules = import.meta.glob("../../convex/**/*.*s");

type Tester = ReturnType<typeof setupTest>;

type Recipient = {
  userId: Id<"users">;
  preferences: Array<"push" | "email">;
};

const BASE_TIME = new Date("2026-01-01T12:00:00.000Z");
const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const originalResendFrom = process.env.RESEND_FROM_EMAIL;
const originalResendApiKey = process.env.RESEND_API_KEY;

function setupTest() {
  const t = convexTest(schema, modules);
  resendTest.register(t, "resend");
  return t;
}

async function seedFixture(t: Tester, recipientCount = 2) {
  return t.run(async (ctx) => {
    const now = Date.now();
    const suffix = now.toString();

    const orgId = await ctx.db.insert("organizations", {
      name: "Test Org",
      location: "Seattle",
      host: `test-${suffix}.churchthreads.dev`,
      updatedAt: now,
    });

    const actorId = await ctx.db.insert("users", {
      orgId,
      email: `actor-${suffix}@example.com`,
      name: "Actor User",
      role: "user",
      settings: { notifications: ["email"] },
    });

    const feedId = await ctx.db.insert("feeds", {
      orgId,
      name: "Announcements",
      privacy: "private",
      updatedAt: now,
    });

    await ctx.db.insert("userFeeds", {
      orgId,
      userId: actorId,
      feedId,
      owner: true,
      updatedAt: now,
    });

    const threadId = await ctx.db.insert("threads", {
      orgId,
      feedId,
      posterId: actorId,
      content: "<p>Hello thread</p>",
      postedAt: now,
      updatedAt: now,
    });

    const messageContent = "<p>Hello message</p>";
    const messageId = await ctx.db.insert("messages", {
      orgId,
      threadId,
      senderId: actorId,
      content: messageContent,
      updatedAt: now,
    });

    const inviteId = await ctx.db.insert("invites", {
      orgId,
      email: `invitee-${suffix}@example.com`,
      name: "Invitee",
      token: `token-${suffix}`,
      type: "email",
      expiresAt: now + 24 * 60 * 60 * 1000,
      useCount: 0,
      createdBy: actorId,
      feeds: [feedId],
    });

    const recipients: Recipient[] = [];
    const recipientEmails: string[] = [];

    for (let i = 0; i < recipientCount; i++) {
      const email = `recipient-${i}-${suffix}@example.com`;
      const userId = await ctx.db.insert("users", {
        orgId,
        email,
        name: `Recipient ${i + 1}`,
        role: "user",
        settings: { notifications: ["email"] },
      });

      await ctx.db.insert("userFeeds", {
        orgId,
        userId,
        feedId,
        owner: false,
        updatedAt: now,
      });

      recipients.push({ userId, preferences: ["email"] });
      recipientEmails.push(email);
    }

    return {
      orgId,
      actorId,
      feedId,
      threadId,
      messageId,
      messageContent,
      inviteId,
      recipients,
      recipientEmails,
    };
  });
}

async function insertMessage(
  t: Tester,
  args: {
    orgId: Id<"organizations">;
    threadId: Id<"threads">;
    senderId: Id<"users">;
    content: string;
  },
) {
  return t.run(async (ctx) => {
    return await ctx.db.insert("messages", {
      orgId: args.orgId,
      threadId: args.threadId,
      senderId: args.senderId,
      content: args.content,
      updatedAt: Date.now(),
    });
  });
}

async function listPendingSendEmailNotifications(t: Tester) {
  return t.run(async (ctx) => {
    const scheduled = await ctx.db.system.query("_scheduled_functions").collect();
    return scheduled.filter(
      (sf) =>
        sf.state.kind === "pending" &&
        sf.name.endsWith(":sendEmailNotifications"),
    );
  });
}

async function advanceAndFinishScheduledFunctions(t: Tester, advanceByMs: number) {
  vi.advanceTimersByTime(advanceByMs + 1);
  await t.finishInProgressScheduledFunctions();
}

async function getResendEmails(t: Tester) {
  const runInComponent = (t as any).runInComponent;
  if (typeof runInComponent !== "function") {
    throw new Error("runInComponent is unavailable in this convex-test build");
  }

  return (await runInComponent("resend", async (ctx: any) => {
    return await ctx.db.query("emails").collect();
  })) as Array<{
    to: string[] | string;
  }>;
}

function assertResendDispatchForRecipients(
  emails: Array<{ to: string[] | string }>,
  recipientEmails: string[],
) {
  expect(emails).toHaveLength(recipientEmails.length);
  const toEmails = emails.flatMap((email) =>
    Array.isArray(email.to) ? email.to : [email.to],
  );
  expect(toEmails).toEqual(expect.arrayContaining(recipientEmails));
}

describe("email notification scheduling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE_TIME);
    process.env.RESEND_FROM_EMAIL = "Church Threads <noreply@example.com>";
    process.env.RESEND_API_KEY = "re_test_key";
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env.RESEND_FROM_EMAIL = originalResendFrom;
    process.env.RESEND_API_KEY = originalResendApiKey;
  });

  it("schedules and dispatches new_thread_in_member_feed emails", async () => {
    const t = setupTest();
    const fixture = await seedFixture(t);

    await t.mutation(internal.notifications.scheduleNotifications, {
      orgId: fixture.orgId,
      type: "new_thread_in_member_feed",
      data: {
        userId: fixture.actorId,
        feedId: fixture.feedId,
        threadId: fixture.threadId,
      },
      recipients: fixture.recipients,
    });

    const pending = await listPendingSendEmailNotifications(t);
    expect(pending).toHaveLength(1);
    expect(pending[0].args?.[0]).toMatchObject({
      type: "new_thread_in_member_feed",
    });

    await advanceAndFinishScheduledFunctions(t, 0);

    const emails = await getResendEmails(t);
    assertResendDispatchForRecipients(emails, fixture.recipientEmails);
  });

  it("schedules and dispatches new_message_in_thread emails after 15 minutes", async () => {
    const t = setupTest();
    const fixture = await seedFixture(t);

    await t.mutation(internal.notifications.scheduleNotifications, {
      orgId: fixture.orgId,
      type: "new_message_in_thread",
      data: {
        userId: fixture.actorId,
        messageId: fixture.messageId,
        messageContent: fixture.messageContent,
        threadId: fixture.threadId,
      },
      recipients: fixture.recipients,
    });

    const pending = await listPendingSendEmailNotifications(t);
    expect(pending).toHaveLength(1);
    expect(pending[0].args?.[0]).toMatchObject({
      type: "new_message_in_thread",
      data: { threadId: fixture.threadId, messageId: fixture.messageId },
    });

    await advanceAndFinishScheduledFunctions(t, FIFTEEN_MINUTES_MS);

    const emails = await getResendEmails(t);
    assertResendDispatchForRecipients(emails, fixture.recipientEmails);
  });

  it("schedules and dispatches new_feed_member emails", async () => {
    const t = setupTest();
    const fixture = await seedFixture(t);

    await t.mutation(internal.notifications.scheduleNotifications, {
      orgId: fixture.orgId,
      type: "new_feed_member",
      data: {
        userId: fixture.actorId,
        feedId: fixture.feedId,
      },
      recipients: fixture.recipients,
    });

    const pending = await listPendingSendEmailNotifications(t);
    expect(pending).toHaveLength(1);
    expect(pending[0].args?.[0]).toMatchObject({
      type: "new_feed_member",
    });

    await advanceAndFinishScheduledFunctions(t, 0);

    const emails = await getResendEmails(t);
    assertResendDispatchForRecipients(emails, fixture.recipientEmails);
  });

  it("schedules and dispatches user_registration emails", async () => {
    const t = setupTest();
    const fixture = await seedFixture(t);

    await t.mutation(internal.notifications.scheduleNotifications, {
      orgId: fixture.orgId,
      type: "user_registration",
      data: {
        userId: fixture.actorId,
        inviteId: fixture.inviteId,
      },
      recipients: fixture.recipients,
    });

    const pending = await listPendingSendEmailNotifications(t);
    expect(pending).toHaveLength(1);
    expect(pending[0].args?.[0]).toMatchObject({
      type: "user_registration",
    });

    await advanceAndFinishScheduledFunctions(t, 0);

    const emails = await getResendEmails(t);
    assertResendDispatchForRecipients(emails, fixture.recipientEmails);
  });

  it("de-dupes delayed new_message_in_thread scheduling for the same thread", async () => {
    const t = setupTest();
    const fixture = await seedFixture(t);

    await t.mutation(internal.notifications.scheduleNotifications, {
      orgId: fixture.orgId,
      type: "new_message_in_thread",
      data: {
        userId: fixture.actorId,
        messageId: fixture.messageId,
        messageContent: fixture.messageContent,
        threadId: fixture.threadId,
      },
      recipients: fixture.recipients,
    });

    const secondMessageId = await insertMessage(t, {
      orgId: fixture.orgId,
      threadId: fixture.threadId,
      senderId: fixture.actorId,
      content: "<p>A newer message</p>",
    });

    await t.mutation(internal.notifications.scheduleNotifications, {
      orgId: fixture.orgId,
      type: "new_message_in_thread",
      data: {
        userId: fixture.actorId,
        messageId: secondMessageId,
        messageContent: "<p>A newer message</p>",
        threadId: fixture.threadId,
      },
      recipients: fixture.recipients,
    });

    const pending = await listPendingSendEmailNotifications(t);
    expect(pending).toHaveLength(1);
    expect(pending[0].args?.[0]).toMatchObject({
      type: "new_message_in_thread",
      data: {
        threadId: fixture.threadId,
        messageId: secondMessageId,
      },
    });
  });
});
