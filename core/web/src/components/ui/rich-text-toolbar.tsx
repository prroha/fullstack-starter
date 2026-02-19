"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// Types
// =====================================================

export interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
}

export type FormatCommand =
  | "bold"
  | "italic"
  | "underline"
  | "strikethrough"
  | "insertUnorderedList"
  | "insertOrderedList"
  | "formatBlock"
  | "createLink"
  | "unlink"
  | "justifyLeft"
  | "justifyCenter"
  | "justifyRight"
  | "undo"
  | "redo";

export interface RichTextToolbarProps {
  /** Set of currently active format names */
  activeFormats: Set<string>;
  /** Execute a formatting command */
  onExecCommand: (command: FormatCommand) => void;
  /** Format a block element (headings, paragraphs) */
  onFormatBlock: (tag: string) => void;
  /** Insert a code block */
  onInsertCodeBlock: () => void;
  /** Open the link insertion dialog */
  onOpenLinkDialog: () => void;
  /** Remove a link */
  onRemoveLink: () => void;
  /** Whether the toolbar is disabled */
  disabled?: boolean;
  /** Whether the editor has an error */
  error?: boolean;
  /** ID of the editor element this toolbar controls */
  editorId: string;
}

// =====================================================
// Icons (inline SVGs to avoid external dependencies)
// =====================================================

const icons = {
  bold: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
      <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
    </svg>
  ),
  italic: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <line x1="19" y1="4" x2="10" y2="4" />
      <line x1="14" y1="20" x2="5" y2="20" />
      <line x1="15" y1="4" x2="9" y2="20" />
    </svg>
  ),
  underline: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M6 4v6a6 6 0 0 0 12 0V4" />
      <line x1="4" y1="20" x2="20" y2="20" />
    </svg>
  ),
  strikethrough: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M16 4H9a3 3 0 0 0-2.83 4" />
      <path d="M14 12a4 4 0 0 1 0 8H6" />
      <line x1="4" y1="12" x2="20" y2="12" />
    </svg>
  ),
  h1: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M4 12h8" />
      <path d="M4 18V6" />
      <path d="M12 18V6" />
      <path d="M17 10v8" />
      <path d="M21 10v8" />
      <path d="M17 10h4" />
    </svg>
  ),
  h2: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M4 12h8" />
      <path d="M4 18V6" />
      <path d="M12 18V6" />
      <path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1" />
    </svg>
  ),
  h3: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M4 12h8" />
      <path d="M4 18V6" />
      <path d="M12 18V6" />
      <path d="M17.5 10.5c1.7-1 3.5 0 3.5 1.5a2 2 0 0 1-2 2" />
      <path d="M17 17.5c2 1.5 4 .3 4-1.5a2 2 0 0 0-2-2" />
    </svg>
  ),
  bulletList: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  numberedList: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <line x1="10" y1="6" x2="21" y2="6" />
      <line x1="10" y1="12" x2="21" y2="12" />
      <line x1="10" y1="18" x2="21" y2="18" />
      <path d="M4 6h1v4" />
      <path d="M4 10h2" />
      <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
    </svg>
  ),
  link: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  unlink: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M18.84 12.25l1.72-1.71a5 5 0 0 0-7.07-7.07l-3 3a5 5 0 0 0 .71 7.54" />
      <path d="M5.16 11.75l-1.72 1.71a5 5 0 0 0 7.07 7.07l3-3a5 5 0 0 0-.71-7.54" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  ),
  code: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  quote: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z" />
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z" />
    </svg>
  ),
  alignLeft: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <line x1="17" y1="10" x2="3" y2="10" />
      <line x1="21" y1="6" x2="3" y2="6" />
      <line x1="21" y1="14" x2="3" y2="14" />
      <line x1="17" y1="18" x2="3" y2="18" />
    </svg>
  ),
  alignCenter: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <line x1="18" y1="10" x2="6" y2="10" />
      <line x1="21" y1="6" x2="3" y2="6" />
      <line x1="21" y1="14" x2="3" y2="14" />
      <line x1="18" y1="18" x2="6" y2="18" />
    </svg>
  ),
  alignRight: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <line x1="21" y1="10" x2="7" y2="10" />
      <line x1="21" y1="6" x2="3" y2="6" />
      <line x1="21" y1="14" x2="3" y2="14" />
      <line x1="21" y1="18" x2="7" y2="18" />
    </svg>
  ),
  undo: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
  ),
  redo: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M21 7v6h-6" />
      <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
    </svg>
  ),
  paragraph: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M13 4v16" />
      <path d="M17 4v16" />
      <path d="M19 4H9.5a4.5 4.5 0 0 0 0 9H13" />
    </svg>
  ),
};

// =====================================================
// Toolbar Button Component
// =====================================================

const ToolbarButton = React.forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  ({ icon, label, onClick, isActive = false, disabled = false }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        aria-pressed={isActive}
        className={cn(
          "inline-flex items-center justify-center w-8 h-8 rounded",
          "transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          "disabled:pointer-events-none disabled:opacity-50",
          isActive
            ? "bg-accent text-accent-foreground"
            : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
        )}
        title={label}
      >
        {icon}
      </button>
    );
  }
);
ToolbarButton.displayName = "ToolbarButton";

// =====================================================
// Toolbar Separator
// =====================================================

const ToolbarSeparator: React.FC = () => (
  <div className="w-px h-6 bg-border mx-1" aria-hidden="true" />
);

// =====================================================
// Rich Text Toolbar Component
// =====================================================

/**
 * Formatting toolbar for the rich text editor.
 * Contains buttons for text formatting, headings, lists, links, and alignment.
 */
const RichTextToolbar: React.FC<RichTextToolbarProps> = ({
  activeFormats,
  onExecCommand,
  onFormatBlock,
  onInsertCodeBlock,
  onOpenLinkDialog,
  onRemoveLink,
  disabled = false,
  error = false,
  editorId,
}) => {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-0.5 p-1.5 border border-b-0 rounded-t-md bg-muted/30",
        error && "border-destructive",
        disabled && "opacity-50 pointer-events-none"
      )}
      role="toolbar"
      aria-label="Formatting options"
      aria-controls={editorId}
    >
      {/* Undo/Redo */}
      <ToolbarButton
        icon={icons.undo}
        label="Undo (Ctrl+Z)"
        onClick={() => onExecCommand("undo")}
        disabled={disabled}
      />
      <ToolbarButton
        icon={icons.redo}
        label="Redo (Ctrl+Y)"
        onClick={() => onExecCommand("redo")}
        disabled={disabled}
      />

      <ToolbarSeparator />

      {/* Text formatting */}
      <ToolbarButton
        icon={icons.bold}
        label="Bold (Ctrl+B)"
        onClick={() => onExecCommand("bold")}
        isActive={activeFormats.has("bold")}
        disabled={disabled}
      />
      <ToolbarButton
        icon={icons.italic}
        label="Italic (Ctrl+I)"
        onClick={() => onExecCommand("italic")}
        isActive={activeFormats.has("italic")}
        disabled={disabled}
      />
      <ToolbarButton
        icon={icons.underline}
        label="Underline (Ctrl+U)"
        onClick={() => onExecCommand("underline")}
        isActive={activeFormats.has("underline")}
        disabled={disabled}
      />
      <ToolbarButton
        icon={icons.strikethrough}
        label="Strikethrough"
        onClick={() => onExecCommand("strikethrough")}
        isActive={activeFormats.has("strikethrough")}
        disabled={disabled}
      />

      <ToolbarSeparator />

      {/* Headings */}
      <ToolbarButton
        icon={icons.paragraph}
        label="Paragraph"
        onClick={() => onFormatBlock("p")}
        disabled={disabled}
      />
      <ToolbarButton
        icon={icons.h1}
        label="Heading 1"
        onClick={() => onFormatBlock("h1")}
        isActive={activeFormats.has("h1")}
        disabled={disabled}
      />
      <ToolbarButton
        icon={icons.h2}
        label="Heading 2"
        onClick={() => onFormatBlock("h2")}
        isActive={activeFormats.has("h2")}
        disabled={disabled}
      />
      <ToolbarButton
        icon={icons.h3}
        label="Heading 3"
        onClick={() => onFormatBlock("h3")}
        isActive={activeFormats.has("h3")}
        disabled={disabled}
      />

      <ToolbarSeparator />

      {/* Lists */}
      <ToolbarButton
        icon={icons.bulletList}
        label="Bullet list"
        onClick={() => onExecCommand("insertUnorderedList")}
        isActive={activeFormats.has("bulletList")}
        disabled={disabled}
      />
      <ToolbarButton
        icon={icons.numberedList}
        label="Numbered list"
        onClick={() => onExecCommand("insertOrderedList")}
        isActive={activeFormats.has("numberedList")}
        disabled={disabled}
      />

      <ToolbarSeparator />

      {/* Block elements */}
      <ToolbarButton
        icon={icons.quote}
        label="Blockquote"
        onClick={() => onFormatBlock("blockquote")}
        isActive={activeFormats.has("blockquote")}
        disabled={disabled}
      />
      <ToolbarButton
        icon={icons.code}
        label="Code block"
        onClick={onInsertCodeBlock}
        isActive={activeFormats.has("code")}
        disabled={disabled}
      />

      <ToolbarSeparator />

      {/* Links */}
      <ToolbarButton
        icon={icons.link}
        label="Insert link (Ctrl+K)"
        onClick={onOpenLinkDialog}
        isActive={activeFormats.has("link")}
        disabled={disabled}
      />
      {activeFormats.has("link") && (
        <ToolbarButton
          icon={icons.unlink}
          label="Remove link"
          onClick={onRemoveLink}
          disabled={disabled}
        />
      )}

      <ToolbarSeparator />

      {/* Alignment */}
      <ToolbarButton
        icon={icons.alignLeft}
        label="Align left"
        onClick={() => onExecCommand("justifyLeft")}
        isActive={activeFormats.has("alignLeft")}
        disabled={disabled}
      />
      <ToolbarButton
        icon={icons.alignCenter}
        label="Align center"
        onClick={() => onExecCommand("justifyCenter")}
        isActive={activeFormats.has("alignCenter")}
        disabled={disabled}
      />
      <ToolbarButton
        icon={icons.alignRight}
        label="Align right"
        onClick={() => onExecCommand("justifyRight")}
        isActive={activeFormats.has("alignRight")}
        disabled={disabled}
      />
    </div>
  );
};
RichTextToolbar.displayName = "RichTextToolbar";

export { ToolbarButton, ToolbarSeparator, RichTextToolbar };
