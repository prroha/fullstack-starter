"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { sanitizeHtml } from "./rich-text-sanitizer";
import { RichTextToolbar } from "./rich-text-toolbar";
import type { FormatCommand } from "./rich-text-toolbar";
import { RichTextLinkDialog } from "./rich-text-link-dialog";

// Re-export sub-components and types for consumers that may need them
export { sanitizeHtml } from "./rich-text-sanitizer";
export { RichTextToolbar, ToolbarButton, ToolbarSeparator } from "./rich-text-toolbar";
export type { ToolbarButtonProps, FormatCommand, RichTextToolbarProps } from "./rich-text-toolbar";
export { RichTextLinkDialog } from "./rich-text-link-dialog";
export type { RichTextLinkDialogProps } from "./rich-text-link-dialog";

// =====================================================
// Types
// =====================================================

export type RichTextEditorSize = "sm" | "md" | "lg";

export interface RichTextEditorProps {
  /** Current HTML value (controlled mode) */
  value?: string;
  /** Default HTML value (uncontrolled mode) */
  defaultValue?: string;
  /** Called when content changes */
  onChange?: (html: string) => void;
  /** Placeholder text when empty */
  placeholder?: string;
  /** Whether the editor is disabled */
  disabled?: boolean;
  /** Whether the editor is read-only */
  readOnly?: boolean;
  /** Whether to show character count */
  showCharacterCount?: boolean;
  /** Whether to show word count */
  showWordCount?: boolean;
  /** Maximum character limit */
  maxLength?: number;
  /** Size variant */
  size?: RichTextEditorSize;
  /** Whether the editor has an error */
  error?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Additional class name */
  className?: string;
  /** ID for the editor */
  id?: string;
  /** Accessible label */
  "aria-label"?: string;
  /** ID of element that labels this editor */
  "aria-labelledby"?: string;
  /** ID of element that describes this editor */
  "aria-describedby"?: string;
  /** Minimum height of the editor */
  minHeight?: string;
  /** Auto focus the editor on mount */
  autoFocus?: boolean;
}

// =====================================================
// Utility Functions
// =====================================================

function getTextContent(html: string): string {
  if (typeof window === "undefined") return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

function countCharacters(text: string): number {
  return text.length;
}

// =====================================================
// RichTextEditor Component
// =====================================================

const RichTextEditor = React.forwardRef<HTMLDivElement, RichTextEditorProps>(
  (
    {
      value,
      defaultValue = "",
      onChange,
      placeholder = "Start typing...",
      disabled = false,
      readOnly = false,
      showCharacterCount = false,
      showWordCount = false,
      maxLength,
      size = "md",
      error = false,
      errorMessage,
      className,
      id,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      "aria-describedby": ariaDescribedBy,
      minHeight,
      autoFocus = false,
    },
    ref
  ) => {
    const editorRef = React.useRef<HTMLDivElement>(null);
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = React.useState(defaultValue);
    const [activeFormats, setActiveFormats] = React.useState<Set<string>>(new Set());
    const [showLinkDialog, setShowLinkDialog] = React.useState(false);
    const [linkUrl, setLinkUrl] = React.useState("");
    const savedSelectionRef = React.useRef<Range | null>(null);

    const currentValue = isControlled ? value : internalValue;

    // Size variants
    const sizeStyles = {
      sm: "min-h-[120px] text-sm",
      md: "min-h-[200px] text-base",
      lg: "min-h-[300px] text-lg",
    };

    // Update editor content when controlled value changes
    React.useEffect(() => {
      if (isControlled && editorRef.current) {
        if (editorRef.current.innerHTML !== value) {
          editorRef.current.innerHTML = value;
        }
      }
    }, [isControlled, value]);

    // Auto focus
    React.useEffect(() => {
      if (autoFocus && editorRef.current && !disabled && !readOnly) {
        editorRef.current.focus();
      }
    }, [autoFocus, disabled, readOnly]);

    // Handle content changes
    const handleInput = React.useCallback(() => {
      if (editorRef.current) {
        const html = editorRef.current.innerHTML;

        // Check max length
        if (maxLength) {
          const textContent = getTextContent(html);
          if (textContent.length > maxLength) {
            // Truncate content
            return;
          }
        }

        if (!isControlled) {
          setInternalValue(html);
        }
        onChange?.(html);
      }
    }, [isControlled, onChange, maxLength]);

    // Update active formats based on cursor position
    const updateActiveFormats = React.useCallback(() => {
      const formats = new Set<string>();

      if (document.queryCommandState("bold")) formats.add("bold");
      if (document.queryCommandState("italic")) formats.add("italic");
      if (document.queryCommandState("underline")) formats.add("underline");
      if (document.queryCommandState("strikeThrough")) formats.add("strikethrough");
      if (document.queryCommandState("insertUnorderedList")) formats.add("bulletList");
      if (document.queryCommandState("insertOrderedList")) formats.add("numberedList");
      if (document.queryCommandState("justifyLeft")) formats.add("alignLeft");
      if (document.queryCommandState("justifyCenter")) formats.add("alignCenter");
      if (document.queryCommandState("justifyRight")) formats.add("alignRight");

      // Check for block formats
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        let node: Node | null = selection.anchorNode;
        while (node && node !== editorRef.current) {
          if (node.nodeName === "H1") formats.add("h1");
          if (node.nodeName === "H2") formats.add("h2");
          if (node.nodeName === "H3") formats.add("h3");
          if (node.nodeName === "BLOCKQUOTE") formats.add("blockquote");
          if (node.nodeName === "PRE" || node.nodeName === "CODE") formats.add("code");
          if (node.nodeName === "A") formats.add("link");
          node = node.parentNode;
        }
      }

      setActiveFormats(formats);
    }, []);

    // Execute formatting command
    const execCommand = React.useCallback(
      (command: FormatCommand, commandValue?: string) => {
        if (disabled || readOnly) return;
        editorRef.current?.focus();
        document.execCommand(command, false, commandValue);
        handleInput();
        updateActiveFormats();
      },
      [disabled, readOnly, handleInput, updateActiveFormats]
    );

    // Format block (headings, paragraphs)
    const formatBlock = React.useCallback(
      (tag: string) => {
        if (disabled || readOnly) return;
        editorRef.current?.focus();
        document.execCommand("formatBlock", false, tag);
        handleInput();
        updateActiveFormats();
      },
      [disabled, readOnly, handleInput, updateActiveFormats]
    );

    // Insert code block
    const insertCodeBlock = React.useCallback(() => {
      if (disabled || readOnly) return;
      editorRef.current?.focus();

      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const selectedText = range.toString() || "code";

        const pre = document.createElement("pre");
        const code = document.createElement("code");
        code.textContent = selectedText;
        pre.appendChild(code);

        range.deleteContents();
        range.insertNode(pre);

        // Move cursor after the code block
        range.setStartAfter(pre);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }

      handleInput();
      updateActiveFormats();
    }, [disabled, readOnly, handleInput, updateActiveFormats]);

    // Save selection for link dialog
    const saveSelection = React.useCallback(() => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
      }
    }, []);

    // Restore selection
    const restoreSelection = React.useCallback(() => {
      if (savedSelectionRef.current) {
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(savedSelectionRef.current);
        }
      }
    }, []);

    // Open link dialog
    const openLinkDialog = React.useCallback(() => {
      if (disabled || readOnly) return;
      saveSelection();
      setLinkUrl("");
      setShowLinkDialog(true);
    }, [disabled, readOnly, saveSelection]);

    // Insert link
    const insertLink = React.useCallback(() => {
      if (!linkUrl) return;

      restoreSelection();
      editorRef.current?.focus();

      let url = linkUrl;
      if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("mailto:")) {
        url = "https://" + url;
      }

      document.execCommand("createLink", false, url);

      setShowLinkDialog(false);
      setLinkUrl("");
      handleInput();
      updateActiveFormats();
    }, [linkUrl, restoreSelection, handleInput, updateActiveFormats]);

    // Remove link
    const removeLink = React.useCallback(() => {
      if (disabled || readOnly) return;
      editorRef.current?.focus();
      document.execCommand("unlink", false);
      handleInput();
      updateActiveFormats();
    }, [disabled, readOnly, handleInput, updateActiveFormats]);

    // Handle keyboard shortcuts
    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (disabled || readOnly) return;

        const isMod = e.metaKey || e.ctrlKey;

        if (isMod) {
          switch (e.key.toLowerCase()) {
            case "b":
              e.preventDefault();
              execCommand("bold");
              break;
            case "i":
              e.preventDefault();
              execCommand("italic");
              break;
            case "u":
              e.preventDefault();
              execCommand("underline");
              break;
            case "k":
              e.preventDefault();
              if (activeFormats.has("link")) {
                removeLink();
              } else {
                openLinkDialog();
              }
              break;
            case "z":
              if (e.shiftKey) {
                e.preventDefault();
                execCommand("redo");
              } else {
                e.preventDefault();
                execCommand("undo");
              }
              break;
            case "y":
              e.preventDefault();
              execCommand("redo");
              break;
          }
        }
      },
      [disabled, readOnly, execCommand, activeFormats, removeLink, openLinkDialog]
    );

    // Handle selection change
    React.useEffect(() => {
      const handleSelectionChange = () => {
        if (
          editorRef.current &&
          editorRef.current.contains(document.activeElement)
        ) {
          updateActiveFormats();
        }
      };

      document.addEventListener("selectionchange", handleSelectionChange);
      return () => {
        document.removeEventListener("selectionchange", handleSelectionChange);
      };
    }, [updateActiveFormats]);

    // Calculate counts
    const textContent = React.useMemo(
      () => getTextContent(currentValue),
      [currentValue]
    );
    const charCount = countCharacters(textContent);
    const wordCount = countWords(textContent);

    const isOverLimit = maxLength ? charCount > maxLength : false;
    const showCounts = showCharacterCount || showWordCount;

    // Generate unique IDs for accessibility
    const generatedId = React.useId();
    const editorId = id || generatedId;
    const errorId = `${editorId}-error`;
    const countId = `${editorId}-count`;

    return (
      <div ref={ref} className={cn("w-full", className)}>
        {/* Toolbar */}
        {!readOnly && (
          <RichTextToolbar
            activeFormats={activeFormats}
            onExecCommand={execCommand}
            onFormatBlock={formatBlock}
            onInsertCodeBlock={insertCodeBlock}
            onOpenLinkDialog={openLinkDialog}
            onRemoveLink={removeLink}
            disabled={disabled}
            error={error}
            editorId={editorId}
          />
        )}

        {/* Editor */}
        <div
          ref={editorRef}
          id={editorId}
          role="textbox"
          aria-multiline="true"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={cn(
            ariaDescribedBy,
            error && errorMessage && errorId,
            showCounts && countId
          ) || undefined}
          aria-invalid={error || isOverLimit}
          aria-readonly={readOnly}
          aria-disabled={disabled}
          contentEditable={!disabled && !readOnly}
          suppressContentEditableWarning
          tabIndex={disabled ? -1 : 0}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={updateActiveFormats}
          data-placeholder={placeholder}
          dangerouslySetInnerHTML={
            isControlled ? undefined : { __html: sanitizeHtml(defaultValue || "") }
          }
          className={cn(
            "w-full px-3 py-2 border bg-background ring-offset-background",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "overflow-auto",
            // Placeholder styling
            "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none",
            // Size variants
            sizeStyles[size],
            // Custom min height
            minHeight && `min-h-[${minHeight}]`,
            // Border radius
            readOnly ? "rounded-md" : "rounded-b-md",
            // Error state
            error || isOverLimit
              ? "border-destructive focus-visible:ring-destructive"
              : "border-input",
            // Disabled state
            disabled && "cursor-not-allowed opacity-50",
            // Read-only state
            readOnly && "bg-muted cursor-default",
            // Rich text styles
            "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:first:mt-0",
            "[&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:first:mt-0",
            "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:first:mt-0",
            "[&_p]:mb-3 [&_p]:last:mb-0",
            "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3",
            "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3",
            "[&_li]:mb-1",
            "[&_blockquote]:border-l-4 [&_blockquote]:border-muted-foreground/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-4",
            "[&_pre]:bg-muted [&_pre]:rounded-md [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:my-4",
            "[&_code]:bg-muted [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_code]:font-mono",
            "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
            "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary/80"
          )}
          style={minHeight ? { minHeight } : undefined}
        />

        {/* Footer */}
        {(showCounts || (error && errorMessage)) && (
          <div className="flex items-center justify-between mt-1.5">
            {/* Error message */}
            {error && errorMessage && (
              <p
                id={errorId}
                className="text-sm text-destructive"
                role="alert"
              >
                {errorMessage}
              </p>
            )}

            {/* Character/Word count */}
            {showCounts && (
              <p
                id={countId}
                className={cn(
                  "text-xs ml-auto",
                  isOverLimit
                    ? "text-destructive font-medium animate-pulse"
                    : "text-muted-foreground"
                )}
              >
                {showWordCount && <span>{wordCount} words</span>}
                {showWordCount && showCharacterCount && (
                  <span className="mx-1">|</span>
                )}
                {showCharacterCount && (
                  <span>
                    {charCount}
                    {maxLength && ` / ${maxLength}`} characters
                  </span>
                )}
              </p>
            )}
          </div>
        )}

        {/* Link Dialog */}
        <RichTextLinkDialog
          isOpen={showLinkDialog}
          linkUrl={linkUrl}
          onLinkUrlChange={setLinkUrl}
          onInsert={insertLink}
          onClose={() => setShowLinkDialog(false)}
        />
      </div>
    );
  }
);
RichTextEditor.displayName = "RichTextEditor";

export { RichTextEditor };
