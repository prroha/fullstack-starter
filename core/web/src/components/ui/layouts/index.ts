// =====================================================
// Layout Components
// =====================================================

// Container
export { Container } from "./container";
export type {
  ContainerProps,
  ContainerSize,
  ContainerPadding,
  ContainerElement,
} from "./container";

// Stack
export { Stack } from "./stack";
export type {
  StackProps,
  SpacingValue,
  DirectionValue,
  AlignValue,
  JustifyValue,
} from "./stack";

// Auth Layout
export { AuthLayout, BackgroundPattern } from "./auth-layout";
export type { AuthLayoutProps, MaxWidth } from "./auth-layout";

// Page Layout
export {
  PageLayout,
  SidebarToggle,
  usePageLayoutContext,
} from "./page-layout";
export type {
  PageLayoutProps,
  SidebarPosition,
  SidebarToggleProps,
  PageLayoutContextValue,
} from "./page-layout";

// Dashboard Layout
export {
  DashboardLayout,
  DashboardSidebar,
  DashboardNavItem,
  DashboardHeader,
} from "./dashboard-layout";
export type {
  DashboardLayoutProps,
  DashboardSidebarProps,
  DashboardNavItemProps,
  DashboardHeaderProps,
} from "./dashboard-layout";

// Split Layout
export { SplitLayout, ResizableSplitLayout } from "./split-layout";
export type {
  SplitLayoutProps,
  ResizableSplitLayoutProps,
  SplitRatio,
  GapSize,
  MobileBreakpoint,
} from "./split-layout";
