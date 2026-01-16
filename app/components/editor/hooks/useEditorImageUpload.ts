"use client";

import { useCallback, useEffect, useRef, useContext } from "react";
import type { Editor } from "@tiptap/react";
import type { EditorView } from "prosemirror-view";
import { Selection } from "prosemirror-state";
import { useImageUpload } from "./useImageUpload";
import { CurrentFeedAndThreadContext } from "../../../context/CurrentFeedAndThreadProvider";
import { Id } from "@/convex/_generated/dataModel";

export interface UseEditorImageUploadReturn {
  /**
   * Handler for file selection from file input
   * @param file - The selected file
   */
  handleChooseFile: (file: File) => Promise<void>;
  /**
   * Handler for drag-and-drop events in the editor
   */
  handleDrop: (view: EditorView, event: DragEvent) => boolean;
  /**
   * Captured error state (inherited from useImageUpload or editor-specific errors)
   */
  error: Error | null;
  /**
   * Upload in progress state
   */
  isUploading: boolean;
}

/**
 * Editor-specific hook for uploading images and inserting them into a TipTap editor.
 *
 * This hook wraps the core useImageUpload hook and adds editor-specific logic
 * for inserting placeholder images and replacing them with final URLs.
 *
 * @param editor - TipTap editor instance
 * @param sourceId - Optional source ID (thread ID or message ID) from parent component
 * @returns Object with uploadImage function and error state
 *
 * @example
 * ```tsx
 * const [publishedThreadId, setPublishedThreadId] = useState(null);
 * const { uploadImage, error } = useEditorImageUpload(editor, publishedThreadId);
 *
 * const handlePublish = async () => {
 *   const threadId = await createThread();
 *   setPublishedThreadId(threadId); // Triggers patchUploadSourceIds
 * };
 * ```
 */
export function useEditorImageUpload(
  editor: Editor | null,
  sourceId?: Id<"threads"> | Id<"messages"> | null,
): UseEditorImageUploadReturn {
  const { threadId } = useContext(CurrentFeedAndThreadContext);

  // Determine source based on context
  // If threadId exists, we're messaging in a thread, otherwise we're creating a thread
  const source = threadId ? "message" : "thread";

  const {
    previewUrl,
    imageUrl,
    uploadImage: baseUploadImage,
    error: uploadError,
    isUploading,
  } = useImageUpload({ source, sourceId });

  const currentUploadDataUrl = useRef<string | null>(null);
  const error = uploadError;

  // Insert placeholder image when preview URL is available
  useEffect(() => {
    if (!editor || !previewUrl) return;

    const { state } = editor;
    const insertPos = state.selection.from;

    // Insert placeholder image with data URL
    const imageType = state.schema.nodes.image;
    if (!imageType) {
      console.error("Image node type not found in editor schema");
      return;
    }

    const placeholderNode = imageType.create({
      src: previewUrl,
    });

    const tr = state.tr.insert(insertPos, placeholderNode);
    editor.view.dispatch(tr);

    // Store this data URL so we can find it later
    currentUploadDataUrl.current = previewUrl;
  }, [editor, previewUrl]);

  // Replace placeholder with final image when upload completes
  useEffect(() => {
    if (!editor || !imageUrl || !currentUploadDataUrl.current) return;

    const dataUrl = currentUploadDataUrl.current;
    const currentState = editor.state;
    let targetPos: number | null = null;
    let targetNodeSize: number | null = null;

    currentState.doc.descendants((node, pos) => {
      if (node.type.name === "image" && node.attrs.src === dataUrl) {
        targetPos = pos;
        targetNodeSize = node.nodeSize;
        return false; // Stop searching
      }
      return true; // Continue searching
    });

    const imageType = currentState.schema.nodes.image;
    if (!imageType) {
      console.error("Image node type not found in editor schema");
      return;
    }

    if (targetPos !== null && targetNodeSize !== null) {
      const finalImageNode = imageType.create({ src: imageUrl });
      const replaceTr = currentState.tr.replaceWith(
        targetPos,
        targetPos + targetNodeSize,
        finalImageNode,
      );
      editor.view.dispatch(replaceTr);
    } else {
      // Fallback: if we can't find the placeholder, insert at the end
      const fallbackTr = currentState.tr.insert(
        currentState.doc.content.size,
        imageType.create({ src: imageUrl }),
      );
      editor.view.dispatch(fallbackTr);
    }

    // Clear the ref after replacement
    currentUploadDataUrl.current = null;
  }, [editor, imageUrl]);

  const uploadImage = useCallback(
    async (file: File) => {
      // Check if editor is available
      if (!editor) {
        throw new Error("Editor is not ready");
      }

      // Trigger the base upload
      await baseUploadImage(file);
    },
    [editor, baseUploadImage],
  );

  const handleChooseFile = useCallback(
    async (file: File) => {
      if (!editor || isUploading) return;

      try {
        await uploadImage(file);
      } catch (error) {
        console.error("Image upload failed:", error);
      }
    },
    [editor, uploadImage, isUploading],
  );

  const handleDrop = useCallback(
    (view: EditorView, event: DragEvent) => {
      // Don't start a new upload if one is in progress
      if (isUploading) return false;

      // Check if the drop contains files
      if (!event.dataTransfer?.files?.length) {
        return false;
      }

      // Check if any of the files are images
      const files = Array.from(event.dataTransfer.files);
      const imageFiles = files.filter((file) => file.type.startsWith("image/"));

      if (imageFiles.length === 0) {
        return false;
      }

      // Prevent opening image in new tab
      event.preventDefault();

      const imageFile = imageFiles[0];

      // Get the drop position from the event
      const coordinates = view.posAtCoords({
        left: event.clientX,
        top: event.clientY,
      });

      if (!coordinates) {
        return true; // Couldn't determine position, but we handled the event
      }

      // Move cursor to drop position
      const { state, dispatch } = view;
      const tr = state.tr.setSelection(
        Selection.near(state.doc.resolve(coordinates.pos)),
      );
      dispatch(tr);

      // Upload the image at the new cursor position
      uploadImage(imageFile).catch((error) => {
        console.error("Drag-drop image upload failed:", error);
      });

      return true; // We handled the drop
    },
    [uploadImage, isUploading],
  );

  return {
    handleChooseFile,
    handleDrop,
    error,
    isUploading,
  };
}
