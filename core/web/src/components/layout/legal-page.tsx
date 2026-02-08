import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// =====================================================
// Legal Page Layout Component
// =====================================================

interface LegalPageProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Page title */
  title: string;
  /** Last updated date */
  lastUpdated?: string;
  /** Company/entity name */
  companyName?: string;
  /** Contact email for legal inquiries */
  contactEmail?: string;
  /** Table of contents items */
  tableOfContents?: TableOfContentsItem[];
  /** Page content */
  children: React.ReactNode;
}

interface TableOfContentsItem {
  id: string;
  title: string;
  level?: 1 | 2;
}

function LegalPage({
  title,
  lastUpdated,
  companyName = "Your Company",
  contactEmail,
  tableOfContents,
  className,
  children,
  ...props
}: LegalPageProps) {
  return (
    <div
      className={cn(
        "min-h-screen bg-background",
        className
      )}
      {...props}
    >
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {title}
          </h1>
          {lastUpdated && (
            <p className="mt-2 text-sm text-muted-foreground">
              Last updated: {lastUpdated}
            </p>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Table of Contents - Sidebar */}
          {tableOfContents && tableOfContents.length > 0 && (
            <aside className="lg:col-span-1">
              <nav
                className="sticky top-24 rounded-lg border border-border bg-card p-4"
                aria-label="Table of contents"
              >
                <h2 className="text-sm font-semibold text-foreground mb-3">
                  On this page
                </h2>
                <ul className="space-y-2">
                  {tableOfContents.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className={cn(
                          "block text-sm text-muted-foreground hover:text-foreground",
                          item.level === 2 && "pl-4"
                        )}
                      >
                        {item.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
          )}

          {/* Main Content */}
          <main
            className={cn(
              "lg:col-span-3",
              !tableOfContents && "lg:col-span-4 max-w-4xl mx-auto"
            )}
          >
            <article className="prose prose-neutral dark:prose-invert max-w-none">
              {children}
            </article>

            {/* Contact Section */}
            {contactEmail && (
              <div className="mt-12 pt-8 border-t border-border">
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  Questions?
                </h2>
                <p className="text-muted-foreground">
                  If you have any questions about this document, please contact us at{" "}
                  <a
                    href={`mailto:${contactEmail}`}
                    className="text-primary hover:underline"
                  >
                    {contactEmail}
                  </a>
                  .
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// Legal Section Component
// =====================================================

interface LegalSectionProps extends React.HTMLAttributes<HTMLElement> {
  /** Section ID for anchor links */
  id: string;
  /** Section title */
  title: string;
  /** Section number (optional) */
  number?: string;
  /** Section content */
  children: React.ReactNode;
}

function LegalSection({
  id,
  title,
  number,
  className,
  children,
  ...props
}: LegalSectionProps) {
  return (
    <section id={id} className={cn("scroll-mt-24 mb-8", className)} {...props}>
      <h2 className="text-xl font-semibold text-foreground mb-4 flex items-start gap-2">
        {number && (
          <span className="text-muted-foreground">{number}.</span>
        )}
        <span>{title}</span>
      </h2>
      <div className="space-y-4 text-muted-foreground leading-relaxed">
        {children}
      </div>
    </section>
  );
}

// =====================================================
// Legal Subsection Component
// =====================================================

interface LegalSubsectionProps extends React.HTMLAttributes<HTMLElement> {
  /** Subsection ID for anchor links */
  id?: string;
  /** Subsection title */
  title: string;
  /** Subsection number (optional) */
  number?: string;
  /** Subsection content */
  children: React.ReactNode;
}

function LegalSubsection({
  id,
  title,
  number,
  className,
  children,
  ...props
}: LegalSubsectionProps) {
  return (
    <div id={id} className={cn("scroll-mt-24 mb-6", className)} {...props}>
      <h3 className="text-lg font-medium text-foreground mb-2 flex items-start gap-2">
        {number && (
          <span className="text-muted-foreground">{number}.</span>
        )}
        <span>{title}</span>
      </h3>
      <div className="space-y-3 text-muted-foreground">
        {children}
      </div>
    </div>
  );
}

// =====================================================
// Legal List Component
// =====================================================

interface LegalListProps extends React.HTMLAttributes<HTMLUListElement> {
  /** List items */
  items: string[];
  /** List type */
  type?: "bullet" | "numbered" | "alpha";
}

function LegalList({
  items,
  type = "bullet",
  className,
  ...props
}: LegalListProps) {
  const ListComponent = type === "bullet" ? "ul" : "ol";
  const listStyle = {
    bullet: "list-disc",
    numbered: "list-decimal",
    alpha: "list-[lower-alpha]",
  };

  return (
    <ListComponent
      className={cn(
        "pl-6 space-y-2",
        listStyle[type],
        className
      )}
      {...props}
    >
      {items.map((item, index) => (
        <li key={index} className="text-muted-foreground">
          {item}
        </li>
      ))}
    </ListComponent>
  );
}

// =====================================================
// Legal Highlight Component
// =====================================================

interface LegalHighlightProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Highlight type */
  type?: "info" | "warning" | "important";
  /** Highlight content */
  children: React.ReactNode;
}

function LegalHighlight({
  type = "info",
  className,
  children,
  ...props
}: LegalHighlightProps) {
  const styles = {
    info: "border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    warning: "border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
    important: "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-300",
  };

  return (
    <div
      className={cn(
        "my-4 p-4 rounded-lg border-l-4",
        styles[type],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// =====================================================
// Exports
// =====================================================

export {
  LegalPage,
  LegalSection,
  LegalSubsection,
  LegalList,
  LegalHighlight,
};
export type {
  LegalPageProps,
  TableOfContentsItem,
  LegalSectionProps,
  LegalSubsectionProps,
  LegalListProps,
  LegalHighlightProps,
};
