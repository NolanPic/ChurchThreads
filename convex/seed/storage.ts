import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";

/**
 * Store a file in Convex storage (for seed script use)
 * This is an action that accepts a base64 encoded file and returns the storage ID
 */
export const store = action({
  args: {
    fileData: v.string(), // base64 encoded file data
    mimeType: v.string(), // MIME type of the file
  },
  handler: async (ctx, args): Promise<Id<"_storage">> => {
    // Decode base64 to binary string
    const binaryString = atob(args.fileData);

    // Convert binary string to Uint8Array
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Create a Blob from the Uint8Array
    const blob = new Blob([bytes], { type: args.mimeType });

    // Store the blob
    const storageId = await ctx.storage.store(blob);
    return storageId;
  },
});

/**
 * Get a URL for a storage ID (for seed script use)
 */
export const getUrl = action({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args): Promise<string | null> => {
    const url = await ctx.storage.getUrl(args.storageId);
    return url;
  },
});

/**
 * Create an upload record (exposed for seed script use)
 * Wraps the internal mutation to make it callable from the seed script
 */
export const createUploadRecord = action({
  args: {
    orgId: v.id("organizations"),
    userId: v.id("users"),
    storageId: v.id("_storage"),
    source: v.union(v.literal("thread"), v.literal("message"), v.literal("avatar")),
    sourceId: v.optional(v.union(v.id("threads"), v.id("messages"), v.id("users"))),
    fileExtension: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"uploads">> => {
    const uploadId: Id<"uploads"> = await ctx.runMutation(internal.uploads.createUploadRecord, {
      orgId: args.orgId,
      userId: args.userId,
      storageId: args.storageId,
      source: args.source,
      sourceId: args.sourceId,
      fileExtension: args.fileExtension,
    });
    return uploadId;
  },
});
