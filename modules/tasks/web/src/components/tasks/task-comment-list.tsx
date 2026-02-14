"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { Alert } from "@/components/feedback/alert";
import { formatRelativeTime } from "@/lib/tasks/formatters";
import type { TaskComment } from "@/lib/tasks/types";

interface TaskCommentListProps {
  comments: TaskComment[];
  onAdd: (content: string) => Promise<void>;
  onUpdate: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function TaskCommentList({ comments, onAdd, onUpdate, onDelete }: TaskCommentListProps) {
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newComment.trim()) return;
    setIsAdding(true);
    setError(null);
    try {
      await onAdd(newComment.trim());
      setNewComment("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add comment");
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editContent.trim()) return;
    setError(null);
    try {
      await onUpdate(id, editContent.trim());
      setEditingId(null);
      setEditContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update comment");
    }
  };

  const startEditing = (comment: TaskComment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Comment thread */}
      {comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              {editingId === comment.id ? (
                <div className="space-y-3">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                  />
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => handleUpdate(comment.id)}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {comment.content}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditing(comment)}
                      >
                        Edit
                      </Button>
                      <ConfirmButton
                        confirmMode="dialog"
                        confirmTitle="Delete Comment"
                        confirmMessage="Are you sure you want to delete this comment?"
                        confirmLabel="Delete"
                        onConfirm={() => onDelete(comment.id)}
                        variant="ghost"
                        size="sm"
                      >
                        Delete
                      </ConfirmButton>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No comments yet
        </p>
      )}

      {/* Add comment */}
      <div className="space-y-3">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
        />
        <Button
          size="sm"
          onClick={handleAdd}
          isLoading={isAdding}
          disabled={!newComment.trim()}
        >
          Add Comment
        </Button>
      </div>
    </div>
  );
}
