import { mutation, internalMutation, internalQuery, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { getUserAuth } from "@/auth/convex";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";

/**
 * Internal query to get storage URL from an upload ID
 * Should only be called from authenticated backend functions
 */
export const getStorageUrlFromUploadId = internalQuery({
  args: {
    uploadId: v.id("uploads"),
  },
  handler: async (ctx, args) => {
    const upload = await ctx.db.get(args.uploadId);
    if (!upload) {
      return null;
    }
    return await ctx.storage.getUrl(upload.storageId);
  },
});

/**
 * Helper function to get storage URL from an upload ID
 * Use this in queries/mutations instead of calling the internal query directly
 */
export async function getStorageUrl(
  ctx: QueryCtx,
  uploadId: Id<"uploads"> | null | undefined
): Promise<string | null> {
  if (!uploadId) return null;
  return await ctx.runQuery(internal.uploads.getStorageUrlFromUploadId, { uploadId });
}

/**
 * Internal mutation to create an upload record in the database
 * Should only be called from the upload HTTP action
 */
export const createUploadRecord = internalMutation({
  args: {
    orgId: v.id("organizations"),
    userId: v.id("users"),
    storageId: v.id("_storage"),
    source: v.union(v.literal("thread"), v.literal("message"), v.literal("avatar")),
    sourceId: v.optional(v.union(v.id("threads"), v.id("messages"), v.id("users"))),
    fileExtension: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const uploadId = await ctx.db.insert("uploads", {
      orgId: args.orgId,
      userId: args.userId,
      storageId: args.storageId,
      source: args.source,
      sourceId: args.sourceId,
      fileExtension: args.fileExtension,
      updatedAt: now,
    });

    return uploadId;
  },
});

/**
 * Internal mutation to delete previous avatar uploads for a user
 * Hard-deletes the upload record and storage file
 */
export const deletePreviousAvatar = internalMutation({
  args: {
    userId: v.id("users"),
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const { userId, orgId } = args;

    // Find all avatar uploads for this user
    const avatarUploads = await ctx.db
      .query("uploads")
      .withIndex("by_org_source_sourceId", (q) =>
        q.eq("orgId", orgId).eq("source", "avatar").eq("sourceId", userId),
      )
      .collect();

    // Delete each avatar upload
    for (const upload of avatarUploads) {
      // Delete the storage file
      try {
        await ctx.storage.delete(upload.storageId);
      }
      catch {}

      // Delete the upload record
      try {
        await ctx.db.delete(upload._id);
      }
      catch {}
    }
  },
});

/**
 * Mutation to patch upload source IDs after thread/message creation
 * Updates uploadIds with the newly created source ID
 */
export const patchUploadSourceIds = mutation({
  args: {
    uploadIds: v.array(v.id("uploads")),
    sourceId: v.union(v.id("threads"), v.id("messages")),
    orgId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const { uploadIds, sourceId, orgId } = args;

    // Authenticate user
    const auth = await getUserAuth(ctx, orgId);
    const user = auth.getUserOrThrow();

    const successfullyUpdated: Id<"uploads">[] = [];

    for (const uploadId of uploadIds) {
      const upload = await ctx.db.get(uploadId);

      // Skip if upload doesn't exist
      if (!upload) {
        continue;
      }

      // Verify upload belongs to authenticated user
      if (upload.userId !== user._id) {
        continue;
      }

      // Verify upload is in the same org
      if (upload.orgId !== orgId) {
        continue;
      }

      // Only patch thread/message uploads
      if(upload.source === "avatar") {
        continue;
      }

      const record = await ctx.db.get(sourceId); // post or message
      if (!record) {
        continue;
      }

      // Verify the record belongs to the authenticated user
      const thread = upload.source === "thread" ? record as Doc<"threads"> : null;
      const message = upload.source === "message" ? record as Doc<"messages"> : null;

      if (thread && thread.posterId !== user._id) {
        continue;
      }

      if (message && message.senderId !== user._id) {
        continue;
      }

      // Update the sourceId
      await ctx.db.patch(uploadId, {
        sourceId,
        updatedAt: Date.now(),
      });

      successfullyUpdated.push(uploadId);
    }

    return successfullyUpdated;
  },
});

/**
 * Internal mutation to delete uploads for multiple threads or messages
 * Deletes both the upload records and storage files
 */
export const deleteUploadsForSources = internalMutation({
  args: {
    orgId: v.id("organizations"),
    source: v.union(v.literal("thread"), v.literal("message")),
    sourceIds: v.array(v.union(v.id("threads"), v.id("messages"))),
  },
  handler: async (ctx, args) => {
    const { orgId, source, sourceIds } = args;

    const deletedUploadIds: Id<"uploads">[] = [];

    // Find and delete uploads for all source IDs
    for (const sourceId of sourceIds) {
      const uploads = await ctx.db
        .query("uploads")
        .withIndex("by_org_source_sourceId", (q) =>
          q.eq("orgId", orgId).eq("source", source).eq("sourceId", sourceId),
        )
        .collect();

      // Delete each upload
      for (const upload of uploads) {
        // Delete the storage file
        try {
          await ctx.storage.delete(upload.storageId);
        } catch (error) {
          console.warn(`Failed to delete storage for upload ${upload._id}:`, error);
        }

        // Delete the upload record
        try {
          await ctx.db.delete(upload._id);
          deletedUploadIds.push(upload._id);
        } catch (error) {
          console.warn(`Failed to delete upload record ${upload._id}:`, error);
        }
      }
    }

    return deletedUploadIds;
  },
});

