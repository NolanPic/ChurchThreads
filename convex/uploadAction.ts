import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { validateFile, getFileExtension } from "../validation";

/**
 * Uploads a file with validation and auth checks
 * Accepts FormData with: file, orgId, source, sourceId (optional), feedId (for thread/message)
 */
export const uploadFile = httpAction(async (ctx, request) => {
  // Parse form data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (error) {
    return jsonResponse(
      {
        error: "Failed to parse form data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      400,
    );
  }

  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    return jsonResponse({ error: "Missing or invalid file" }, 400);
  }

  const fileName = formData.get("fileName");
  if (typeof fileName !== "string" || !fileName) {
    return jsonResponse({ error: "Missing fileName" }, 400);
  }

  const orgId = formData.get("orgId") as Id<"organizations">;
  const source = formData.get("source");

  if (!orgId || typeof orgId !== "string") {
    return jsonResponse({ error: "Missing orgId" }, 400);
  }

  if (source !== "thread" && source !== "message" && source !== "avatar" || typeof source !== "string") {
    return jsonResponse(
      { error: "Invalid source. Must be 'thread', 'message', or 'avatar'" },
      400,
    );
  }

  const sourceIdStr = formData.get("sourceId");
  const sourceId = sourceIdStr && typeof sourceIdStr === "string"
    ? (sourceIdStr as Id<"threads"> | Id<"messages"> | Id<"users">)
    : undefined;

  const feedIdStr = formData.get("feedId");
  const feedId = feedIdStr && typeof feedIdStr === "string" ? (feedIdStr as Id<"feeds">) : undefined;

  // Check Authentication
  const authResult = await ctx.runQuery(
    internal.auth.actionAuth.getAuthenticatedUser,
    { orgId },
  );

  if (!authResult.allowed || !authResult.user) {
    return jsonResponse(
      { error: authResult.reason || "Authentication failed" },
      authResult.allowed === false ? 403 : 401,
    );
  }

  const user = authResult.user;

  // Check Authorization based on source type
  if (source === "thread" || source === "message") {
    if (!feedId) {
      return jsonResponse(
        { error: "feedId is required for thread/message uploads" },
        400,
      );
    }

    // Check upload permission
    const { allowed, reason } = await ctx.runQuery(
      internal.auth.actionAuth.checkUploadPermission,
      {
        userId: user._id,
        feedId,
        orgId,
        action: source === "thread" ? "post" : "message",
      },
    );

    if (!allowed) {
      return jsonResponse(
        {
          error: reason || "Unauthorized to upload to this feed",
        },
        403,
      );
    }
  }
  // For avatars, just being authenticated is sufficient (user uploads their own avatar)

  // Validate the file
  const { valid, errors } = validateFile(file, fileName, source);
  if (!valid) {
    const errorMessages = errors.map((e) => e.message).join(", ");
    return jsonResponse(
      { error: `File validation failed: ${errorMessages}` },
      400,
    );
  }

  // Extract file extension
  const fileExtension = getFileExtension(fileName);

  if (!fileExtension) {
    return jsonResponse(
      { error: "Invalid file name: no extension found" },
      400,
    );
  }

  // For avatars, delete previous avatar if it exists
  if (source === "avatar") {
    await ctx.runMutation(internal.uploads.deletePreviousAvatar, {
      userId: user._id,
      orgId,
    });
  }

  // Upload to Convex storage
  let storageId: Id<"_storage">;
  try {
    storageId = await ctx.storage.store(file);
  } catch (error) {
    return jsonResponse(
      {
        error: "Failed to upload file to storage",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }

  // Create upload record
  // For avatars, sourceId should be the user ID
  const finalSourceId = source === "avatar" ? user._id : sourceId;

  const uploadId = await ctx.runMutation(internal.uploads.createUploadRecord, {
    orgId,
    userId: user._id,
    storageId,
    source,
    sourceId: finalSourceId,
    fileExtension,
  });

  // user record should reference the avatar
  if (source === "avatar") {
    await ctx.runMutation(internal.user.updateUserAvatar, {
      userId: user._id,
      imageId: uploadId,
    });
  }

  // Get storage URL
  const url = await ctx.storage.getUrl(storageId);
  if (!url) {
    return jsonResponse({ error: "Failed to get storage URL" }, 500);
  }

  // Return successful response
  return jsonResponse({
    uploadId,
    url,
  });
});

function jsonResponse(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
