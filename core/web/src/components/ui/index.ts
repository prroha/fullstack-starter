// =====================================================
// UI Component Library - Atomic Design Structure
// =====================================================
//
// This file exports all UI components organized by atomic design principles:
//
// ATOMS (Basic building blocks - single HTML elements with styling)
//   - Button, Input, Textarea, Checkbox, Radio, Select, Switch
//   - Badge, Spinner, Skeleton, Label, Icon, AppLink, Kbd, Text, Divider
//   - VisuallyHidden, Card (with Header, Title, Description, Content, Footer)
//   - Table (with Header, Body, Footer, Row, Head, Cell, Caption)
//
// MOLECULES (Combinations of atoms forming simple functional units)
//   - Avatar, NavLink, IconButton, MenuItem, FieldWrapper, StatusBadge
//   - ThemeToggle, ThemeSelector, PasswordStrengthMeter
//   - ConfirmButton, ExportButton, Autocomplete, TagInput, QRCode, AvatarUpload
//
// ORGANISMS (Complex components with multiple molecules/atoms)
//   - Dialog (with Header, Body, Footer), Modal (simplified Dialog wrapper)
//   - Tabs (with TabList, Tab, TabPanels, TabPanel)
//   - Accordion (with Item, Trigger, Content)
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

// TagInput - Multi-value tag input
export { TagInput } from "./tag-input";
export type { TagInputProps } from "./tag-input";

// QRCode - QR code generator
export { QRCode } from "./qr-code";
export type { QRCodeProps, ErrorCorrectionLevel, DownloadFormat } from "./qr-code";

// AvatarUpload - Avatar with upload capability
export { AvatarUpload } from "./avatar-upload";

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
export { SplitLayout } from "./layouts/split-layout";
