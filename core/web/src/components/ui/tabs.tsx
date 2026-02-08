"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// =====================================================
// Tabs Context
// =====================================================

interface TabsContextValue {
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  orientation: "horizontal" | "vertical";
  variant: "line" | "enclosed" | "soft-rounded";
  registerTab: (index: number, disabled: boolean) => void;
  unregisterTab: (index: number) => void;
  tabsMap: Map<number, { disabled: boolean }>;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within a Tabs component");
  }
  return context;
}

// =====================================================
// Tabs Component
// =====================================================

interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Default selected tab index (uncontrolled) */
  defaultIndex?: number;
  /** Controlled selected tab index */
  index?: number;
  /** Callback when tab changes */
  onChange?: (index: number) => void;
  /** Tab orientation */
  orientation?: "horizontal" | "vertical";
  /** Visual variant */
  variant?: "line" | "enclosed" | "soft-rounded";
}

function Tabs({
  defaultIndex = 0,
  index,
  onChange,
  orientation = "horizontal",
  variant = "line",
  className,
  children,
  ...props
}: TabsProps) {
  const [selectedIndex, setSelectedIndexState] = React.useState(
    index !== undefined ? index : defaultIndex
  );
  const [tabsMap] = React.useState(() => new Map<number, { disabled: boolean }>());

  // Sync with controlled index
  React.useEffect(() => {
    if (index !== undefined) {
      setSelectedIndexState(index);
    }
  }, [index]);

  const setSelectedIndex = React.useCallback(
    (newIndex: number) => {
      if (index === undefined) {
        setSelectedIndexState(newIndex);
      }
      onChange?.(newIndex);
    },
    [index, onChange]
  );

  const registerTab = React.useCallback(
    (tabIndex: number, disabled: boolean) => {
      tabsMap.set(tabIndex, { disabled });
    },
    [tabsMap]
  );

  const unregisterTab = React.useCallback(
    (tabIndex: number) => {
      tabsMap.delete(tabIndex);
    },
    [tabsMap]
  );

  return (
    <TabsContext.Provider
      value={{
        selectedIndex,
        setSelectedIndex,
        orientation,
        variant,
        registerTab,
        unregisterTab,
        tabsMap,
      }}
    >
      <div
        className={cn(
          "w-full",
          orientation === "vertical" && "flex gap-4",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
}

// =====================================================
// TabList Component
// =====================================================

interface TabListProps extends React.HTMLAttributes<HTMLDivElement> {}

function TabList({ className, children, ...props }: TabListProps) {
  const { orientation, variant } = useTabsContext();
  const tabListRef = React.useRef<HTMLDivElement>(null);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const tabList = tabListRef.current;
      if (!tabList) return;

      const tabs = Array.from(
        tabList.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])')
      );
      const currentIndex = tabs.findIndex(
        (tab) => tab === document.activeElement
      );

      if (currentIndex === -1) return;

      let nextIndex: number | null = null;

      const isHorizontal = orientation === "horizontal";
      const prevKey = isHorizontal ? "ArrowLeft" : "ArrowUp";
      const nextKey = isHorizontal ? "ArrowRight" : "ArrowDown";

      switch (event.key) {
        case prevKey:
          event.preventDefault();
          nextIndex = currentIndex - 1;
          if (nextIndex < 0) nextIndex = tabs.length - 1;
          break;
        case nextKey:
          event.preventDefault();
          nextIndex = currentIndex + 1;
          if (nextIndex >= tabs.length) nextIndex = 0;
          break;
        case "Home":
          event.preventDefault();
          nextIndex = 0;
          break;
        case "End":
          event.preventDefault();
          nextIndex = tabs.length - 1;
          break;
      }

      if (nextIndex !== null && tabs[nextIndex]) {
        tabs[nextIndex].focus();
      }
    },
    [orientation]
  );

  const variantStyles = {
    line: cn(
      "border-b border-border",
      orientation === "vertical" && "border-b-0 border-r"
    ),
    enclosed: "bg-muted rounded-lg p-1",
    "soft-rounded": "bg-muted rounded-lg p-1",
  };

  return (
    <div
      ref={tabListRef}
      role="tablist"
      aria-orientation={orientation}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex",
        orientation === "vertical" ? "flex-col" : "flex-row",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// =====================================================
// Tab Component
// =====================================================

interface TabContextValue {
  index: number;
}

const TabContext = React.createContext<TabContextValue | null>(null);

interface TabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Whether the tab is disabled */
  disabled?: boolean;
  /** Internal: tab index (set by parent) */
  _index?: number;
}

function Tab({
  disabled = false,
  _index,
  className,
  children,
  ...props
}: TabProps) {
  const {
    selectedIndex,
    setSelectedIndex,
    orientation,
    variant,
    registerTab,
    unregisterTab,
  } = useTabsContext();

  // Get index from context if available, otherwise use _index
  const tabContext = React.useContext(TabContext);
  const index = tabContext?.index ?? _index ?? 0;

  const isSelected = selectedIndex === index;
  const panelId = `tabpanel-${index}`;
  const tabId = `tab-${index}`;

  React.useEffect(() => {
    registerTab(index, disabled);
    return () => unregisterTab(index);
  }, [index, disabled, registerTab, unregisterTab]);

  const handleClick = () => {
    if (!disabled) {
      setSelectedIndex(index);
    }
  };

  const baseStyles = cn(
    "relative inline-flex items-center justify-center whitespace-nowrap px-4 py-2 text-sm font-medium",
    "transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50"
  );

  const variantStyles = {
    line: cn(
      "bg-transparent",
      isSelected
        ? "text-primary"
        : "text-muted-foreground hover:text-foreground",
      // Active indicator
      "after:absolute after:transition-all after:duration-200",
      orientation === "horizontal"
        ? cn(
            "after:bottom-0 after:left-0 after:right-0 after:h-0.5",
            isSelected ? "after:bg-primary" : "after:bg-transparent"
          )
        : cn(
            "after:right-0 after:top-0 after:bottom-0 after:w-0.5",
            isSelected ? "after:bg-primary" : "after:bg-transparent"
          )
    ),
    enclosed: cn(
      "rounded-md",
      isSelected
        ? "bg-background text-foreground shadow-sm"
        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
    ),
    "soft-rounded": cn(
      "rounded-full",
      isSelected
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
    ),
  };

  return (
    <button
      id={tabId}
      role="tab"
      type="button"
      aria-selected={isSelected}
      aria-controls={panelId}
      tabIndex={isSelected ? 0 : -1}
      disabled={disabled}
      onClick={handleClick}
      className={cn(baseStyles, variantStyles[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}

// =====================================================
// TabPanels Component
// =====================================================

interface TabPanelsProps extends React.HTMLAttributes<HTMLDivElement> {}

function TabPanels({ className, children, ...props }: TabPanelsProps) {
  const { orientation } = useTabsContext();

  return (
    <div
      className={cn(
        orientation === "vertical" ? "flex-1" : "mt-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// =====================================================
// TabPanel Component
// =====================================================

interface TabPanelContextValue {
  index: number;
}

const TabPanelContext = React.createContext<TabPanelContextValue | null>(null);

interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Internal: panel index (set by parent) */
  _index?: number;
}

function TabPanel({
  _index,
  className,
  children,
  ...props
}: TabPanelProps) {
  const { selectedIndex } = useTabsContext();

  // Get index from context if available, otherwise use _index
  const panelContext = React.useContext(TabPanelContext);
  const index = panelContext?.index ?? _index ?? 0;

  const isSelected = selectedIndex === index;
  const panelId = `tabpanel-${index}`;
  const tabId = `tab-${index}`;

  if (!isSelected) {
    return null;
  }

  return (
    <div
      id={panelId}
      role="tabpanel"
      aria-labelledby={tabId}
      tabIndex={0}
      className={cn(
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// =====================================================
// Helper: Index Provider for children
// =====================================================

// This wrapper component helps provide index to Tab/TabPanel children
function withIndexProvider<P extends { _index?: number }>(
  WrappedComponent: React.ComponentType<P>,
  ContextProvider: React.Provider<{ index: number } | null>
) {
  return function IndexedComponent(props: P & { _index?: number }) {
    const index = props._index ?? 0;
    return (
      <ContextProvider value={{ index }}>
        <WrappedComponent {...props} />
      </ContextProvider>
    );
  };
}

// Create indexed versions
const IndexedTab = withIndexProvider(Tab, TabContext.Provider);
const IndexedTabPanel = withIndexProvider(TabPanel, TabPanelContext.Provider);

// =====================================================
// Enhanced TabList that auto-indexes children
// =====================================================

function EnhancedTabList({ children, ...props }: TabListProps) {
  const indexedChildren = React.Children.map(children, (child, index) => {
    if (React.isValidElement(child) && child.type === Tab) {
      return React.cloneElement(child as React.ReactElement<TabProps>, {
        _index: index,
      });
    }
    return child;
  });

  return <TabList {...props}>{indexedChildren}</TabList>;
}

// =====================================================
// Enhanced TabPanels that auto-indexes children
// =====================================================

function EnhancedTabPanels({ children, ...props }: TabPanelsProps) {
  const indexedChildren = React.Children.map(children, (child, index) => {
    if (React.isValidElement(child) && child.type === TabPanel) {
      return React.cloneElement(child as React.ReactElement<TabPanelProps>, {
        _index: index,
      });
    }
    return child;
  });

  return <TabPanels {...props}>{indexedChildren}</TabPanels>;
}

// =====================================================
// Exports
// =====================================================

export {
  Tabs,
  EnhancedTabList as TabList,
  Tab,
  EnhancedTabPanels as TabPanels,
  TabPanel,
};
export type { TabsProps, TabListProps, TabProps, TabPanelsProps, TabPanelProps };
