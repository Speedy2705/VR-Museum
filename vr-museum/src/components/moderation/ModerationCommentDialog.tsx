"use client";

import { useRef, useState } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export type CommentDecision = "CHANGES_REQUESTED" | "REJECTED";

type Props = {
  open: boolean;
  decision: CommentDecision;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: (comment: string) => void | Promise<void>;
};

const MAX_COMMENT_LENGTH = 2_000;

export default function ModerationCommentDialog({ open, decision, pending = false, onCancel, onConfirm }: Props) {
  const [comment, setComment] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const requestingChanges = decision === "CHANGES_REQUESTED";

  const trimmedComment = comment.trim();

  return (
    <ConfirmDialog
      open={open}
      title={requestingChanges ? "Request changes to this upload?" : "Reject this upload?"}
      description={requestingChanges
        ? "Tell the artist what needs attention. They can edit this item and resubmit it for review."
        : "Explain the decision to the artist. Rejection is final and this item cannot be resubmitted."}
      confirmLabel={requestingChanges ? "Request Changes" : "Reject Upload"}
      pending={pending}
      confirmDisabled={!trimmedComment}
      tone={requestingChanges ? "important" : "danger"}
      initialFocusRef={textareaRef}
      onCancel={onCancel}
      onConfirm={() => onConfirm(trimmedComment)}
    >
      <label className="mt-6 block text-xs tracking-label uppercase text-stone">
        Curator comment
        <textarea
          ref={textareaRef}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          maxLength={MAX_COMMENT_LENGTH}
          rows={6}
          required
          disabled={pending}
          className="mt-2 block w-full resize-y border border-line bg-transparent px-3 py-3 text-sm normal-case tracking-normal text-ink outline-none focus:border-ink disabled:opacity-60"
        />
      </label>
      <p className="mt-2 text-right text-xs text-stone" aria-live="polite">
        {comment.length}/{MAX_COMMENT_LENGTH}
      </p>
    </ConfirmDialog>
  );
}
