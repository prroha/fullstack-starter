"use client";

import * as React from "react";
import { Button } from "./button";
import { Input } from "./input";

export interface RichTextLinkDialogProps {
  /** Whether the dialog is visible */
  isOpen: boolean;
  /** Current link URL value */
  linkUrl: string;
  /** Called when the URL input changes */
  onLinkUrlChange: (url: string) => void;
  /** Called when the user confirms the link insertion */
  onInsert: () => void;
  /** Called when the user cancels or closes the dialog */
  onClose: () => void;
}

/**
 * Link insertion dialog for the rich text editor.
 * Provides a URL input with insert/cancel actions and keyboard support.
 */
const RichTextLinkDialog: React.FC<RichTextLinkDialogProps> = ({
  isOpen,
  linkUrl,
  onLinkUrlChange,
  onInsert,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="link-dialog-title"
    >
      <div
        className="bg-background rounded-lg shadow-lg p-4 w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="link-dialog-title"
          className="text-lg font-semibold mb-3"
        >
          Insert Link
        </h2>
        <Input
          type="url"
          value={linkUrl}
          onChange={(e) => onLinkUrlChange(e.target.value)}
          placeholder="https://example.com"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onInsert();
            }
            if (e.key === "Escape") {
              onClose();
            }
          }}
          autoFocus
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            type="button"
            onClick={onInsert}
            disabled={!linkUrl}
          >
            Insert
          </Button>
        </div>
      </div>
    </div>
  );
};
RichTextLinkDialog.displayName = "RichTextLinkDialog";

export { RichTextLinkDialog };
