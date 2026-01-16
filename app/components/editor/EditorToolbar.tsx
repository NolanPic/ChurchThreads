"use client";

// TODO: ThreadEditorToolbar should be removed
import styles from "./ThreadEditorToolbar.module.css";
import Button from "../common/Button";
import classNames from "classnames";
import { useEditorCommands } from "@/app/context/EditorCommands";

interface EditorToolbarProps {
  actionButton: {
    label?: string;
    ariaLabel?: string;
    icon?: string;
    onClick?: () => void;
    disabled?: boolean;
  };
  className?: string;
}

export default function EditorToolbar({
  actionButton,
  className,
}: EditorToolbarProps) {
  const { addImageDrop } = useEditorCommands();

  return (
    <div className={classNames(styles.threadEditorToolbar, className)}>
      <Button
        icon="image"
        onClick={addImageDrop}
        iconSize={20}
        ariaLabel="Add image"
        noBackground
      />
      <Button
        icon={actionButton.icon}
        ariaLabel={actionButton.ariaLabel}
        onClick={actionButton.onClick}
        disabled={actionButton.disabled}
        variant="primary"
      >
        {actionButton.label}
      </Button>
    </div>
  );
}
