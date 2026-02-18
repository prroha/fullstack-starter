"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Input } from "./input";

// =====================================================
// HTML Sanitization (XSS Prevention)
// =====================================================

/** Tags allowed in rich text content */
const ALLOWED_TAGS = new Set([
  "p", "br", "b", "i", "u", "s", "em", "strong", "sub", "sup",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "blockquote", "pre", "code",
  "a", "span", "div",
  "table", "thead", "tbody", "tr", "th", "td",
  "hr", "img",
]);

/** Attributes allowed per tag (all others are stripped) */
const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel"]),
  img: new Set(["src", "alt", "width", "height"]),
  td: new Set(["colspan", "rowspan"]),
  th: new Set(["colspan", "rowspan"]),
  span: new Set(["style"]),
  div: new Set(["style"]),
  p: new Set(["style"]),
};

/** CSS properties allowed in style attributes */
const ALLOWED_STYLE_PROPERTIES = new Set([
  "color", "background-color", "font-size", "font-weight", "font-style",
  "text-align", "text-decoration", "margin", "padding",
  "margin-left", "margin-right", "padding-left", "padding-right",
]);

function sanitizeStyle(style: string): string {
  return style
    .split(";")
    .map((decl) => decl.trim())
    .filter((decl) => {
      const prop = decl.split(":")[0]?.trim().toLowerCase();
      return prop && ALLOWED_STYLE_PROPERTIES.has(prop);
    })
    .join("; ");
}

function sanitizeElement(el: Element): void {
  const tagName = el.tagName.toLowerCase();

  if (!ALLOWED_TAGS.has(tagName)) {
    // Replace disallowed element with its text content
    el.replaceWith(document.createTextNode(el.textContent || ""));
    return;
  }

  // Remove disallowed attributes
  const allowedAttrs = ALLOWED_ATTRIBUTES[tagName] || new Set<string>();
  const attrsToRemove: string[] = [];
  for (let i = 0; i < el.attributes.length; i++) {
    const attrName = el.attributes[i].name.toLowerCase();
    // Strip all event handlers (on*)
    if (attrName.startsWith("on") || !allowedAttrs.has(attrName)) {
      attrsToRemove.push(el.attributes[i].name);
    }
  }
  for (const attr of attrsToRemove) {
    el.removeAttribute(attr);
  }

  // Sanitize style attribute if present
  if (el.hasAttribute("style")) {
    const sanitized = sanitizeStyle(el.getAttribute("style") || "");
    if (sanitized) {
      el.setAttribute("style", sanitized);
    } else {
      el.removeAttribute("style");
    }
  }

  // Sanitize href to prevent javascript: URIs
  if (el.hasAttribute("href")) {
    const href = el.getAttribute("href") || "";
    if (/^\s*javascript\s*:/i.test(href) || /^\s*data\s*:/i.test(href)) {
      el.removeAttribute("href");
    }
  }

  // Sanitize img src to prevent javascript: URIs
  if (el.hasAttribute("src")) {
    const src = el.getAttribute("src") || "";
    if (/^\s*javascript\s*:/i.test(src)) {
      el.removeAttribute("src");
    }
  }

  // Recursively sanitize children (iterate in reverse since DOM may mutate)
  const children = Array.from(el.children);
  for (const child of children) {
    sanitizeElement(child);
  }
}

/**
 * Sanitizes HTML string to prevent XSS attacks.
 * Uses the browser's DOMParser to parse and then walks the tree,
 * removing disallowed tags, attributes, and event handlers.
 */
function sanitizeHtml(html: string): string {
  if (!html || typeof window === "undefined") return html || "";
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const children = Array.from(doc.body.children);
    for (const child of children) {
      sanitizeElement(child);
    }
    return doc.body.innerHTML;
  } catch {
    // If parsing fails, strip all HTML as a safety fallback
    return html.replace(/<[^>]*>/g, "");
  }
}

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

type FormatCommand =
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

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
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
      (command: FormatCommand, value?: string) => {
        if (disabled || readOnly) return;
        editorRef.current?.focus();
        document.execCommand(command, false, value);
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
              onClick={() => execCommand("undo")}
              disabled={disabled}
            />
            <ToolbarButton
              icon={icons.redo}
              label="Redo (Ctrl+Y)"
              onClick={() => execCommand("redo")}
              disabled={disabled}
            />

            <ToolbarSeparator />

            {/* Text formatting */}
            <ToolbarButton
              icon={icons.bold}
              label="Bold (Ctrl+B)"
              onClick={() => execCommand("bold")}
              isActive={activeFormats.has("bold")}
              disabled={disabled}
            />
            <ToolbarButton
              icon={icons.italic}
              label="Italic (Ctrl+I)"
              onClick={() => execCommand("italic")}
              isActive={activeFormats.has("italic")}
              disabled={disabled}
            />
            <ToolbarButton
              icon={icons.underline}
              label="Underline (Ctrl+U)"
              onClick={() => execCommand("underline")}
              isActive={activeFormats.has("underline")}
              disabled={disabled}
            />
            <ToolbarButton
              icon={icons.strikethrough}
              label="Strikethrough"
              onClick={() => execCommand("strikethrough")}
              isActive={activeFormats.has("strikethrough")}
              disabled={disabled}
            />

            <ToolbarSeparator />

            {/* Headings */}
            <ToolbarButton
              icon={icons.paragraph}
              label="Paragraph"
              onClick={() => formatBlock("p")}
              disabled={disabled}
            />
            <ToolbarButton
              icon={icons.h1}
              label="Heading 1"
              onClick={() => formatBlock("h1")}
              isActive={activeFormats.has("h1")}
              disabled={disabled}
            />
            <ToolbarButton
              icon={icons.h2}
              label="Heading 2"
              onClick={() => formatBlock("h2")}
              isActive={activeFormats.has("h2")}
              disabled={disabled}
            />
            <ToolbarButton
              icon={icons.h3}
              label="Heading 3"
              onClick={() => formatBlock("h3")}
              isActive={activeFormats.has("h3")}
              disabled={disabled}
            />

            <ToolbarSeparator />

            {/* Lists */}
            <ToolbarButton
              icon={icons.bulletList}
              label="Bullet list"
              onClick={() => execCommand("insertUnorderedList")}
              isActive={activeFormats.has("bulletList")}
              disabled={disabled}
            />
            <ToolbarButton
              icon={icons.numberedList}
              label="Numbered list"
              onClick={() => execCommand("insertOrderedList")}
              isActive={activeFormats.has("numberedList")}
              disabled={disabled}
            />

            <ToolbarSeparator />

            {/* Block elements */}
            <ToolbarButton
              icon={icons.quote}
              label="Blockquote"
              onClick={() => formatBlock("blockquote")}
              isActive={activeFormats.has("blockquote")}
              disabled={disabled}
            />
            <ToolbarButton
              icon={icons.code}
              label="Code block"
              onClick={insertCodeBlock}
              isActive={activeFormats.has("code")}
              disabled={disabled}
            />

            <ToolbarSeparator />

            {/* Links */}
            <ToolbarButton
              icon={icons.link}
              label="Insert link (Ctrl+K)"
              onClick={openLinkDialog}
              isActive={activeFormats.has("link")}
              disabled={disabled}
            />
            {activeFormats.has("link") && (
              <ToolbarButton
                icon={icons.unlink}
                label="Remove link"
                onClick={removeLink}
                disabled={disabled}
              />
            )}

            <ToolbarSeparator />

            {/* Alignment */}
            <ToolbarButton
              icon={icons.alignLeft}
              label="Align left"
              onClick={() => execCommand("justifyLeft")}
              isActive={activeFormats.has("alignLeft")}
              disabled={disabled}
            />
            <ToolbarButton
              icon={icons.alignCenter}
              label="Align center"
              onClick={() => execCommand("justifyCenter")}
              isActive={activeFormats.has("alignCenter")}
              disabled={disabled}
            />
            <ToolbarButton
              icon={icons.alignRight}
              label="Align right"
              onClick={() => execCommand("justifyRight")}
              isActive={activeFormats.has("alignRight")}
              disabled={disabled}
            />
          </div>
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
        {showLinkDialog && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setShowLinkDialog(false)}
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
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    insertLink();
                  }
                  if (e.key === "Escape") {
                    setShowLinkDialog(false);
                  }
                }}
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setShowLinkDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  type="button"
                  onClick={insertLink}
                  disabled={!linkUrl}
                >
                  Insert
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);
RichTextEditor.displayName = "RichTextEditor";

export { RichTextEditor };
