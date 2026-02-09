"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

// =====================================================
// Types
// =====================================================

interface CommandItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Optional description */
  description?: string;
  /** Icon component or element */
  icon?: React.ReactNode;
  /** Keyboard shortcut (e.g., "Ctrl+N", "⌘K") */
  shortcut?: string;
  /** Action to execute when selected */
  onSelect: () => void;
  /** Group this item belongs to */
  group?: string;
  /** Keywords for fuzzy search */
  keywords?: string[];
  /** Whether this item is disabled */
  disabled?: boolean;
}

interface CommandGroup {
  /** Group identifier */
  id: string;
  /** Group display name */
  label: string;
  /** Items in this group */
  items: CommandItem[];
}

interface CommandPaletteProps {
  /** Whether the palette is open */
  isOpen: boolean;
  /** Callback when the palette should close */
  onClose: () => void;
  /** Command items to display */
  items: CommandItem[];
  /** Placeholder text for search input */
  placeholder?: string;
  /** Text to show when no results found */
  noResultsText?: string;
  /** Recent/frequent items to show at top */
  recentItems?: CommandItem[];
  /** Label for recent items section */
  recentLabel?: string;
  /** Whether to enable global keyboard shortcut (Cmd+K / Ctrl+K) */
  enableGlobalShortcut?: boolean;
  /** Additional class name for dialog */
  className?: string;
}

// =====================================================
// Fuzzy Search
// =====================================================

function fuzzyMatch(text: string, query: string): boolean {
  if (!query) return true;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  // Simple contains check
  if (lowerText.includes(lowerQuery)) return true;

  // Fuzzy matching: all characters in query must appear in order
  let queryIndex = 0;
  for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
    if (lowerText[i] === lowerQuery[queryIndex]) {
      queryIndex++;
    }
  }

  return queryIndex === lowerQuery.length;
}

function matchesSearch(item: CommandItem, query: string): boolean {
  if (!query) return true;

  // Check label
  if (fuzzyMatch(item.label, query)) return true;

  // Check description
  if (item.description && fuzzyMatch(item.description, query)) return true;

  // Check keywords
  if (item.keywords?.some(keyword => fuzzyMatch(keyword, query))) return true;

  return false;
}

// =====================================================
// Focus Trap Hook
// =====================================================

function useFocusTrap(
  containerRef: React.RefObject<HTMLDivElement | null>,
  isActive: boolean
) {
  React.useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Store the previously focused element
    const previouslyFocused = document.activeElement as HTMLElement;

    // Focus the first focusable element (search input)
    if (firstElement) {
      firstElement.focus();
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;

      if (focusableElements.length === 0) {
        e.preventDefault();
        return;
      }

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    }

    container.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      // Restore focus when dialog closes
      previouslyFocused?.focus?.();
    };
  }, [containerRef, isActive]);
}

// =====================================================
// Icons
// =====================================================

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
      />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}

// =====================================================
// CommandPalette Component
// =====================================================

function CommandPalette({
  isOpen,
  onClose,
  items,
  placeholder = "Type a command or search...",
  noResultsText = "No results found",
  recentItems = [],
  recentLabel = "Recent",
  enableGlobalShortcut = true,
  className,
}: CommandPaletteProps) {
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  // Handle mounting for portal
  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Reset state when opening
  React.useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Global keyboard shortcut (Cmd+K / Ctrl+K)
  React.useEffect(() => {
    if (!enableGlobalShortcut) return;

    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
        // Note: Opening is handled by parent component
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enableGlobalShortcut, isOpen, onClose]);

  // Handle escape key
  React.useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when dialog is open
  React.useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Focus trap
  useFocusTrap(dialogRef, isOpen);

  // Filter items based on search query
  const filteredItems = React.useMemo(() => {
    return items.filter((item) => matchesSearch(item, searchQuery));
  }, [items, searchQuery]);

  // Filter recent items based on search query
  const filteredRecentItems = React.useMemo(() => {
    if (!searchQuery) return recentItems;
    return recentItems.filter((item) => matchesSearch(item, searchQuery));
  }, [recentItems, searchQuery]);

  // Group items
  const groupedItems = React.useMemo(() => {
    const groups: CommandGroup[] = [];
    const ungrouped: CommandItem[] = [];

    filteredItems.forEach((item) => {
      if (item.group) {
        let group = groups.find((g) => g.id === item.group);
        if (!group) {
          group = { id: item.group, label: item.group, items: [] };
          groups.push(group);
        }
        group.items.push(item);
      } else {
        ungrouped.push(item);
      }
    });

    // Add ungrouped items as a group if they exist
    if (ungrouped.length > 0) {
      groups.unshift({ id: "commands", label: "Commands", items: ungrouped });
    }

    return groups;
  }, [filteredItems]);

  // Flatten items for keyboard navigation
  const flatItems = React.useMemo(() => {
    const items: CommandItem[] = [];

    // Add recent items first
    if (filteredRecentItems.length > 0 && !searchQuery) {
      items.push(...filteredRecentItems);
    }

    // Add grouped items
    groupedItems.forEach((group) => {
      items.push(...group.items);
    });

    return items;
  }, [filteredRecentItems, groupedItems, searchQuery]);

  // Reset selected index when items change
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [flatItems.length, searchQuery]);

  // Scroll selected item into view
  React.useEffect(() => {
    const selectedElement = listRef.current?.querySelector(
      `[data-index="${selectedIndex}"]`
    );
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < flatItems.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : flatItems.length - 1
        );
        break;
      case "Enter": {
        e.preventDefault();
        const selectedItem = flatItems[selectedIndex];
        if (selectedItem && !selectedItem.disabled) {
          selectedItem.onSelect();
          onClose();
        }
        break;
      }
      case "Home":
        e.preventDefault();
        setSelectedIndex(0);
        break;
      case "End":
        e.preventDefault();
        setSelectedIndex(flatItems.length - 1);
        break;
    }
  };

  // Handle item click
  const handleItemClick = (item: CommandItem) => {
    if (item.disabled) return;
    item.onSelect();
    onClose();
  };

  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Get the current index for an item
  const getItemIndex = (item: CommandItem) => {
    return flatItems.findIndex((i) => i.id === item.id);
  };

  if (!mounted || !isOpen) return null;

  const hasResults = flatItems.length > 0;
  const showRecent = filteredRecentItems.length > 0 && !searchQuery;

  const dialogContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-200"
        aria-hidden="true"
      />

      {/* Dialog container */}
      <div
        className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[20vh]"
        onClick={handleOverlayClick}
      >
        {/* Dialog */}
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full max-w-lg bg-background rounded-xl shadow-2xl border border-border",
            "overflow-hidden",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200",
            "focus:outline-none",
            className
          )}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <SearchIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded="true"
              aria-controls="command-list"
              aria-activedescendant={
                flatItems[selectedIndex]
                  ? `command-item-${flatItems[selectedIndex].id}`
                  : undefined
              }
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "flex-1 bg-transparent text-sm outline-none",
                "placeholder:text-muted-foreground"
              )}
            />
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              ESC
            </kbd>
          </div>

          {/* Command list */}
          <div
            ref={listRef}
            id="command-list"
            role="listbox"
            aria-label="Commands"
            className="max-h-[300px] overflow-y-auto p-2"
          >
            {!hasResults ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {noResultsText}
              </div>
            ) : (
              <>
                {/* Recent items */}
                {showRecent && (
                  <div className="mb-2">
                    <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      <ClockIcon className="h-3 w-3" />
                      {recentLabel}
                    </div>
                    {filteredRecentItems.map((item) => {
                      const index = getItemIndex(item);
                      return (
                        <CommandItemComponent
                          key={`recent-${item.id}`}
                          item={item}
                          index={index}
                          isSelected={selectedIndex === index}
                          onSelect={handleItemClick}
                          onHover={() => setSelectedIndex(index)}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Grouped items */}
                {groupedItems.map((group) => (
                  <div key={group.id} className="mb-2 last:mb-0">
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      {group.label}
                    </div>
                    {group.items.map((item) => {
                      const index = getItemIndex(item);
                      return (
                        <CommandItemComponent
                          key={item.id}
                          item={item}
                          index={index}
                          isSelected={selectedIndex === index}
                          onSelect={handleItemClick}
                          onHover={() => setSelectedIndex(index)}
                        />
                      );
                    })}
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Footer hint */}
          <div className="flex items-center justify-between gap-4 px-4 py-2 border-t border-border bg-muted/50 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono">
                  ↑
                </kbd>
                <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono">
                  ↓
                </kbd>
                <span className="ml-1">Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono">
                  ↵
                </kbd>
                <span className="ml-1">Select</span>
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono">
                ESC
              </kbd>
              <span className="ml-1">Close</span>
            </span>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(dialogContent, document.body);
}

// =====================================================
// CommandItem Component
// =====================================================

interface CommandItemComponentProps {
  item: CommandItem;
  index: number;
  isSelected: boolean;
  onSelect: (item: CommandItem) => void;
  onHover: () => void;
}

function CommandItemComponent({
  item,
  index,
  isSelected,
  onSelect,
  onHover,
}: CommandItemComponentProps) {
  return (
    <div
      id={`command-item-${item.id}`}
      role="option"
      aria-selected={isSelected}
      aria-disabled={item.disabled}
      data-index={index}
      className={cn(
        "flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer text-sm",
        "transition-colors duration-75",
        isSelected && "bg-accent text-accent-foreground",
        !isSelected && "hover:bg-accent/50",
        item.disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={() => onSelect(item)}
      onMouseMove={onHover}
    >
      {/* Icon */}
      {item.icon && (
        <span className="flex-shrink-0 text-muted-foreground">{item.icon}</span>
      )}

      {/* Label and description */}
      <div className="flex-1 min-w-0">
        <div className="truncate font-medium">{item.label}</div>
        {item.description && (
          <div className="truncate text-xs text-muted-foreground">
            {item.description}
          </div>
        )}
      </div>

      {/* Shortcut */}
      {item.shortcut && (
        <kbd className="flex-shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          {item.shortcut}
        </kbd>
      )}
    </div>
  );
}

// =====================================================
// useCommandPalette Hook
// =====================================================

interface UseCommandPaletteOptions {
  /** Whether to enable global keyboard shortcut (Cmd+K / Ctrl+K) */
  enableGlobalShortcut?: boolean;
}

function useCommandPalette(options: UseCommandPaletteOptions = {}) {
  const { enableGlobalShortcut = true } = options;
  const [isOpen, setIsOpen] = React.useState(false);

  const open = React.useCallback(() => setIsOpen(true), []);
  const close = React.useCallback(() => setIsOpen(false), []);
  const toggle = React.useCallback(() => setIsOpen((prev) => !prev), []);

  // Global keyboard shortcut
  React.useEffect(() => {
    if (!enableGlobalShortcut) return;

    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggle();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enableGlobalShortcut, toggle]);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}

// =====================================================
// Exports
// =====================================================

export { CommandPalette, useCommandPalette };
export type { CommandPaletteProps, CommandItem, CommandGroup };
