// =====================================================
// UI Component Library - Atomic Design Structure
// =====================================================
//
// This file exports all UI components organized by atomic design principles:
//
// ATOMS (Basic building blocks - single HTML elements with styling)
//   - Button, Input, Textarea, Checkbox, Radio, Select, Switch, Slider, Rating, NumberInput
//   - Badge, Spinner, Skeleton, Progress, Label, Icon, AppLink, Kbd, Text, Divider
//   - VisuallyHidden, Card (with Header, Title, Description, Content, Footer)
//   - Table (with Header, Body, Footer, Row, Head, Cell, Caption)
//
// MOLECULES (Combinations of atoms forming simple functional units)
//   - Avatar, NavLink, IconButton, MenuItem, FieldWrapper, StatusBadge
//   - ThemeToggle, ThemeSelector, PasswordStrengthMeter
//   - ConfirmButton, ExportButton, Autocomplete, TagInput, QRCode, AvatarUpload
//   - CopyButton, CopyableText, StatCard
//
// ORGANISMS (Complex components with multiple molecules/atoms)
//   - Dialog (with Header, Body, Footer), Modal (simplified Dialog wrapper)
//   - Tabs (with TabList, Tab, TabPanels, TabPanel)
//   - Accordion (with Item, Trigger, Content)
//   - Tooltip (hover-triggered overlay with positioning and arrow)
//   - Popover (click-triggered overlay with Header, Footer, Close)
//   - Timeline (with TimelineItem), Collapsible (with Trigger, Content)
//   - DropdownMenu (trigger, items, submenus, keyboard navigation)
//   - Pagination (page numbers, ellipsis, size selector)
//   - Breadcrumb (navigation path with separators)
//   - Stepper (multi-step workflow navigation)
//
// LAYOUTS (Structural components for page composition)
//   - Container, Stack, Grid, PageLayout, AuthLayout
//   - DashboardLayout, SplitLayout
//
// Import examples:
//   import { Button, Input, Dialog } from "@/components/ui";
//   import { Button } from "@/components/ui/button";
//
// =====================================================

// =============================================================================
// ATOMS - Basic Building Blocks
// =============================================================================
// Atoms are the smallest components - single HTML elements with consistent
// styling. They have no dependencies on other components.

// Button - Primary action element
export { Button } from "./button";
export type { ButtonProps } from "./button";

// Input - Text input field
export { Input } from "./input";
export type { InputProps } from "./input";

// Textarea - Multi-line text input
export { Textarea } from "./textarea";
export type { TextareaProps } from "./textarea";

// Checkbox - Boolean toggle with label
export { Checkbox } from "./checkbox";
export type { CheckboxProps } from "./checkbox";

// Radio - Single selection from options
export { Radio, RadioGroup } from "./radio";
export type { RadioProps, RadioGroupProps, RadioOption } from "./radio";

// Select - Dropdown selection
export { Select } from "./select";
export type { SelectProps, SelectOption } from "./select";

// Switch - Toggle switch
export { Switch } from "./switch";
export type { SwitchProps } from "./switch";

// Slider - Range slider input
export { Slider } from "./slider";
export type {
  SliderProps,
  SliderSize,
  SliderColor,
  SliderOrientation,
  SliderMark,
} from "./slider";

// Rating - Star rating input
export { Rating } from "./rating";
export type { RatingProps, RatingSize } from "./rating";

// NumberInput - Numeric input with increment/decrement
export { NumberInput } from "./number-input";
export type { NumberInputProps, NumberInputSize } from "./number-input";

// Badge - Status/label indicator
export { Badge } from "./badge";
export type { BadgeProps } from "./badge";

// Spinner - Loading indicator
export { Spinner, SpinnerOverlay } from "./spinner";
export type { SpinnerProps, SpinnerOverlayProps } from "./spinner";

// Skeleton - Loading placeholders
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

// Progress - Progress indicators (linear and circular)
export { Progress, LinearProgress, CircularProgress } from "./progress";
export type {
  ProgressProps,
  LinearProgressProps,
  CircularProgressProps,
  ProgressSize,
  ProgressColor,
  ProgressVariant,
} from "./progress";

// Label - Form field label
export { Label } from "./label";
export type { LabelProps } from "./label";

// Icon - Lucide icon wrapper
export { Icon } from "./icon";
export type { IconProps, IconName, IconSize, IconColor } from "./icon";

// AppLink - Internal/external link
export { AppLink } from "./link";
export type { AppLinkProps } from "./link";

// Text - Typography component
export { Text } from "./text";
export type {
  TextProps,
  TextVariant,
  TextSize,
  TextColor,
  TextElement,
} from "./text";

// Divider - Visual separator
export { Divider } from "./divider";
export type {
  DividerProps,
  DividerOrientation,
  DividerVariant,
} from "./divider";

// Kbd - Keyboard key indicator
export { Kbd } from "./kbd";
export type { KbdProps } from "./kbd";

// VisuallyHidden - Screen reader only content
export { VisuallyHidden } from "./visually-hidden";
export type { VisuallyHiddenProps } from "./visually-hidden";

// Card - Container with border, shadow, and rounded corners
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./card";
export type {
  CardProps,
  CardVariant,
  CardHeaderProps,
  CardTitleProps,
  CardDescriptionProps,
  CardContentProps,
  CardFooterProps,
} from "./card";

// Table - Data table components
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "./table";
export type {
  TableProps,
  TableHeaderProps,
  TableBodyProps,
  TableFooterProps,
  TableRowProps,
  TableHeadProps,
  TableCellProps,
  TableCaptionProps,
} from "./table";

// DataTable - Reusable data table with loading/empty states
export { DataTable } from "./data-table";
export type { DataTableProps, Column as DataTableColumn } from "./data-table";

// =============================================================================
// MOLECULES - Simple Combinations of Atoms
// =============================================================================
// Molecules are groups of atoms bonded together to form a functional unit.
// They have a single purpose and are relatively simple.

// Avatar - User avatar with fallback (Image + Initials)
export { Avatar } from "./avatar";
export type { AvatarProps, AvatarSize, AvatarStatus } from "./avatar";

// NavLink - Navigation link with active state (AppLink + Icon)
export { NavLink } from "./nav-link";
export type { NavLinkProps, NavLinkVariant } from "./nav-link";

// IconButton - Button with icon only (Button + Icon)
export { IconButton } from "./icon-button";
export type { IconButtonProps, IconButtonVariant, IconButtonSize } from "./icon-button";

// MenuItem - Menu action item (Button + Icon + Kbd)
export { MenuItem } from "./menu-item";
export type { MenuItemProps } from "./menu-item";

// FieldWrapper - Form field with label and error (Label + Input wrapper)
export { FieldWrapper } from "./field-wrapper";
export type { FieldWrapperProps } from "./field-wrapper";

// StatusBadge - Status indicator badge (Badge + Dot)
export { StatusBadge } from "./status-badge";
export type { StatusBadgeProps, StatusType } from "./status-badge";

// ThemeToggle - Dark/light mode switch (Icon + Button)
export { ThemeToggle } from "./theme-toggle";
export type {
  ThemeToggleProps,
  ThemeToggleVariant,
  ThemeToggleSize,
} from "./theme-toggle";

// ThemeSelector - Theme dropdown selector
export { ThemeSelector } from "./theme-selector";
export type {
  ThemeSelectorProps,
  ThemeSelectorVariant,
  ThemeSelectorSize,
} from "./theme-selector";

// PasswordStrengthMeter - Password validation indicator
export { PasswordStrengthMeter } from "./password-strength";
export type {
  PasswordStrengthMeterProps,
  PasswordStrength,
  PasswordRequirement,
} from "./password-strength";

// ConfirmButton - Button with confirmation dialog
export { ConfirmButton } from "./confirm-button";
export type { ConfirmButtonProps, ConfirmMode } from "./confirm-button";

// ExportButton - Download/export actions
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

// Autocomplete - Search input with suggestions
export { Autocomplete } from "./autocomplete";
export type { AutocompleteProps, AutocompleteOption } from "./autocomplete";

// SearchInput - Search input with debounce and loading state
export { SearchInput } from "./search-input";
export type { SearchInputProps, SearchInputSize } from "./search-input";

// CommandPalette - Command palette with fuzzy search
export { CommandPalette, useCommandPalette } from "./command-palette";
export type {
  CommandPaletteProps,
  CommandItem,
  CommandGroup,
} from "./command-palette";

// TagInput - Multi-value tag input
export { TagInput } from "./tag-input";
export type { TagInputProps } from "./tag-input";

// QRCode - QR code generator
export { QRCode } from "./qr-code";
export type { QRCodeProps, ErrorCorrectionLevel, DownloadFormat } from "./qr-code";

// AvatarUpload - Avatar with upload capability
export { AvatarUpload } from "./avatar-upload";

// CopyButton - Copy text to clipboard
export { CopyButton, CopyableText } from "./copy-button";
export type {
  CopyButtonProps,
  CopyButtonSize,
  CopyButtonVariant,
  CopyableTextProps,
} from "./copy-button";

// StatCard - Statistics display card
export { StatCard, StatCardSkeleton } from "./stat-card";
export type {
  StatCardProps,
  StatCardVariant,
  StatCardSize,
  TrendDirection,
} from "./stat-card";

// RichTextEditor - WYSIWYG rich text editor with formatting toolbar
export { RichTextEditor } from "./rich-text-editor";
export type { RichTextEditorProps, RichTextEditorSize } from "./rich-text-editor";

// DatePicker - Calendar dropdown for date selection
export { DatePicker, formatDate, isSameDay, isToday } from "./date-picker";
export type { DatePickerProps, DatePickerSize } from "./date-picker";

// TimePicker - Time selection dropdown
export { TimePicker, formatTime, timeToMinutes, isTimeInRange } from "./time-picker";
export type {
  TimePickerProps,
  TimePickerSize,
  TimeFormat,
  TimeValue,
} from "./time-picker";

// =============================================================================
// ORGANISMS - Complex UI Patterns
// =============================================================================
// Organisms are complex UI patterns composed of groups of molecules and/or atoms.
// They form distinct sections of an interface with their own behavior.

// Dialog - Modal dialog with sections
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

// Modal - Simplified dialog wrapper for common modal use cases
export { Modal } from "./modal";
export type { ModalProps, ModalSize } from "./modal";

// Tabs - Tabbed content navigation
export { Tabs, TabList, Tab, TabPanels, TabPanel } from "./tabs";
export type {
  TabsProps,
  TabListProps,
  TabProps,
  TabPanelsProps,
  TabPanelProps,
} from "./tabs";

// Accordion - Expandable content sections
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

// Stepper - Multi-step workflow navigation
export {
  Stepper,
  Step,
  StepIndicator,
  StepLabel,
  StepConnector,
  useStepperContext,
} from "./stepper";
export type {
  StepperProps,
  StepProps,
  StepperContextValue,
  Step as StepConfig,
  StepState,
  StepperOrientation,
} from "./stepper";

// Timeline - Vertical timeline display
export { Timeline, TimelineItem } from "./timeline";
export type {
  TimelineProps,
  TimelineItemProps,
  TimelineItemData,
  TimelineStatus,
  TimelineSize,
} from "./timeline";

// Collapsible - Expandable/collapsible content
export {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  useCollapsibleContext,
} from "./collapsible";
export type {
  CollapsibleProps,
  CollapsibleTriggerProps,
  CollapsibleContentProps,
} from "./collapsible";

// DropdownMenu - Dropdown menu with keyboard navigation
export { DropdownMenu } from "./dropdown-menu";
export type {
  DropdownMenuProps,
  DropdownMenuItem,
  DropdownMenuDivider,
  DropdownMenuGroup,
  DropdownMenuContent,
  DropdownMenuPosition,
} from "./dropdown-menu";

// Pagination - Page navigation with ellipsis and size selector
export { Pagination } from "./pagination";
export type { PaginationProps, PaginationSize } from "./pagination";

// Breadcrumb - Navigation breadcrumb with separators
export { Breadcrumb } from "./breadcrumb";
export type {
  BreadcrumbProps,
  BreadcrumbItem,
  BreadcrumbSeparator,
} from "./breadcrumb";

// Tooltip - Hover-triggered overlay with positioning and arrow
export { Tooltip, TooltipTrigger } from "./tooltip";
export type {
  TooltipProps,
  TooltipPosition,
  TooltipVariant,
  TooltipTriggerProps,
} from "./tooltip";

// Popover - Click-triggered overlay with content sections
export {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverFooter,
  PopoverClose,
} from "./popover";
export type {
  PopoverProps,
  PopoverPosition,
  PopoverAlignment,
  PopoverContentProps,
  PopoverHeaderProps,
  PopoverFooterProps,
  PopoverCloseProps,
} from "./popover";

// =============================================================================
// LAYOUTS - Page Structure Components
// =============================================================================
// Layouts are structural components that define the arrangement of other
// components on a page. They handle spacing, alignment, and responsive behavior.

// Container - Centered content wrapper
export { Container } from "./layouts/container";
export type {
  ContainerProps,
  ContainerSize,
  ContainerPadding,
  ContainerElement,
} from "./layouts/container";

// Stack - Vertical/horizontal flex container
export { Stack } from "./layouts/stack";
export type {
  StackProps,
  SpacingValue,
  DirectionValue,
  AlignValue,
  JustifyValue,
} from "./layouts/stack";

// Grid - Responsive grid layout
export { Grid, GridItem } from "./layouts/grid";
export type {
  GridProps,
  GridItemProps,
  ResponsiveValue,
  GapSize,
  AlignItems,
  JustifyItems,
} from "./layouts/grid";

// AuthLayout - Authentication page layout
export { AuthLayout, BackgroundPattern } from "./layouts/auth-layout";
export type {
  AuthLayoutProps,
  MaxWidth as AuthLayoutMaxWidth,
} from "./layouts/auth-layout";

// PageLayout - Standard page with optional sidebar
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

// DashboardLayout - Admin/dashboard layout
export {
  DashboardLayout,
  DashboardSidebar,
  DashboardNavItem,
  DashboardHeader,
} from "./layouts/dashboard-layout";
export type {
  DashboardLayoutProps,
  DashboardSidebarProps,
  DashboardNavItemProps,
  DashboardHeaderProps,
} from "./layouts/dashboard-layout";

// SplitLayout - Two-panel layout
export { SplitLayout, ResizableSplitLayout } from "./layouts/split-layout";
export type {
  SplitLayoutProps,
  ResizableSplitLayoutProps,
  SplitRatio,
  MobileBreakpoint,
} from "./layouts/split-layout";
