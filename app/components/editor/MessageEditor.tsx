"use client";

import { useRef, useEffect } from "react";
import { Id } from "@/convex/_generated/dataModel";
import Editor, { EditorHandle } from "./Editor";
import EditorToolbar from "./EditorToolbar";
import { EditorCommandsProvider } from "../../context/EditorCommands";
import styles from "./MessageEditor.module.css";
import { useOnPublish } from "@/app/hooks/useOnPublish";

export default function MessageEditor({ threadId }: { threadId: Id<"threads"> }) {
  const editorRef = useRef<EditorHandle | null>(null);
  const { state, error, onPublish, publishedSourceId, reset } = useOnPublish(
    "message",
    editorRef,
    threadId,
  );

  useEffect(() => {
    if (state === "published") {
      editorRef.current?.clear();
      reset();
    }
  }, [state, reset]);

  return (
    <div className={styles.messageEditor}>
      {error && <div className={styles.error}>{error}</div>}
      <EditorCommandsProvider>
        <Editor
          ref={editorRef}
          placeholder="Continue the conversation..."
          className={styles.tiptapEditor}
          onSubmit={onPublish}
          sourceId={publishedSourceId}
        />
        <EditorToolbar
          className={styles.messageEditorToolbar}
          actionButton={{
            icon: "send",
            onClick: onPublish,
            disabled: state === "publishing",
          }}
        />
      </EditorCommandsProvider>
    </div>
  );
}
