import {
  EditorCommandsProvider,
  useEditorCommands,
} from "@/app/context/EditorCommands";
import IconButton from "../../../ui/IconButton";
import Modal from "../../../ui/Modal";
import Editor, { EditorHandle } from "../../../editor/Editor";
import styles from "./ThreadEditorPhone.module.css";
import { useOnPublish } from "../../../content/hooks/useOnPublish";
import { Id } from "@/convex/_generated/dataModel";
import { useRef, useEffect } from "react";

interface ThreadEditorPhoneProps {
  isOpen: boolean;
  onClose: () => void;
  feedId: Id<"feeds"> | null;
}

function PhoneEditorModal({ isOpen, onClose, feedId }: ThreadEditorPhoneProps) {
  const { addImageDrop } = useEditorCommands();
  const editorRef = useRef<EditorHandle | null>(null);
  const { state, error, onPublish, publishedSourceId, reset } = useOnPublish(
    "thread",
    editorRef,
    feedId,
  );

  useEffect(() => {
    if (state === "published") {
      onClose();
      editorRef.current?.clear();
      reset();
    }
  }, [state, onClose, reset]);

  return (
    <Modal
      title="New thread"
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel="Write a new thread"
      toolbar={({ onClose }) => (
        <div className={styles.threadEditorPhoneToolbar}>
          <IconButton icon="close" onClick={onClose} />
          <IconButton icon="image" onClick={addImageDrop} />
          <IconButton
            icon="send"
            onClick={onPublish}
            variant="primary"
            disabled={state === "publishing"}
          />
        </div>
      )}
    >
      {error && <div className={styles.error}>{error}</div>}
      <Editor
        ref={editorRef}
        placeholder="What's happening?"
        className={styles.editor}
        autofocus
        sourceId={publishedSourceId}
      />
    </Modal>
  );
}

export default function ThreadEditorPhone({
  isOpen,
  onClose,
  feedId,
}: ThreadEditorPhoneProps) {
  return (
    <EditorCommandsProvider>
      <PhoneEditorModal isOpen={isOpen} onClose={onClose} feedId={feedId} />
    </EditorCommandsProvider>
  );
}
