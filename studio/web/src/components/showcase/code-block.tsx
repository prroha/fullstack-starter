"use client";

import { useState, useCallback } from "react";
import { Check, Copy, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  language?: "tsx" | "ts" | "css" | "bash" | "json";
  title?: string;
  className?: string;
  showLineNumbers?: boolean;
}

type CopyState = "idle" | "copied" | "error";

export function CodeBlock({
  code,
  language = "tsx",
  title,
  className,
  showLineNumbers = false,
}: CodeBlockProps) {
  const [copyState, setCopyState] = useState<CopyState>("idle");

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("error");
      setTimeout(() => setCopyState("idle"), 2000);
    }
  }, [code]);

  const lines = code.split("\n");

  const getCopyIcon = () => {
    switch (copyState) {
      case "copied":
        return <Check className="h-4 w-4 text-success" aria-hidden="true" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" aria-hidden="true" />;
      default:
        return <Copy className="h-4 w-4 text-muted-foreground" aria-hidden="true" />;
    }
  };

  const getCopyLabel = () => {
    switch (copyState) {
      case "copied":
        return "Copied to clipboard";
      case "error":
        return "Failed to copy";
      default:
        return "Copy code to clipboard";
    }
  };

  const CopyButton = ({ className: buttonClassName }: { className?: string }) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className={cn("h-auto w-auto p-1.5", buttonClassName)}
      aria-label={getCopyLabel()}
      aria-live="polite"
    >
      {getCopyIcon()}
      <span className="sr-only">{getCopyLabel()}</span>
    </Button>
  );

  return (
    <div
      className={cn("rounded-lg border bg-muted/50 overflow-hidden", className)}
      role="region"
      aria-label={title ? `Code block: ${title}` : "Code block"}
    >
      {title && (
        <div className="flex items-center justify-between border-b px-4 py-2 bg-muted/50">
          <span className="text-sm font-medium">{title}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground uppercase" aria-label={`Language: ${language}`}>
              {language}
            </span>
            <CopyButton />
          </div>
        </div>
      )}
      <div className="relative group">
        {!title && (
          <CopyButton
            className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
          />
        )}
        <pre className="overflow-x-auto p-4 text-sm" tabIndex={0}>
          <code className={`language-${language}`}>
            {showLineNumbers ? (
              lines.map((line, i) => (
                <div key={i} className="table-row">
                  <span
                    className="table-cell pr-4 text-muted-foreground select-none text-right"
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <span className="table-cell">{line}</span>
                </div>
              ))
            ) : (
              code
            )}
          </code>
        </pre>
      </div>
    </div>
  );
}
