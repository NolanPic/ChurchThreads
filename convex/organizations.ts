import { query, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const getOrganizationBySubdomain = query({
  args: {
    subdomain: v.string(),
  },
  handler: async (ctx, { subdomain }) => {
    const host = `${subdomain}.${process.env.HOST}`;
    return await ctx.db.query("organizations")
      .withIndex("by_host", (q) => q.eq("host", host))
      .first();
  },
});

export const getOrganization = internalQuery({
  args: {
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.orgId);
  },
});
