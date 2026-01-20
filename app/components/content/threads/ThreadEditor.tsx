"use client";

import Backdrop from "../../ui/Backdrop";
import styles from "./ThreadEditor.module.css";
import { useRef, useEffect } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { motion } from "framer-motion";
import Editor, { EditorHandle } from "../../editor/Editor";
import EditorToolbar from "../../editor/EditorToolbar";
import { EditorCommandsProvider } from "@/app/context/EditorCommands";
import { useOnPublish } from "../hooks/useOnPublish";

interface ThreadEditorProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  feedId: Id<"feeds"> | null;
}

export default function ThreadEditor({
  isOpen,
  setIsOpen,
  feedId,
}: ThreadEditorProps) {
  const editorRef = useRef<EditorHandle | null>(null);
  const { state, error, onPublish, publishedSourceId, reset } = useOnPublish(
    "thread",
    editorRef,
    feedId,
  );

  useEffect(() => {
    if (state === "published") {
      setIsOpen(false);
      editorRef.current?.clear();
      reset();
    }
  }, [state, setIsOpen, reset]);

  const editorInitial = {
    minHeight: 0,
    width: 0,
    opacity: 0,
  };
  const editorOpen = {
    minHeight: "var(--editor-open-min-height)",
    width: "var(--editor-open-width)",
    opacity: 1,
  };

  return (
    <>
      <motion.div
        className={styles.threadEditor}
        style={isOpen ? { zIndex: 2 } : {}}
        initial={editorInitial}
        animate={editorOpen}
        exit={editorInitial}
        transition={{
          borderTopRightRadius: { duration: 0.1 },
          duration: 0.5,
          type: "spring",
          stiffness: 350,
          damping: 35,
        }}
      >
        {error && <div className={styles.error}>{error}</div>}
        <EditorCommandsProvider>
          <Editor
            ref={editorRef}
            placeholder="What's happening?"
            autofocus
            className="tiptap-editor"
            sourceId={publishedSourceId}
          />
          <EditorToolbar
            actionButton={{
              label: "Post",
              icon: "send",
              onClick: onPublish,
              disabled: state === "publishing",
            }}
          />
        </EditorCommandsProvider>
      </motion.div>
      <Backdrop onClick={() => setIsOpen(false)} />
    </>
  );
}
