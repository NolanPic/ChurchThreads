"use client";

import userContentStyles from "@/app/shared/styles/user-content.module.css";
import classNames from "classnames";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import type { EditorView } from "prosemirror-view";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import type { JSONContent } from "@tiptap/core";
import { Image } from "@tiptap/extension-image";
import { useRegisterEditorCommands } from "../../context/EditorCommands";
import { Focus } from "@tiptap/extensions";
import Youtube from "@tiptap/extension-youtube";
import { useEditorImageUpload } from "./hooks/useEditorImageUpload";
import { Id } from "@/convex/_generated/dataModel";
import Hint from "@/app/components/ui/Hint";

export interface EditorHandle {
  getJSON: () => JSONContent | null;
  focus: () => void;
  clear: () => void;
}

interface EditorProps {
  placeholder: string;
  autofocus?: boolean;
  onSubmit?: () => void;
  className?: string;
  sourceId?: Id<"threads"> | Id<"messages">; // the id of the source of the content once it's saved
}

const Editor = forwardRef<EditorHandle, EditorProps>(function Editor(
  { placeholder, autofocus = false, onSubmit, className, sourceId },
  ref
) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleDropRef = useRef<
    ((view: EditorView, event: DragEvent) => boolean) | null
  >(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        code: false,
        codeBlock: false,
        heading: false,
        horizontalRule: false,
        strike: false,
        underline: false,
        link: {
          protocols: ["https", "http", "mailto"],
          defaultProtocol: "https",
          shouldAutoLink: (url) =>
            url.startsWith("https://") || url.startsWith("mailto:"),
          HTMLAttributes: {
            target: "_blank",
            rel: "noopener noreferrer",
          },
        },
      }),
      Placeholder.configure({ placeholder }),
      Image,
      Focus,
      Youtube.configure({
        controls: true,
        nocookie: true,
      }),
    ],
    autofocus,
    immediatelyRender: false,
    editorProps: {
      handleDrop: (view, event) => {
        if (handleDropRef.current) {
          return handleDropRef.current(view, event);
        }
        return false;
      },
    },
  });

  const {
    handleChooseFile,
    handleDrop,
    error: imageUploadError,
  } = useEditorImageUpload(editor, sourceId);

  // Store handleDrop in ref so it can be accessed in editorProps
  handleDropRef.current = handleDrop;

  const registerCommands = useRegisterEditorCommands();

  useImperativeHandle(
    ref,
    () => ({
      getJSON: () => editor?.getJSON() ?? null,
      focus: () => editor?.commands.focus(),
      clear: () => editor?.commands.clearContent(true),
    }),
    [editor]
  );

  const handleChooseFileInput = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await handleChooseFile(file);

    // Reset file input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (!editor) {
      registerCommands(null);
      return;
    }

    registerCommands({
      focus: () => {
        editor.chain().focus().run();
      },
      addImageDrop: () => {
        fileInputRef.current?.click();
      },
    });

    return () => {
      registerCommands(null);
    };
  }, [editor, registerCommands]);

  return (
    <>
      {imageUploadError && <Hint type="error">{imageUploadError.message}</Hint>}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleChooseFileInput}
        style={{ display: "none" }}
        aria-label="Upload image"
      />
      <EditorContent
        editor={editor}
        className={classNames(className, userContentStyles.userContent)}
        onKeyDown={(e) => {
          if (!onSubmit) return;
          const isSubmit = e.key === "Enter" && (e.metaKey || e.ctrlKey);
          if (isSubmit) {
            e.preventDefault();
            onSubmit();
          }
        }}
      />
    </>
  );
});

export default Editor;
