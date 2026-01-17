import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id, Doc } from "./_generated/dataModel";
import { validateFile, getFileExtension } from "../validation";

// ============================================================================
// Type Definitions
// ============================================================================

const UPLOAD_SOURCES = ["thread", "message", "avatar"] as const;
type UploadSource = typeof UPLOAD_SOURCES[number];

type UploadRequestData = {
  file: Blob;
  fileName: string;
  orgId: Id<"organizations">;
  source: UploadSource;
  sourceId?: Id<"threads"> | Id<"messages">;
  feedId?: Id<"feeds">;
};

// ============================================================================
// Helper Utilities
// ============================================================================

/**
 * Type guard to check if source is thread or message
 */
function isThreadOrMessage(source: string): source is "thread" | "message" {
  return source === "thread" || source === "message";
}

/**
 * Converts upload source to the corresponding action type for permission checking
 */
function sourceToAction(source: "thread" | "message"): "post" | "message" {
  return source === "thread" ? "post" : "message";
}

/**
 * Creates an error response for missing feedId
 */
function missingFeedIdError(): Response {
  return jsonResponse(
    { error: "feedId is required for thread/message uploads" },
    400
  );
}

// ============================================================================
// Form Data Parsing
// ============================================================================

/**
 * Parses and validates the upload request FormData
 * Returns structured data or an error response
 */
async function parseUploadRequest(
  request: Request
): Promise<
  | { success: true; data: UploadRequestData }
  | { success: false; error: Response }
> {
  // Parse form data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (error) {
    return {
      success: false,
      error: jsonResponse(
        {
          error: "Failed to parse form data",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        400
      ),
    };
  }

  // Extract and validate file
  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    return {
      success: false,
      error: jsonResponse({ error: "Missing or invalid file" }, 400),
    };
  }

  // Extract and validate fileName
  const fileName = formData.get("fileName");
  if (typeof fileName !== "string" || !fileName) {
    return {
      success: false,
      error: jsonResponse({ error: "Missing fileName" }, 400),
    };
  }

  // Extract and validate orgId
  const orgId = formData.get("orgId") as Id<"organizations">;
  if (!orgId || typeof orgId !== "string") {
    return {
      success: false,
      error: jsonResponse({ error: "Missing orgId" }, 400),
    };
  }

  // Extract and validate source
  const source = formData.get("source");
  if (!source || !UPLOAD_SOURCES.includes(source as UploadSource)) {
    return {
      success: false,
      error: jsonResponse(
        { error: "Invalid source. Must be 'thread', 'message', or 'avatar'" },
        400
      ),
    };
  }

  // Extract optional sourceId
  const sourceIdStr = formData.get("sourceId");
  const sourceId =
    sourceIdStr && typeof sourceIdStr === "string"
      ? (sourceIdStr as Id<"threads"> | Id<"messages">)
      : undefined;

  // Extract optional feedId
  const feedIdStr = formData.get("feedId");
  const feedId =
    feedIdStr && typeof feedIdStr === "string"
      ? (feedIdStr as Id<"feeds">)
      : undefined;

  return {
    success: true,
    data: {
      file,
      fileName,
      orgId,
      source: source as UploadSource,
      sourceId,
      feedId,
    },
  };
}

// ============================================================================
// Authentication & Authorization
// ============================================================================

/**
 * Authenticates the upload request using internal auth query
 * Returns the authenticated user or an error response
 */
async function authenticateUploadRequest(
  ctx: any,
  orgId: Id<"organizations">
): Promise<
  | { success: true; user: Doc<"users"> }
  | { success: false; error: Response }
> {
  const authResult = await ctx.runQuery(
    internal.auth.actionAuth.getAuthenticatedUser,
    { orgId }
  );

  if (!authResult.allowed || !authResult.user) {
    return {
      success: false,
      error: jsonResponse(
        { error: authResult.reason || "Authentication failed" },
        authResult.allowed === false ? 403 : 401
      ),
    };
  }

  return { success: true, user: authResult.user };
}

/**
 * Authorizes thread or message upload by checking feed permissions
 * Returns authorization result or an error response
 */
async function authorizeThreadOrMessageUpload(
  ctx: any,
  userId: Id<"users">,
  feedId: Id<"feeds">,
  orgId: Id<"organizations">,
  action: "post" | "message"
): Promise<{ authorized: true } | { authorized: false; error: Response }> {
  const { allowed, reason } = await ctx.runQuery(
    internal.auth.actionAuth.checkUploadPermission,
    { userId, feedId, orgId, action }
  );

  if (!allowed) {
    return {
      authorized: false,
      error: jsonResponse(
        { error: reason || "Unauthorized to upload to this feed" },
        403
      ),
    };
  }

  return { authorized: true };
}

// ============================================================================
// File Validation & Storage
// ============================================================================

/**
 * Validates the file and stores it in Convex storage
 * Combines validation and storage as they always happen together
 */
async function validateAndStoreFile(
  ctx: any,
  file: Blob,
  fileName: string,
  source: UploadSource
): Promise<
  | { success: true; storageId: Id<"_storage">; fileExtension: string }
  | { success: false; error: Response }
> {
  // Validate the file
  const { valid, errors } = validateFile(file, fileName, source);
  if (!valid) {
    const errorMessages = errors.map((e) => e.message).join(", ");
    return {
      success: false,
      error: jsonResponse(
        { error: `File validation failed: ${errorMessages}` },
        400
      ),
    };
  }

  // Extract file extension
  const fileExtension = getFileExtension(fileName);
  if (!fileExtension) {
    return {
      success: false,
      error: jsonResponse(
        { error: "Invalid file name: no extension found" },
        400
      ),
    };
  }

  // Upload to Convex storage
  let storageId: Id<"_storage">;
  try {
    storageId = await ctx.storage.store(file);
  } catch (error) {
    return {
      success: false,
      error: jsonResponse(
        {
          error: "Failed to upload file to storage",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        500
      ),
    };
  }

  return { success: true, storageId, fileExtension };
}

// ============================================================================
// Response Creation
// ============================================================================

/**
 * Gets the storage URL for a file or returns an error
 */
async function getStorageUrlOrError(
  ctx: any,
  storageId: Id<"_storage">
): Promise<
  | { success: true; url: string }
  | { success: false; error: Response }
> {
  const url = await ctx.storage.getUrl(storageId);
  if (!url) {
    return {
      success: false,
      error: jsonResponse({ error: "Failed to get storage URL" }, 500),
    };
  }
  return { success: true, url };
}

/**
 * Creates a success response with uploadId and storage URL
 */
async function createSuccessResponse(
  ctx: any,
  uploadId: Id<"uploads">,
  storageId: Id<"_storage">
): Promise<Response> {
  const urlResult = await getStorageUrlOrError(ctx, storageId);
  if (!urlResult.success) return urlResult.error;

  return jsonResponse({ uploadId, url: urlResult.url });
}

// ============================================================================
// Upload Type Handlers
// ============================================================================

/**
 * Handles thread or message file uploads
 * Creates upload record and returns success response
 */
async function handleThreadOrMessageUpload(
  ctx: any,
  user: Doc<"users">,
  orgId: Id<"organizations">,
  source: "thread" | "message",
  storageId: Id<"_storage">,
  fileExtension: string,
  sourceId?: Id<"threads"> | Id<"messages">
): Promise<Response> {
  // Create upload record
  const uploadId = await ctx.runMutation(internal.uploads.createUploadRecord, {
    orgId,
    userId: user._id,
    storageId,
    source,
    sourceId,
    fileExtension,
  });

  return await createSuccessResponse(ctx, uploadId, storageId);
}

/**
 * Handles avatar file uploads
 * Deletes previous avatar, creates upload record, and updates user.image
 */
async function handleAvatarUpload(
  ctx: any,
  user: Doc<"users">,
  orgId: Id<"organizations">,
  storageId: Id<"_storage">,
  fileExtension: string
): Promise<Response> {
  // Delete previous avatar if it exists
  // This ensures each user has only one active avatar
  await ctx.runMutation(internal.uploads.deletePreviousAvatar, {
    userId: user._id,
    orgId,
  });

  // Create upload record with user._id as sourceId
  const uploadId = await ctx.runMutation(internal.uploads.createUploadRecord, {
    orgId,
    userId: user._id,
    storageId,
    source: "avatar",
    sourceId: user._id,
    fileExtension,
  });

  // Update user.image to reference the new avatar
  await ctx.runMutation(internal.user.updateUserAvatar, {
    userId: user._id,
    imageId: uploadId,
  });

  return await createSuccessResponse(ctx, uploadId, storageId);
}

// ============================================================================
// Main HTTP Action
// ============================================================================

/**
 * HTTP action for uploading files (thread images, message images, or avatars)
 * Returns: { uploadId, url } on success, { error } on failure
 */
export const uploadFile = httpAction(async (ctx, request) => {
  // 1. Parse and validate the request
  const parseResult = await parseUploadRequest(request);
  if (!parseResult.success) return parseResult.error;
  const { file, fileName, orgId, source, sourceId, feedId } = parseResult.data;

  // 2. Authenticate the user
  const authResult = await authenticateUploadRequest(ctx, orgId);
  if (!authResult.success) return authResult.error;
  const { user } = authResult;

  // 3. Authorize upload based on source type
  if (isThreadOrMessage(source)) {
    // Thread and message uploads require feed permissions
    if (!feedId) return missingFeedIdError();

    const authzResult = await authorizeThreadOrMessageUpload(
      ctx,
      user._id,
      feedId,
      orgId,
      sourceToAction(source)
    );
    if (!authzResult.authorized) return authzResult.error;
  }
  // Avatar uploads only require authentication (users upload their own avatars)

  // 4. Validate and store the file
  const storageResult = await validateAndStoreFile(ctx, file, fileName, source);
  if (!storageResult.success) return storageResult.error;
  const { storageId, fileExtension } = storageResult;

  // 5. Handle upload based on type
  if (isThreadOrMessage(source)) {
    return await handleThreadOrMessageUpload(
      ctx,
      user,
      orgId,
      source,
      storageId,
      fileExtension,
      sourceId
    );
  } else {
    return await handleAvatarUpload(ctx, user, orgId, storageId, fileExtension);
  }
});

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Creates a JSON response with CORS headers
 */
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
