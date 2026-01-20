"use client";

import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Input, InputHandle } from "../ui/Input";
import { Select, SelectHandle, SelectOption } from "../ui/Select";
import Button from "../ui/Button";
import Form from "../ui/Form";
import Hint from "../ui/Hint";
import { useOrganization } from "@/app/context/OrganizationProvider";
import styles from "./FeedSettingsTab.module.css";

interface FeedSettingsTabProps {
  feedId: Id<"feeds">;
}

export interface FeedSettingsTabHandle {
  hasUnsavedChanges: () => boolean;
}

interface FormData {
  name: string;
  description: string;
  privacy: "public" | "private" | "open";
  canPost: "yes" | "no";
  canMessage: "yes" | "no";
}

const FeedSettingsTab = forwardRef<FeedSettingsTabHandle, FeedSettingsTabProps>(
  ({ feedId }, ref) => {
    const org = useOrganization();
    const orgId = org?._id as Id<"organizations">;

    // Fetch feed data
    const feed = useQuery(api.feeds.getFeed, { orgId, feedId });
    const updateFeed = useMutation(api.feeds.updateFeed);

    // Form state
    const [formData, setFormData] = useState<FormData>({
      name: "",
      description: "",
      privacy: "private",
      canPost: "no",
      canMessage: "no",
    });

    // Track initial data to detect changes
    const [initialData, setInitialData] = useState<FormData | null>(null);

    // Save button states
    const [isSaving, setIsSaving] = useState(false);
    const [showSaved, setShowSaved] = useState(false);

    // Error state
    const [error, setError] = useState<string | null>(null);

    // Refs for validation
    const nameRef = useRef<InputHandle>(null);
    const descriptionRef = useRef<InputHandle>(null);
    const privacyRef = useRef<SelectHandle>(null);

    // Load feed data into form
    useEffect(() => {
      if (!feed) return;

      const canPost = feed.memberPermissions?.includes("post") ? "yes" : "no";
      const canMessage = feed.memberPermissions?.includes("message")
        ? "yes"
        : "no";

      const data: FormData = {
        name: feed.name,
        description: feed.description || "",
        privacy: feed.privacy,
        canPost,
        canMessage,
      };

      setFormData(data);
      setInitialData(data);
    }, [feed]);

    // Handle privacy change - reset permissions to "no" when changing to "public"
    const handlePrivacyChange = (value: string) => {
      const newPrivacy = value as "public" | "private" | "open";
      setFormData((prev) => ({
        ...prev,
        privacy: newPrivacy,
        canPost: newPrivacy === "public" ? "no" : prev.canPost,
        canMessage: newPrivacy === "public" ? "no" : prev.canMessage,
      }));
    };

    // Check if form has unsaved changes
    const hasUnsavedChanges = () => {
      if (!initialData) return false;
      return JSON.stringify(formData) !== JSON.stringify(initialData);
    };

    // Expose hasUnsavedChanges to parent via ref
    useImperativeHandle(
      ref,
      () => ({
        hasUnsavedChanges,
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [formData, initialData]
    );

    // Handle form submission
    const handleSave = async () => {
      setError(null);
      setIsSaving(true);

      try {
        // Build memberPermissions array
        const memberPermissions: ("post" | "message")[] = [];
        if (formData.canPost === "yes") memberPermissions.push("post");
        if (formData.canMessage === "yes") memberPermissions.push("message");

        await updateFeed({
          orgId,
          feedId,
          name: formData.name,
          description: formData.description || undefined,
          privacy: formData.privacy,
          memberPermissions:
            memberPermissions.length > 0 ? memberPermissions : undefined,
        });

        // Update initial data to reflect saved state
        setInitialData(formData);

        // Show "Saved!" for 2 seconds
        setShowSaved(true);
        setTimeout(() => {
          setShowSaved(false);
        }, 2000);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to save feed settings"
        );
      } finally {
        setIsSaving(false);
      }
    };

    // Privacy options
    const privacyOptions: SelectOption[] = [
      {
        value: "public",
        label: "Public - anyone can view, even if they're logged out",
      },
      {
        value: "open",
        label: "Open - logged in users can choose to join and view",
      },
      { value: "private", label: "Private - only invited users can view" },
    ];

    // Permission options
    const yesNoOptions: SelectOption[] = [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ];

    // Loading state
    if (feed === undefined) {
      return <div className={styles.loading}>Loading...</div>;
    }

    // Error loading feed
    if (feed === null) {
      return (
        <div className={styles.error}>
          <p>Feed not found or you do not have access to this feed.</p>
        </div>
      );
    }

    return (
      <div className={styles.container}>
        {error && (
          <Hint type="error" className={styles.errorBanner}>
            {error}
          </Hint>
        )}

        <Form
          fields={[nameRef, descriptionRef, privacyRef]}
          onSubmit={handleSave}
          className={styles.form}
          renderSubmit={({ hasErrors }) => (
            <div className={styles.actions}>
              <Button
                type="submit"
                variant="primary"
                disabled={hasErrors || isSaving || showSaved}
              >
                {showSaved ? "Saved!" : isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        >
          <Input
            ref={nameRef}
            label="Name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            validationConfig={{
              required: true,
              minLength: 4,
              maxLength: 25,
            }}
            fieldName="Name"
          />

          <Input
            ref={descriptionRef}
            label="Description"
            placeholder="Enter a brief description of what this feed is for."
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            validationConfig={{
              maxLength: 100,
            }}
            fieldName="Description"
          />

          <Select
            ref={privacyRef}
            label="Privacy"
            options={privacyOptions}
            value={formData.privacy}
            onChange={handlePrivacyChange}
            validationConfig={{ required: true }}
            fieldName="Privacy"
          />

          <Select
            label="Can members post?"
            options={yesNoOptions}
            value={formData.canPost}
            onChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                canPost: value as "yes" | "no",
              }))
            }
            helperText="Whether members of this feed can publish posts in it. Feed owners can post regardless."
          />

          <Select
            label="Can members message?"
            options={yesNoOptions}
            value={formData.canMessage}
            onChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                canMessage: value as "yes" | "no",
              }))
            }
            helperText="Whether members of this feed can send messages in posts. Feed owners can message regardless."
          />
        </Form>
      </div>
    );
  }
);

FeedSettingsTab.displayName = "FeedSettingsTab";

export default FeedSettingsTab;
