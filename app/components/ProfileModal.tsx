import React, { useEffect, useState } from "react";
import styles from "./ProfileModal.module.css";
import Modal from "./common/Modal";
import Button from "./common/Button";
import UserAvatar from "./UserAvatar";
import { Input } from "./common/Input";
import IconButton from "./common/IconButton";
import Toggle from "./common/Toggle";
import { useUserAuth } from "@/auth/client/useUserAuth";
import { useImageUpload } from "./editor/hooks/useImageUpload";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function ProfileModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pushNotifications, setPushNotifications] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Track original values for change detection
  const [originalName, setOriginalName] = useState("");
  const [originalPushNotifications, setOriginalPushNotifications] =
    useState(false);
  const [originalEmailNotifications, setOriginalEmailNotifications] =
    useState(false);

  const [saveSuccess, setSaveSuccess] = useState(false);

  const [, { user }] = useUserAuth();
  const updateUser = useMutation(api.user.updateUser);

  const hasNameChanged = name !== originalName;
  const hasPushChanged = pushNotifications !== originalPushNotifications;
  const hasEmailChanged = emailNotifications !== originalEmailNotifications;
  const hasChanges = hasNameChanged || hasPushChanged || hasEmailChanged;
  const isNameEmpty = name.trim() === "";

  const disableSave = !hasChanges || isNameEmpty || isSaving || saveSuccess;

  // Reset save success state when user makes changes
  useEffect(() => {
    if (hasChanges && saveSuccess) {
      setSaveSuccess(false);
    }
  }, [hasChanges, saveSuccess]);

  useEffect(() => {
    if (user) {
      const userName = user.name || "";
      const notifications = user.settings?.notifications || [];
      const pushEnabled = notifications.includes("push");
      const emailEnabled = notifications.includes("email");

      setName(userName);
      setEmail(user.email || "");
      setPushNotifications(pushEnabled);
      setEmailNotifications(emailEnabled);

      // Set original values for change detection
      setOriginalName(userName);
      setOriginalPushNotifications(pushEnabled);
      setOriginalEmailNotifications(emailEnabled);
    }
  }, [user]);

  const { previewUrl, isUploading, error, uploadImage } = useImageUpload({
    source: "avatar",
    sourceId: user?._id,
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadImage(file);
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  const handleSave = async () => {
    if (!user || disableSave) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const notifications: ("push" | "email")[] = [];
      if (pushNotifications) notifications.push("push");
      if (emailNotifications) notifications.push("email");

      await updateUser({
        orgId: user.orgId,
        name: name.trim(),
        notifications,
      });

      // Save successful - show "Saved!" until user makes changes
      setIsSaving(false);
      setSaveSuccess(true);

      setOriginalName(name);
      setOriginalPushNotifications(pushNotifications);
      setOriginalEmailNotifications(emailNotifications);
    } catch (error) {
      console.error("Failed to update profile:", error);
      setIsSaving(false);
      setSaveSuccess(false);
    }
  };

  return (
    <Modal
      title="Profile"
      isOpen={isOpen}
      onClose={onClose}
      toolbar={({ onClose }) => (
        <div className={styles.toolbarActions}>
          <IconButton icon="close" onClick={onClose} />
          <IconButton
            type="button"
            icon="save"
            variant="primary"
            onClick={handleSave}
            disabled={disableSave || isSaving}
          />
        </div>
      )}
    >
      <div className={styles.profile}>
        <div className={styles.contentContainer}>
          <div className={styles.avatarContainer}>
            <label htmlFor="avatar-file-input">
              {user && (
                <UserAvatar
                  user={user}
                  size={100}
                  imageUploadPreview={previewUrl}
                />
              )}
              <input
                id="avatar-file-input"
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFileChange}
                disabled={isUploading}
                style={{ display: "none" }}
              />
              Change Photo
            </label>
            {error && <p style={{ color: "red" }}>{error.message}</p>}
          </div>
          <div className={styles.content}>
            <div className={styles.form}>
              <Input
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                type="email"
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled
              />
              <div className={styles.notificationsSection}>
                <h3>Notifications</h3>
                <div className={styles.notificationToggles}>
                  <Toggle
                    value={pushNotifications}
                    onToggle={setPushNotifications}
                    label="Receive push notifications"
                    className={styles.notificationToggle}
                  />
                  <Toggle
                    value={emailNotifications}
                    onToggle={setEmailNotifications}
                    label="Receive email notifications"
                    className={styles.notificationToggle}
                  />
                </div>
              </div>
            </div>
            <div className={styles.actionsDesktop}>
              <Button
                type="button"
                icon="send"
                variant="primary"
                onClick={handleSave}
                disabled={disableSave || isSaving}
              >
                {isSaving ? "Saving..." : saveSuccess ? "Saved!" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
