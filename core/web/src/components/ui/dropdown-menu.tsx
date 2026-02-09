"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

// =====================================================
// Types
// =====================================================

export type DropdownMenuPosition =
  | "bottom-start"
  | "bottom-end"
  | "bottom-center"
  | "top-start"
  | "top-end"
  | "top-center"
  | "left-start"
  | "left-end"
  | "right-start"
  | "right-end";

export interface DropdownMenuItem {
  /** Unique key for the item */
  key: string;
  /** Label to display */
  label: string;
  /** Icon to display before label */
  icon?: React.ReactNode;
  /** Keyboard shortcut to display */
  shortcut?: string;
  /** Click handler */
  onClick?: () => void;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Whether the item is destructive (e.g., delete action) */
  destructive?: boolean;
  /** Nested submenu items */
  submenu?: DropdownMenuItem[];
}

export interface DropdownMenuDivider {
  type: "divider";
  key: string;
}

export interface DropdownMenuGroup {
  type: "group";
  key: string;
  label?: string;
  items: (DropdownMenuItem | DropdownMenuDivider)[];
}

export type DropdownMenuContent = (DropdownMenuItem | DropdownMenuDivider | DropdownMenuGroup)[];

export interface DropdownMenuProps {
  /** Trigger element (renders as children) */
  trigger: React.ReactNode;
  /** Menu content (items, dividers, groups) */
  content: DropdownMenuContent;
  /** Position of the menu relative to trigger */
  position?: DropdownMenuPosition;
  /** Close menu when an item is selected */
  closeOnSelect?: boolean;
  /** Whether the menu is disabled */
  disabled?: boolean;
  /** Additional class name for the menu container */
  menuClassName?: string;
  /** Additional class name for the trigger wrapper */
  className?: string;
  /** Controlled open state */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
}

// =====================================================
// Context
// =====================================================

interface DropdownMenuContextValue {
  closeMenu: () => void;
  closeOnSelect: boolean;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenuContext() {
  const context = React.useContext(DropdownMenuContext);
  if (!context) {
    throw new Error("DropdownMenu sub-components must be used within DropdownMenu");
  }
  return context;
}

// =====================================================
// Icons
// =====================================================

function ChevronRightIcon({ className }: { className?: string }) {
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
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

// =====================================================
// Keyboard Navigation Hook
// =====================================================

function useMenuKeyboardNavigation(
  menuRef: React.RefObject<HTMLDivElement | null>,
  isOpen: boolean,
  onClose: () => void
) {
  const [focusedIndex, setFocusedIndex] = React.useState(-1);

  React.useEffect(() => {
    if (!isOpen) {
      setFocusedIndex(-1);
      return;
    }

    const menu = menuRef.current;
    if (!menu) return;

    const menuItems = menu.querySelectorAll<HTMLElement>(
      '[role="menuitem"]:not([aria-disabled="true"])'
    );

    function handleKeyDown(e: KeyboardEvent) {
      const items = Array.from(menuItems);
      const currentIndex = focusedIndex;

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
          setFocusedIndex(nextIndex);
          items[nextIndex]?.focus();
          break;
        }

        case "ArrowUp": {
          e.preventDefault();
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
          setFocusedIndex(prevIndex);
          items[prevIndex]?.focus();
          break;
        }

        case "Home":
          e.preventDefault();
          setFocusedIndex(0);
          items[0]?.focus();
          break;

        case "End": {
          e.preventDefault();
          const lastIndex = items.length - 1;
          setFocusedIndex(lastIndex);
          items[lastIndex]?.focus();
          break;
        }

        case "Escape":
          e.preventDefault();
          onClose();
          break;

        case "Tab":
          e.preventDefault();
          onClose();
          break;
      }
    }

    menu.addEventListener("keydown", handleKeyDown);
    return () => menu.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, menuRef, focusedIndex, onClose]);

  return { focusedIndex, setFocusedIndex };
}

// =====================================================
// Position Calculator
// =====================================================

function calculateMenuPosition(
  triggerRect: DOMRect,
  menuRect: DOMRect,
  position: DropdownMenuPosition,
  gap: number = 4
): { top: number; left: number } {
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  let top = 0;
  let left = 0;

  // Calculate initial position based on preference
  switch (position) {
    case "bottom-start":
      top = triggerRect.bottom + gap;
      left = triggerRect.left;
      break;
    case "bottom-end":
      top = triggerRect.bottom + gap;
      left = triggerRect.right - menuRect.width;
      break;
    case "bottom-center":
      top = triggerRect.bottom + gap;
      left = triggerRect.left + (triggerRect.width - menuRect.width) / 2;
      break;
    case "top-start":
      top = triggerRect.top - menuRect.height - gap;
      left = triggerRect.left;
      break;
    case "top-end":
      top = triggerRect.top - menuRect.height - gap;
      left = triggerRect.right - menuRect.width;
      break;
    case "top-center":
      top = triggerRect.top - menuRect.height - gap;
      left = triggerRect.left + (triggerRect.width - menuRect.width) / 2;
      break;
    case "left-start":
      top = triggerRect.top;
      left = triggerRect.left - menuRect.width - gap;
      break;
    case "left-end":
      top = triggerRect.bottom - menuRect.height;
      left = triggerRect.left - menuRect.width - gap;
      break;
    case "right-start":
      top = triggerRect.top;
      left = triggerRect.right + gap;
      break;
    case "right-end":
      top = triggerRect.bottom - menuRect.height;
      left = triggerRect.right + gap;
      break;
  }

  // Clamp to viewport bounds
  left = Math.max(8, Math.min(left, viewport.width - menuRect.width - 8));
  top = Math.max(8, Math.min(top, viewport.height - menuRect.height - 8));

  return { top, left };
}

// =====================================================
// Menu Item Component
// =====================================================

interface MenuItemComponentProps {
  item: DropdownMenuItem;
  onItemClick: (item: DropdownMenuItem) => void;
}

function MenuItemComponent({ item, onItemClick }: MenuItemComponentProps) {
  const { closeMenu, closeOnSelect } = useDropdownMenuContext();
  const [isSubmenuOpen, setIsSubmenuOpen] = React.useState(false);
  const itemRef = React.useRef<HTMLButtonElement>(null);
  const submenuRef = React.useRef<HTMLDivElement>(null);
  const submenuTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleClick = () => {
    if (item.disabled || item.submenu) return;

    item.onClick?.();
    onItemClick(item);

    if (closeOnSelect) {
      closeMenu();
    }
  };

  const handleMouseEnter = () => {
    if (item.submenu) {
      if (submenuTimeoutRef.current) {
        clearTimeout(submenuTimeoutRef.current);
      }
      setIsSubmenuOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (item.submenu) {
      submenuTimeoutRef.current = setTimeout(() => {
        setIsSubmenuOpen(false);
      }, 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (item.submenu && (e.key === "ArrowRight" || e.key === "Enter")) {
      e.preventDefault();
      setIsSubmenuOpen(true);
    }
  };

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (submenuTimeoutRef.current) {
        clearTimeout(submenuTimeoutRef.current);
      }
    };
  }, []);

  const hasSubmenu = !!item.submenu;

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        ref={itemRef}
        type="button"
        role="menuitem"
        disabled={item.disabled}
        aria-disabled={item.disabled}
        aria-haspopup={hasSubmenu ? "menu" : undefined}
        aria-expanded={hasSubmenu ? isSubmenuOpen : undefined}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          "w-full flex items-center gap-2 px-2 py-1.5 rounded-sm",
          "text-sm text-left",
          "focus-visible:outline-none focus-visible:bg-accent focus-visible:text-accent-foreground",
          "disabled:pointer-events-none disabled:opacity-50",
          item.destructive
            ? "text-destructive hover:bg-destructive/10 focus-visible:bg-destructive/10 focus-visible:text-destructive"
            : "hover:bg-accent hover:text-accent-foreground"
        )}
      >
        {/* Icon */}
        {item.icon && (
          <span className="flex-shrink-0 h-4 w-4" aria-hidden="true">
            {item.icon}
          </span>
        )}

        {/* Label */}
        <span className="flex-1 truncate">{item.label}</span>

        {/* Shortcut or submenu indicator */}
        {item.shortcut && !hasSubmenu && (
          <span className="ml-auto text-xs text-muted-foreground">
            {item.shortcut}
          </span>
        )}

        {hasSubmenu && (
          <ChevronRightIcon className="ml-auto h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Submenu */}
      {hasSubmenu && isSubmenuOpen && (
        <div
          ref={submenuRef}
          role="menu"
          className={cn(
            "absolute left-full top-0 ml-1 min-w-[160px]",
            "bg-popover border border-border rounded-md shadow-lg",
            "p-1 z-50",
            "animate-in fade-in-0 zoom-in-95 duration-100"
          )}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {item.submenu!.map((subItem) => (
            <MenuItemComponent
              key={subItem.key}
              item={subItem}
              onItemClick={onItemClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// =====================================================
// DropdownMenu Component
// =====================================================

function DropdownMenu({
  trigger,
  content,
  position = "bottom-start",
  closeOnSelect = true,
  disabled = false,
  menuClassName,
  className,
  open: controlledOpen,
  onOpenChange,
}: DropdownMenuProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const triggerRef = React.useRef<HTMLDivElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = React.useState({ top: 0, left: 0 });
  const [mounted, setMounted] = React.useState(false);

  const setOpen = React.useCallback(
    (open: boolean) => {
      if (isControlled) {
        onOpenChange?.(open);
      } else {
        setInternalOpen(open);
      }
    },
    [isControlled, onOpenChange]
  );

  const closeMenu = React.useCallback(() => setOpen(false), [setOpen]);

  // Handle mounting for portal
  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Calculate menu position when opening
  React.useEffect(() => {
    if (!isOpen || !triggerRef.current || !menuRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();
    const newPosition = calculateMenuPosition(triggerRect, menuRect, position);
    setMenuPosition(newPosition);
  }, [isOpen, position]);

  // Handle click outside
  React.useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        closeMenu();
      }
    }

    // Use timeout to avoid immediate close on trigger click
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, closeMenu]);

  // Keyboard navigation
  useMenuKeyboardNavigation(menuRef, isOpen, closeMenu);

  // Focus first item when menu opens
  React.useEffect(() => {
    if (isOpen && menuRef.current) {
      const firstItem = menuRef.current.querySelector<HTMLElement>(
        '[role="menuitem"]:not([aria-disabled="true"])'
      );
      firstItem?.focus();
    }
  }, [isOpen]);

  const handleTriggerClick = () => {
    if (!disabled) {
      setOpen(!isOpen);
    }
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
    }
  };

  const handleItemClick = (_item: DropdownMenuItem) => {
    // Item click handling is done in MenuItemComponent
  };

  const renderContent = (items: DropdownMenuContent) => {
    return items.map((item) => {
      // Divider
      if ("type" in item && item.type === "divider") {
        return (
          <div
            key={item.key}
            role="separator"
            className="my-1 h-px bg-border"
          />
        );
      }

      // Group
      if ("type" in item && item.type === "group") {
        return (
          <div key={item.key} role="group" aria-label={item.label}>
            {item.label && (
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                {item.label}
              </div>
            )}
            {item.items.map((groupItem) => {
              if ("type" in groupItem && groupItem.type === "divider") {
                return (
                  <div
                    key={groupItem.key}
                    role="separator"
                    className="my-1 h-px bg-border"
                  />
                );
              }
              return (
                <MenuItemComponent
                  key={(groupItem as DropdownMenuItem).key}
                  item={groupItem as DropdownMenuItem}
                  onItemClick={handleItemClick}
                />
              );
            })}
          </div>
        );
      }

      // Regular item
      return (
        <MenuItemComponent
          key={item.key}
          item={item as DropdownMenuItem}
          onItemClick={handleItemClick}
        />
      );
    });
  };

  const menuContent = isOpen && mounted ? (
    <DropdownMenuContext.Provider value={{ closeMenu, closeOnSelect }}>
      {createPortal(
        <div
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          className={cn(
            "fixed min-w-[160px] max-w-[300px]",
            "bg-popover border border-border rounded-md shadow-lg",
            "p-1 z-50",
            "animate-in fade-in-0 zoom-in-95 duration-100",
            "focus:outline-none",
            menuClassName
          )}
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
          }}
          tabIndex={-1}
        >
          {renderContent(content)}
        </div>,
        document.body
      )}
    </DropdownMenuContext.Provider>
  ) : null;

  return (
    <>
      <div
        ref={triggerRef}
        className={cn("inline-flex", className)}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-disabled={disabled}
      >
        {trigger}
      </div>
      {menuContent}
    </>
  );
}

// =====================================================
// Exports
// =====================================================

export { DropdownMenu };
