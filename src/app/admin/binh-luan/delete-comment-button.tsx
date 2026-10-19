"use client";

import { deleteAdminCommentFormAction } from "@/actions/admin-comments";

type Props = { commentId: string; replyCount: number };

export function DeleteCommentButton({ commentId, replyCount }: Props) {
  return (
    <form
      action={deleteAdminCommentFormAction}
      onSubmit={(e) => {
        const msg =
          replyCount > 0
            ? `Xoá bình luận này sẽ xoá kèm ${replyCount} trả lời. Tiếp tục?`
            : "Xoá bình luận này?";
        if (!window.confirm(msg)) e.preventDefault();
      }}
    >
      <input type="hidden" name="commentId" value={commentId} />
      <button type="submit" className="text-sm text-red-600 hover:underline dark:text-red-400">
        Xóa
      </button>
    </form>
  );
}
