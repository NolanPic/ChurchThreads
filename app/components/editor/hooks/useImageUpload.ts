"use client";

import { useState, useCallback, useContext, useEffect } from "react";
import { useMutation } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "../../../../convex/_generated/api";
import { useOrganization } from "../../../context/OrganizationProvider";
import { CurrentFeedAndThreadContext } from "../../../context/CurrentFeedAndThreadProvider";
import { Id } from "@/convex/_generated/dataModel";
import { validateFile } from "@/validation";

type UploadType = "thread" | "message" | "avatar";

export interface UseImageUploadReturn {
  /**
   * Final Convex storage URL (null until upload completes)
   */
  imageUrl: string | null;
  /**
   * Data URL for immediate preview (null until file selected)
   */
  previewUrl: string | null;
  isUploading: boolean;
  error: Error | null;
  /**
   * Upload an image file
   * @param file - The image file to upload
   */
  uploadImage: (file: File) => Promise<void>;
}

export interface UseImageUploadOptions {
  /**
   * The type of upload (thread, message, or avatar)
   */
  source: UploadType;
  /**
   * The source ID (thread ID, message ID, or user ID)
   * Can be null while drafting, then updated once published
   */
  sourceId?: Id<"threads"> | Id<"messages"> | Id<"users"> | null;
}

/**
 * Reusable hook for uploading images to Convex storage.
 *
 * This hook provides core image upload functionality that can be used
 * anywhere in the app (avatars, profile images, editor images, etc.).
 *
 * @param options - Upload options including source type and optional sourceId
 * @returns Object with imageUrl, previewUrl, isUploading, error, and uploadImage function
 *
 * @example
 * ```tsx
 * const { imageUrl, previewUrl, isUploading, error, uploadImage } = useImageUpload({
 *   source: "thread",
 *   sourceId: threadId,
 * });
 *
 * const handleFileSelect = async (file: File) => {
 *   await uploadImage(file);
 * };
 * ```
 */
export function useImageUpload(
  options: UseImageUploadOptions,
): UseImageUploadReturn {
  const { source, sourceId } = options;

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [uploadIds, setUploadIds] = useState<Id<"uploads">[]>([]);

  const patchUploadSourceIds = useMutation(api.uploads.patchUploadSourceIds);
  const { getToken } = useAuth();

  const org = useOrganization();
  const { feedId, feedIdOfCurrentThread } = useContext(CurrentFeedAndThreadContext);

  const feedIdForThreadsAndMessages = feedId || feedIdOfCurrentThread;

  // Effect to patch upload source IDs when sourceId changes
  useEffect(() => {
    const updateUploadSourceIds = async () => {
      // Only run for thread and message uploads (not avatars)
      if (source !== "thread" && source !== "message") {
        return;
      }

      // Only run if sourceId changed from null/undefined to a value
      if (uploadIds.length > 0 && sourceId && org?._id) {
        try {
          await patchUploadSourceIds({
            uploadIds,
            sourceId: sourceId as Id<"threads"> | Id<"messages">,
            orgId: org._id as Id<"organizations">,
          });
          // Clear uploadIds after successful patch
          setUploadIds([]);
        } catch (err) {
          console.error("Failed to patch upload source IDs:", err);
        }
      }
    };

    updateUploadSourceIds();
  }, [sourceId, uploadIds, patchUploadSourceIds, org, source]);

  const uploadImage = useCallback(
    async (file: File) => {
      try {
        setIsUploading(true);
        setError(null);

        // Validate context
        const orgId = org?._id as Id<"organizations"> | undefined;
        if (!orgId) {
          throw new Error(
            "No organization found. Please ensure you're logged in.",
          );
        }

        // Validate file before upload
        const validationResult = validateFile(file, file.name, source);
        if (!validationResult.valid) {
          const errorMessages = validationResult.errors
            .map((e) => e.message)
            .join(", ");
          throw new Error(`File validation failed: ${errorMessages}`);
        }

        // Create data URL for immediate visual feedback
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        setPreviewUrl(dataUrl);

        // Get auth token from Clerk
        const token = await getToken({ template: "convex" });
        if (!token) {
          throw new Error("Failed to get authentication token");
        }

        // Prepare FormData
        const formData = new FormData();
        formData.append("file", file);
        formData.append("fileName", file.name);
        formData.append("orgId", orgId);
        formData.append("source", source);

        // Only include feedId for thread/message uploads
        if (source === "thread" || source === "message") {
          if (!feedIdForThreadsAndMessages) {
            throw new Error("Feed ID is required for thread/message uploads");
          }
          formData.append("feedId", feedIdForThreadsAndMessages);
        }

        // Include sourceId if available
        if (sourceId) {
          formData.append("sourceId", sourceId);
        }

        // Upload to HTTP action
        const convexHttpActionsUrl = process.env.NEXT_PUBLIC_CONVEX_HTTP_ACTIONS_URL;

        if(!convexHttpActionsUrl) {
          throw new Error("Upload URL is not set");
        }

        const uploadUrl = `${convexHttpActionsUrl}/upload`;
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!result.ok) {
          const errorData = await result.json();
          throw new Error(errorData.error || "Failed to upload image");
        }

        const { uploadId, url } = await result.json();

        setImageUrl(url);

        // Track uploadId if sourceId is not yet set (for thread/message drafts)
        if (!sourceId && (source === "thread" || source === "message")) {
          setUploadIds((prev) => [...prev, uploadId]);
        }
      } catch (err) {
        const error = err as Error;
        setError(error);
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    [source, sourceId, feedIdForThreadsAndMessages, org, getToken],
  );

  return {
    imageUrl,
    previewUrl,
    isUploading,
    error,
    uploadImage,
  };
}
