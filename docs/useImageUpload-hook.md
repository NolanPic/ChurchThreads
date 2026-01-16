# useImageUpload Hook

A reusable React hook for uploading images to Convex storage with preview support, validation, and automatic source tracking.

## Overview

The `useImageUpload` hook provides core image upload functionality that can be used anywhere in the app (avatars, profile images, editor images, etc.). It handles file validation, preview generation, upload to Convex storage, and automatic tracking of upload metadata.

**Location**: `app/components/editor/hooks/useImageUpload.ts`

## Features

- **Immediate Preview**: Generates data URL for instant visual feedback while upload is in progress
- **File Validation**: Validates file type, size, and format based on upload source
- **Error Handling**: Comprehensive error states with detailed error messages
- **Upload Tracking**: Automatically tracks uploads in the `uploads` table with source metadata
- **Deferred Source IDs**: Supports uploading before source entity (thread/message) is created, with automatic patching once available
- **Authentication**: Integrates with Clerk for secure uploads

## API Reference

### Hook Signature

```typescript
function useImageUpload(options: UseImageUploadOptions): UseImageUploadReturn;
```

### Options

```typescript
interface UseImageUploadOptions {
  /**
   * The type of upload (thread, message, or avatar)
   */
  source: "thread" | "message" | "avatar";

  /**
   * The source ID (thread ID, message ID, or user ID)
   * Can be null while drafting, then updated once published
   */
  sourceId?: Id<"threads"> | Id<"messages"> | Id<"users"> | null;
}
```

**Parameters:**

- `source` (required): Determines what type of image upload this is
  - `"thread"`: Image uploaded to a thread
  - `"message"`: Image uploaded to a message
  - `"avatar"`: User avatar (GIFs not allowed, replaces previous avatar)
- `sourceId` (optional): The ID of the entity the image belongs to
  - Can be `null` during drafting (e.g., composing a thread before saving)
  - Hook will automatically patch uploads with sourceId when it becomes available

### Return Value

```typescript
interface UseImageUploadReturn {
  /**
   * Final Convex storage URL (null until upload completes)
   */
  imageUrl: string | null;

  /**
   * Data URL for immediate preview (null until file selected)
   */
  previewUrl: string | null;

  /**
   * Upload in progress state
   */
  isUploading: boolean;

  /**
   * Error state (null if no error)
   */
  error: Error | null;

  /**
   * Upload an image file
   * @param file - The image file to upload
   */
  uploadImage: (file: File) => Promise<void>;
}
```

**Properties:**

- `imageUrl`: The final Convex storage URL, available after upload completes
- `previewUrl`: A data URL for immediate preview, available as soon as file is selected
- `isUploading`: Boolean indicating whether an upload is in progress
- `error`: Error object if upload fails, `null` otherwise
- `uploadImage`: Async function to trigger the upload

## Internal State Management

The hook manages several internal states:

1. **imageUrl**: Final Convex storage URL after successful upload
2. **previewUrl**: Data URL for immediate preview while uploading
3. **isUploading**: Upload progress indicator
4. **error**: Error state for failed uploads
5. **uploadIds**: Tracked upload IDs when sourceId is deferred (for threads/messages)

### Deferred Source ID Handling

When uploading images for threads or messages that haven't been created yet:

1. Images are uploaded with `sourceId: null`
2. Upload IDs are tracked in internal state
3. When `sourceId` becomes available (e.g., after thread is published), the hook automatically patches the upload records via `patchUploadSourceIds` mutation
4. This ensures upload metadata is correctly linked even for draft content

## Usage Examples

### Basic Avatar Upload

```tsx
import { useImageUpload } from "@/app/components/editor/hooks/useImageUpload";
import { useState } from "react";

function AvatarUploader() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);

  const { imageUrl, previewUrl, isUploading, error, uploadImage } =
    useImageUpload({
      source: "avatar",
      sourceId: userId,
    });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await uploadImage(file);
      console.log("Avatar uploaded successfully!");
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        onChange={handleFileChange}
        disabled={isUploading}
      />

      {isUploading && <p>Uploading...</p>}
      {error && <p style={{ color: "red" }}>{error.message}</p>}

      {/* Show preview while uploading, then final image */}
      {(previewUrl || imageUrl) && (
        <img
          src={imageUrl || previewUrl || ""}
          alt="Avatar"
          style={{ width: 100, height: 100, objectFit: "cover" }}
        />
      )}
    </div>
  );
}
```

### Thread Upload with Deferred Source ID

```tsx
import { useImageUpload } from "@/app/components/editor/hooks/useImageUpload";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

function ThreadComposer() {
  const [threadId, setThreadId] = useState<Id<"threads"> | null>(null);
  const createThread = useMutation(api.threads.create);

  // Start with null sourceId - will be patched after thread is created
  const { imageUrl, previewUrl, isUploading, error, uploadImage } =
    useImageUpload({
      source: "thread",
      sourceId: threadId,
    });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await uploadImage(file);
  };

  const handlePublish = async () => {
    // Create thread
    const newThreadId = await createThread({
      content: `<img src="${imageUrl}" />`,
      // ... other thread data
    });

    // Setting threadId triggers automatic patching of upload sourceIds
    setThreadId(newThreadId);
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={isUploading}
      />

      {isUploading && <p>Uploading...</p>}
      {error && <p style={{ color: "red" }}>{error.message}</p>}

      {/* Show preview immediately, replace with final URL when ready */}
      {(previewUrl || imageUrl) && (
        <img src={imageUrl || previewUrl || ""} alt="Thread image" />
      )}

      <button onClick={handlePublish} disabled={!imageUrl}>
        Publish Thread
      </button>
    </div>
  );
}
```

### Complete Example: HTML Input to Display

This example shows the complete flow from file input to displaying the uploaded image:

```tsx
import { useImageUpload } from "@/app/components/editor/hooks/useImageUpload";
import { useState } from "react";

function ImageUploadExample() {
  const { imageUrl, previewUrl, isUploading, error, uploadImage } =
    useImageUpload({
      source: "thread",
      sourceId: null, // No thread created yet
    });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await uploadImage(file);
    } catch (err) {
      // Error is already set in hook state
      console.error("Upload failed:", err);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Image Upload Demo</h2>

      {/* File Input */}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
        onChange={handleFileChange}
        disabled={isUploading}
        style={{ marginBottom: 10 }}
      />

      {/* Upload Status */}
      {isUploading && (
        <div style={{ color: "blue", marginBottom: 10 }}>Uploading...</div>
      )}

      {/* Error Display */}
      {error && (
        <div style={{ color: "red", marginBottom: 10 }}>
          Error: {error.message}
        </div>
      )}

      {/* Image Preview/Display */}
      {(previewUrl || imageUrl) && (
        <div style={{ marginTop: 20 }}>
          <h3>{imageUrl ? "Uploaded Image" : "Preview"}</h3>
          <img
            src={imageUrl || previewUrl || ""}
            alt="Upload"
            style={{
              maxWidth: 400,
              maxHeight: 400,
              border: "1px solid #ddd",
              borderRadius: 4,
            }}
          />
          {imageUrl && (
            <p style={{ fontSize: 12, color: "green", marginTop: 10 }}>
              ✓ Upload complete!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
```

## File Validation

The hook validates files using the `validateFile` function from `@/validation`:

### Validation Rules by Source

**All Sources:**

- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/heic`, `image/heif`
- Maximum file size: 10MB

**Avatar Specific:**

- GIF files are **not allowed** for avatars
- Previous avatars are automatically replaced

### Validation Errors

Common validation errors include:

- "File validation failed: Invalid file type"
- "File validation failed: File size exceeds 10MB"
- "File validation failed: GIF files not allowed for avatars"

## Error Handling

The hook provides comprehensive error handling:

```tsx
const { error, uploadImage } = useImageUpload({
  source: "thread",
  sourceId: null,
});

// Option 1: Check error state
useEffect(() => {
  if (error) {
    console.error("Upload error:", error.message);
    // Show error to user
  }
}, [error]);

// Option 2: Catch upload promise rejection
const handleUpload = async (file: File) => {
  try {
    await uploadImage(file);
  } catch (err) {
    // Error is also available in error state
    console.error("Upload failed:", err);
  }
};
```

### Common Errors

- `"No organization found. Please ensure you're logged in."`
- `"File validation failed: [validation errors]"`
- `"Failed to get authentication token"`
- `"Feed ID is required for thread/message uploads"`
- `"Upload URL is not set"`
- `"Failed to upload image"` (HTTP error from server)

## Integration with Context

The hook integrates with several context providers:

### Required Context

- **OrganizationProvider**: Provides `orgId` for upload metadata
- **CurrentFeedAndThreadContext**: Provides `feedId` for thread/message uploads
- **Clerk Auth**: Provides authentication token

### Context Usage

```typescript
const org = useOrganization(); // from OrganizationProvider
const { feedId, feedIdOfCurrentThread } = useContext(
  CurrentFeedAndThreadContext
);
const { getToken } = useAuth(); // from Clerk
```

**Important**: The hook requires these contexts to be available in the component tree. Ensure your component is wrapped with the necessary providers.

## Upload Flow

1. **File Selection**: User selects file via input or drag-drop
2. **Validation**: File is validated against source-specific rules
3. **Preview Generation**: Data URL created for immediate preview (sets `previewUrl`)
4. **Authentication**: Clerk token obtained
5. **FormData Preparation**: File and metadata packaged
6. **HTTP Upload**: POST to `/upload` endpoint with auth header
7. **Upload Record**: Server creates record in `uploads` table
8. **URL Return**: Final Convex storage URL returned (sets `imageUrl`)
9. **Source ID Patching** (if deferred): When `sourceId` becomes available, upload records are automatically patched

## Related Hooks

### useEditorImageUpload

A specialized wrapper around `useImageUpload` for TipTap editor integration:

```typescript
import { useEditorImageUpload } from "@/app/components/editor/hooks/useEditorImageUpload";

const { handleChooseFile, handleDrop, error, isUploading } =
  useEditorImageUpload(editor, threadId);
```

**Features:**

- Automatic placeholder insertion with preview URL
- Automatic replacement with final URL when upload completes
- Drag-and-drop support
- Editor position tracking

## Best Practices

1. **Always handle errors**: Check the `error` state or catch promise rejections
2. **Disable input during upload**: Set `disabled={isUploading}` on file inputs
3. **Show upload progress**: Display loading state using `isUploading`
4. **Use preview for UX**: Show `previewUrl` immediately for better user experience
5. **Update sourceId for drafts**: When creating threads/messages, update `sourceId` after entity is created
6. **Validate file types**: Use appropriate `accept` attribute on file inputs
7. **Handle auth failures**: Ensure user is logged in before allowing uploads

## Environment Variables

The hook requires this environment variable:

```bash
NEXT_PUBLIC_CONVEX_HTTP_ACTIONS_URL=https://your-convex-deployment.convex.cloud
```

This is used to construct the upload endpoint: `${NEXT_PUBLIC_CONVEX_HTTP_ACTIONS_URL}/upload`

## TypeScript Types

```typescript
import { Id } from "@/convex/_generated/dataModel";

type UploadType = "thread" | "message" | "avatar";

interface UseImageUploadOptions {
  source: UploadType;
  sourceId?: Id<"threads"> | Id<"messages"> | Id<"users"> | null;
}

interface UseImageUploadReturn {
  imageUrl: string | null;
  previewUrl: string | null;
  isUploading: boolean;
  error: Error | null;
  uploadImage: (file: File) => Promise<void>;
}
```

## Testing Considerations

When testing components that use `useImageUpload`:

1. Mock the Convex mutations (`useMutation` for `patchUploadSourceIds`)
2. Mock Clerk's `useAuth` hook to provide test tokens
3. Mock the OrganizationProvider context
4. Mock the CurrentFeedAndThreadContext
5. Mock fetch for the upload endpoint
6. Test error states by rejecting promises
7. Test the deferred sourceId patching flow

## See Also

- [Upload Table Specification](./specs/2025-10-22-uploads-table.md)
- [Image Upload Simplification Spec](../agent-os/specs/2025-10-16-frontend-image-upload-simplification/spec.md)
- `useEditorImageUpload` hook for editor-specific functionality
- `validateFile` function in `/validation` module
