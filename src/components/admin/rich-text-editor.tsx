"use client";

import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Youtube from "@tiptap/extension-youtube";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback } from "react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  onUploadImage?: (file: File) => Promise<string | null>;
  placeholder?: string;
};

export function RichTextEditor({
  value,
  onChange,
  onUploadImage,
  placeholder = "Nội dung bài…",
}: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        bulletList: { HTMLAttributes: { class: "list-disc pl-5" } },
        orderedList: { HTMLAttributes: { class: "list-decimal pl-5" } },
      }),
      Link.configure({ openOnClick: true, autolink: true }),
      Image.configure({ HTMLAttributes: { class: "max-w-full rounded-md" } }),
      Youtube.configure({ width: 640, height: 360, HTMLAttributes: { class: "aspect-video w-full" } }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "<p></p>",
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
    editorProps: {
      attributes: {
        class:
          "tiptap ProseMirror min-h-[220px] max-w-none px-3 py-2 focus:outline-none",
      },
    },
  });

  /* Nội dung ban đầu từ `content` khi mount; remount bằng `key` từ trang cha khi đổi bài. */

  const onPickImage = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      e.target.value = "";
      if (!f || !editor || !onUploadImage) return;
      void (async () => {
        const url = await onUploadImage(f);
        if (url) {
          editor.chain().focus().setImage({ src: url }).run();
        }
      })();
    },
    [editor, onUploadImage],
  );

  if (!editor) {
    return (
      <div className="min-h-[220px] rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
        Đang tải trình soạn thảo…
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1 rounded-t-md border border-b-0 border-zinc-200 bg-zinc-100 px-2 py-1.5 dark:border-zinc-800 dark:bg-zinc-900">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`rounded px-2 py-1 text-sm ${editor.isActive("bold") ? "bg-zinc-200 dark:bg-zinc-800" : ""}`}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`rounded px-2 py-1 text-sm ${editor.isActive("italic") ? "bg-zinc-200 dark:bg-zinc-800" : ""}`}
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`rounded px-2 py-1 text-sm ${editor.isActive("heading", { level: 2 }) ? "bg-zinc-200 dark:bg-zinc-800" : ""}`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`rounded px-2 py-1 text-sm ${editor.isActive("bulletList") ? "bg-zinc-200 dark:bg-zinc-800" : ""}`}
        >
          •
        </button>
        <span className="w-2" />
        {onUploadImage ? (
          <label className="cursor-pointer rounded px-2 py-1 text-sm hover:bg-zinc-200 dark:hover:bg-zinc-800">
            Ảnh
            <input type="file" accept="image/*" className="hidden" onChange={onPickImage} />
          </label>
        ) : null}
        <input
          type="url"
          className="max-w-xs rounded border border-zinc-200 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-950"
          placeholder="Dán YouTube (URL)…"
          onKeyDown={(ev) => {
            if (ev.key !== "Enter") return;
            ev.preventDefault();
            const input = ev.currentTarget;
            const url = input.value.trim();
            if (!url) return;
            editor.chain().focus().setYoutubeVideo({ src: url }).run();
            input.value = "";
          }}
        />
      </div>
      <div className="overflow-hidden rounded-b-md border border-zinc-200 dark:border-zinc-800">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
