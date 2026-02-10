"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  language?: "tsx" | "ts" | "css" | "bash";
  title?: string;
  className?: string;
  showLineNumbers?: boolean;
}

export function CodeBlock({
  code,
  language = "tsx",
  title,
  className,
  showLineNumbers = false,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split("\n");

  return (
    <div className={cn("rounded-lg border bg-muted/50 overflow-hidden", className)}>
      {title && (
        <div className="flex items-center justify-between border-b px-4 py-2 bg-muted/50">
          <span className="text-sm font-medium">{title}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground uppercase">{language}</span>
            <button
              onClick={handleCopy}
              className="p-1.5 hover:bg-accent rounded-md transition-colors"
              aria-label="Copy code"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>
      )}
      <div className="relative group">
        {!title && (
          <button
            onClick={handleCopy}
            className="absolute right-2 top-2 p-1.5 hover:bg-accent rounded-md transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Copy code"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        )}
        <pre className="overflow-x-auto p-4 text-sm">
          <code className={`language-${language}`}>
            {showLineNumbers ? (
              lines.map((line, i) => (
                <div key={i} className="table-row">
                  <span className="table-cell pr-4 text-muted-foreground select-none text-right">
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
