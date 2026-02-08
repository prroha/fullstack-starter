// =====================================================
// UI Components (Atoms)
// =====================================================

// Button
export { Button } from "./button";
export type { ButtonProps } from "./button";

// Checkbox
export { Checkbox } from "./checkbox";
export type { CheckboxProps } from "./checkbox";

// Input
export { Input } from "./input";
export type { InputProps } from "./input";

// Textarea
export { Textarea } from "./textarea";
export type { TextareaProps } from "./textarea";

// Select
export { Select } from "./select";
export type { SelectProps, SelectOption } from "./select";

// Badge
export { Badge } from "./badge";
export type { BadgeProps } from "./badge";

// Spinner
export { Spinner, SpinnerOverlay } from "./spinner";
export type { SpinnerProps, SpinnerOverlayProps } from "./spinner";

// Skeleton
export {
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  SkeletonCard,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonImage,
  SkeletonTable,
  SkeletonList,
  SkeletonPage,
  SkeletonDashboard,
  SkeletonForm,
  SkeletonProfile,
  SkeletonAuth,
} from "./skeleton";

// Theme Toggle
export { ThemeToggle } from "./theme-toggle";
export type {
  ThemeToggleProps,
  ThemeToggleVariant,
  ThemeToggleSize,
} from "./theme-toggle";

// Accordion
export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "./accordion";
export type {
  AccordionProps,
  AccordionItemProps,
  AccordionTriggerProps,
  AccordionContentProps,
} from "./accordion";

// Export Button
export {
  ExportButton,
  ExportCsvButton,
  ExportMyDataButton,
} from "./export-button";
export type {
  ExportButtonProps,
  ExportCsvButtonProps,
  ExportMyDataButtonProps,
} from "./export-button";

// Radio
export { Radio, RadioGroup } from "./radio";
export type { RadioProps, RadioGroupProps, RadioOption } from "./radio";

// Switch
export { Switch } from "./switch";
export type { SwitchProps } from "./switch";

// Dialog
export {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "./dialog";
export type {
  DialogProps,
  DialogHeaderProps,
  DialogBodyProps,
  DialogFooterProps,
  DialogSize,
} from "./dialog";

// Tabs
export { Tabs, TabList, Tab, TabPanels, TabPanel } from "./tabs";
export type {
  TabsProps,
  TabListProps,
  TabProps,
  TabPanelsProps,
  TabPanelProps,
} from "./tabs";

// Autocomplete
export { Autocomplete } from "./autocomplete";
export type { AutocompleteProps, AutocompleteOption } from "./autocomplete";

// TagInput
export { TagInput } from "./tag-input";
export type { TagInputProps } from "./tag-input";

// QRCode
export { QRCode } from "./qr-code";
export type { QRCodeProps, ErrorCorrectionLevel, DownloadFormat } from "./qr-code";

// =====================================================
// Layout Components
// =====================================================

// Container
export { Container } from "./layouts/container";
export type {
  ContainerProps,
  ContainerSize,
  ContainerPadding,
  ContainerElement,
} from "./layouts/container";

// Stack
export { Stack } from "./layouts/stack";
export type {
  StackProps,
  SpacingValue,
  DirectionValue,
  AlignValue,
  JustifyValue,
} from "./layouts/stack";

// AuthLayout
export { AuthLayout, BackgroundPattern } from "./layouts/auth-layout";
export type {
  AuthLayoutProps,
  MaxWidth as AuthLayoutMaxWidth,
} from "./layouts/auth-layout";

// PageLayout
export {
  PageLayout,
  SidebarToggle,
  usePageLayoutContext,
} from "./layouts/page-layout";
export type {
  PageLayoutProps,
  SidebarPosition,
  SidebarToggleProps,
  PageLayoutContextValue,
} from "./layouts/page-layout";

// Grid
export { Grid, GridItem } from "./layouts/grid";
export type {
  GridProps,
  GridItemProps,
  ResponsiveValue,
  GapSize,
  AlignItems,
  JustifyItems,
} from "./layouts/grid";
