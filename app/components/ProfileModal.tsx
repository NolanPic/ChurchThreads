import React, { useEffect, useState } from "react";
import styles from "./ProfileModal.module.css";
import Modal from "./common/Modal";
import Button from "./common/Button";
import UserAvatar from "./UserAvatar";
import { Input } from "./common/Input";
import IconButton from "./common/IconButton";
import { useUserAuth } from "@/auth/client/useUserAuth";
import { useImageUpload } from "./editor/hooks/useImageUpload";

export default function ProfileModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const disableSave = name.trim() === "" || email.trim() === "";
  const [, { user }] = useUserAuth();

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
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

  return (
    <Modal
      title="Profile"
      isOpen={isOpen}
      onClose={onClose}
      toolbar={({ onClose }) => (
        <div className={styles.toolbarActions}>
          <IconButton icon="close" onClick={onClose} />
          <IconButton
            type="submit"
            icon="image"
            variant="primary"
            disabled={disableSave}
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
            </div>
            <div className={styles.actionsDesktop}>
              <Button
                type="submit"
                icon="send"
                variant="primary"
                disabled={disableSave}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
