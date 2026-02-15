"use client";

import { useState } from "react";
import {
  Button,
  Badge,
  Select,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Avatar,
  SearchInput,
  StatCard,
  DatePicker,
  Dialog,
  DialogBody,
  DialogFooter,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  DropdownMenu,
  Input,
  Textarea,
  Checkbox,
  RadioGroup,
  Switch,
  Slider,
  Rating,
  NumberInput,
  Label,
  FieldWrapper,
  PasswordStrengthMeter,
  Autocomplete,
  TagInput,
  TimePicker,
  RichTextEditor,
  Spinner,
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
  Progress,
  LinearProgress,
  CircularProgress,
  Icon,
  AppLink,
  Text,
  Divider,
  Kbd,
  VisuallyHidden,
  DataTable,
  NavLink,
  IconButton,
  MenuItem,
  StatusBadge,
  ThemeToggle,
  ConfirmButton,
  ExportButton,
  CommandPalette,
  QRCode,
  CopyButton,
  CopyableText,
  StatCardSkeleton,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Tooltip,
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverFooter,
  PopoverClose,
  Stepper,
  Timeline,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  Pagination,
  Breadcrumb,
  Modal,
  SpinnerOverlay,
  ThemeSelector,
  AvatarUpload,
  Container,
  Stack,
  Grid,
  GridItem,
  AuthLayout,
  PageLayout,
  DashboardLayout,
  SplitLayout,
} from "@/components/ui";
import type { DataTableColumn } from "@/components/ui";
import {
  TrendingUp,
  Users,
  DollarSign,
  ShoppingCart,
  MoreHorizontal,
  Settings,
  User,
  LogOut,
  Edit,
  Trash2,
  House,
  Search,
  Bell,
  Copy,
  Download,
  Info,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Individual preview components
// ---------------------------------------------------------------------------

function ButtonPreview() {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-wrap items-center gap-3">
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="link">Link</Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button isLoading>Loading</Button>
        <Button disabled>Disabled</Button>
      </div>
    </div>
  );
}

function BadgePreview() {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-wrap items-center gap-3">
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="outline">Outline</Badge>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Badge size="sm">Small</Badge>
        <Badge size="default">Default</Badge>
        <Badge size="lg">Large</Badge>
      </div>
    </div>
  );
}

function SelectPreview() {
  const [value, setValue] = useState("");
  return (
    <div className="w-full max-w-xs">
      <Select
        label="Country"
        placeholder="Select a country"
        value={value}
        onChange={setValue}
        options={[
          { value: "us", label: "United States" },
          { value: "uk", label: "United Kingdom" },
          { value: "ca", label: "Canada" },
          { value: "de", label: "Germany" },
          { value: "fr", label: "France" },
        ]}
      />
    </div>
  );
}

function CardPreview() {
  return (
    <div className="w-full max-w-sm">
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>
            This is a description of the card content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            Cards are flexible containers for grouping related content and
            actions.
          </p>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" size="sm">
            Cancel
          </Button>
          <Button size="sm">Save</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function TablePreview() {
  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Alice Johnson</TableCell>
            <TableCell>
              <Badge variant="success" size="sm">Active</Badge>
            </TableCell>
            <TableCell>Admin</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Bob Smith</TableCell>
            <TableCell>
              <Badge variant="warning" size="sm">Pending</Badge>
            </TableCell>
            <TableCell>Editor</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Carol Williams</TableCell>
            <TableCell>
              <Badge variant="secondary" size="sm">Inactive</Badge>
            </TableCell>
            <TableCell>Viewer</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

function AvatarPreview() {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center gap-3">
        <Avatar size="xs" name="Alice Johnson" />
        <Avatar size="sm" name="Bob Smith" />
        <Avatar size="md" name="Carol Williams" />
        <Avatar size="lg" name="Dave Brown" />
        <Avatar size="xl" name="Eve Davis" />
      </div>
      <div className="flex items-center gap-3">
        <Avatar size="md" name="Online User" status="online" />
        <Avatar size="md" name="Away User" status="away" />
        <Avatar size="md" name="Busy User" status="busy" />
        <Avatar size="md" name="Offline User" status="offline" />
      </div>
    </div>
  );
}

function SearchInputPreview() {
  return (
    <div className="w-full max-w-md">
      <SearchInput
        placeholder="Search components..."
        shortcutHint="K"
        onChange={() => {}}
      />
    </div>
  );
}

function StatCardPreview() {
  return (
    <div className="grid grid-cols-2 gap-4 w-full">
      <StatCard
        label="Total Revenue"
        value="$45,231"
        change={20.1}
        trend="up"
        icon={<DollarSign className="h-4 w-4" />}
      />
      <StatCard
        label="Users"
        value="2,350"
        change={10.5}
        trend="up"
        icon={<Users className="h-4 w-4" />}
        variant="info"
      />
      <StatCard
        label="Sales"
        value="12,234"
        change={-3.2}
        trend="down"
        icon={<ShoppingCart className="h-4 w-4" />}
        variant="warning"
      />
      <StatCard
        label="Growth"
        value="+573"
        change={8.1}
        trend="up"
        icon={<TrendingUp className="h-4 w-4" />}
        variant="success"
      />
    </div>
  );
}

function DatePickerPreview() {
  const [date, setDate] = useState<Date | null>(null);
  return (
    <div className="w-full max-w-xs">
      <DatePicker
        label="Select a date"
        value={date}
        onChange={setDate}
        placeholder="Pick a date"
      />
    </div>
  );
}

function DialogPreview() {
  const [open, setOpen] = useState(false);
  return (
    <div className="w-full text-center">
      <Button onClick={() => setOpen(true)}>Open Dialog</Button>
      <Dialog isOpen={open} onClose={() => setOpen(false)} title="Confirm Action">
        <DialogBody>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to proceed? This action cannot be undone.
          </p>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setOpen(false)}>Confirm</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

function TabsPreview() {
  return (
    <div className="w-full">
      <Tabs defaultIndex={0}>
        <TabList>
          <Tab>Overview</Tab>
          <Tab>Analytics</Tab>
          <Tab>Settings</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <p className="text-sm text-muted-foreground py-4">
              Overview content goes here. This is the first panel.
            </p>
          </TabPanel>
          <TabPanel>
            <p className="text-sm text-muted-foreground py-4">
              Analytics content goes here. Charts and metrics would appear in this panel.
            </p>
          </TabPanel>
          <TabPanel>
            <p className="text-sm text-muted-foreground py-4">
              Settings content goes here. Configuration options would appear in this panel.
            </p>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
}

function DropdownMenuPreview() {
  return (
    <div className="w-full text-center">
      <DropdownMenu
        trigger={
          <Button variant="outline">
            <MoreHorizontal className="h-4 w-4 mr-2" />
            Options
          </Button>
        }
        content={[
          {
            key: "profile",
            label: "Profile",
            icon: <User className="h-4 w-4" />,
          },
          {
            key: "settings",
            label: "Settings",
            icon: <Settings className="h-4 w-4" />,
          },
          { type: "divider" as const, key: "div-1" },
          {
            key: "logout",
            label: "Log out",
            icon: <LogOut className="h-4 w-4" />,
            destructive: true,
          },
        ]}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form field preview components
// ---------------------------------------------------------------------------

function InputPreview() {
  return (
    <div className="flex flex-col gap-4 w-full max-w-sm">
      <Input placeholder="Default input" />
      <Input type="email" placeholder="Email address" />
      <Input type="password" placeholder="Password" />
      <Input placeholder="Error state" aria-invalid="true" className="border-destructive ring-destructive focus-visible:ring-destructive" />
      <Input placeholder="Disabled" disabled />
    </div>
  );
}

function TextareaPreview() {
  return (
    <div className="flex flex-col gap-4 w-full max-w-sm">
      <Textarea placeholder="Write your message here..." rows={3} />
      <Textarea
        placeholder="With character count"
        showCharacterCount
        maxLength={200}
        rows={3}
      />
      <Textarea placeholder="Error state" aria-invalid="true" className="border-destructive" rows={2} />
      <Textarea placeholder="Disabled" disabled rows={2} />
    </div>
  );
}

function CheckboxPreview() {
  const [checked1, setChecked1] = useState(true);
  const [checked2, setChecked2] = useState(false);
  const [checked3, setChecked3] = useState(false);
  return (
    <div className="flex flex-col gap-4 w-full max-w-sm">
      <Checkbox
        label="Accept terms and conditions"
        checked={checked1}
        onChange={() => setChecked1(!checked1)}
      />
      <Checkbox
        label="Subscribe to newsletter"
        checked={checked2}
        onChange={() => setChecked2(!checked2)}
      />
      <Checkbox
        label="Indeterminate state"
        checked={checked3}
        onChange={() => setChecked3(!checked3)}
        indeterminate
      />
      <Checkbox label="Disabled checkbox" disabled />
      <div className="flex gap-6">
        <Checkbox label="Small" size="sm" />
        <Checkbox label="Medium" size="md" />
        <Checkbox label="Large" size="lg" />
      </div>
    </div>
  );
}

function RadioPreview() {
  const [value, setValue] = useState("email");
  return (
    <div className="w-full max-w-sm">
      <RadioGroup
        name="contact-method"
        label="Preferred contact method"
        value={value}
        onChange={setValue}
        options={[
          { value: "email", label: "Email" },
          { value: "phone", label: "Phone" },
          { value: "sms", label: "SMS" },
        ]}
      />
    </div>
  );
}

function SwitchPreview() {
  const [enabled1, setEnabled1] = useState(true);
  const [enabled2, setEnabled2] = useState(false);
  const [enabled3, setEnabled3] = useState(true);
  return (
    <div className="flex flex-col gap-4 w-full max-w-sm">
      <Switch
        label="Email notifications"
        checked={enabled1}
        onChange={setEnabled1}
      />
      <Switch
        label="Dark mode"
        checked={enabled2}
        onChange={setEnabled2}
      />
      <Switch
        label="Auto-save"
        checked={enabled3}
        onChange={setEnabled3}
      />
      <Switch label="Disabled" disabled />
      <div className="flex gap-6">
        <Switch label="Sm" size="sm" />
        <Switch label="Md" size="md" />
        <Switch label="Lg" size="lg" />
      </div>
    </div>
  );
}

function SliderPreview() {
  const [value, setValue] = useState(40);
  const [range, setRange] = useState<[number, number]>([20, 80]);
  return (
    <div className="flex flex-col gap-6 w-full max-w-sm">
      <div>
        <Label>Volume: {value}%</Label>
        <Slider value={value} onChange={setValue} aria-label="Volume" />
      </div>
      <div>
        <Label>Price range: ${range[0]} – ${range[1]}</Label>
        <Slider
          range
          values={range}
          onRangeChange={setRange}
          aria-label="Price range"
          aria-label-start="Min price"
          aria-label-end="Max price"
        />
      </div>
      <div>
        <Label>With marks</Label>
        <Slider
          defaultValue={50}
          marks={[
            { value: 0, label: "0" },
            { value: 25, label: "25" },
            { value: 50, label: "50" },
            { value: 75, label: "75" },
            { value: 100, label: "100" },
          ]}
          aria-label="Marked slider"
        />
      </div>
    </div>
  );
}

function RatingPreview() {
  const [value, setValue] = useState(3);
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center gap-3">
        <Rating value={value} onChange={setValue} showValue />
      </div>
      <div className="flex items-center gap-3">
        <Rating value={4.5} readOnly allowHalf showValue />
      </div>
      <div className="flex items-center gap-6">
        <Rating value={3} readOnly size="sm" />
        <Rating value={3} readOnly size="md" />
        <Rating value={3} readOnly size="lg" />
      </div>
    </div>
  );
}

function NumberInputPreview() {
  const [qty, setQty] = useState<number | undefined>(1);
  const [price, setPrice] = useState<number | undefined>(29.99);
  return (
    <div className="flex flex-col gap-4 w-full max-w-xs">
      <NumberInput
        value={qty}
        onChange={setQty}
        min={0}
        max={100}
        aria-label="Quantity"
        placeholder="Quantity"
      />
      <NumberInput
        value={price}
        onChange={setPrice}
        min={0}
        step={0.01}
        precision={2}
        prefix="$"
        aria-label="Price"
        placeholder="Price"
      />
      <NumberInput
        defaultValue={50}
        suffix="%"
        min={0}
        max={100}
        aria-label="Percentage"
        placeholder="Percentage"
      />
    </div>
  );
}

function LabelPreview() {
  return (
    <div className="flex flex-col gap-4 w-full max-w-sm">
      <Label>Default label</Label>
      <Label required>Required label</Label>
      <Label disabled>Disabled label</Label>
      <div>
        <Label htmlFor="label-demo">Label with input</Label>
        <Input id="label-demo" placeholder="Associated input" />
      </div>
    </div>
  );
}

function FieldWrapperPreview() {
  return (
    <div className="flex flex-col gap-4 w-full max-w-sm">
      <FieldWrapper label="Email" htmlFor="fw-email" required hint="We'll never share your email.">
        <Input id="fw-email" type="email" placeholder="you@example.com" />
      </FieldWrapper>
      <FieldWrapper label="Username" htmlFor="fw-user" error="Username is already taken.">
        <Input id="fw-user" placeholder="johndoe" aria-invalid="true" className="border-destructive" />
      </FieldWrapper>
    </div>
  );
}

function PasswordStrengthPreview() {
  const [password, setPassword] = useState("Hello1");
  return (
    <div className="flex flex-col gap-3 w-full max-w-sm">
      <Label htmlFor="pw-demo">Password</Label>
      <Input
        id="pw-demo"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter a password"
      />
      <PasswordStrengthMeter password={password} />
    </div>
  );
}

function AutocompletePreview() {
  const [value, setValue] = useState("");
  return (
    <div className="w-full max-w-sm">
      <Autocomplete
        label="Framework"
        placeholder="Search frameworks..."
        value={value}
        onChange={setValue}
        clearable
        options={[
          { value: "react", label: "React" },
          { value: "vue", label: "Vue" },
          { value: "angular", label: "Angular" },
          { value: "svelte", label: "Svelte" },
          { value: "nextjs", label: "Next.js" },
          { value: "nuxt", label: "Nuxt" },
        ]}
      />
    </div>
  );
}

function TagInputPreview() {
  const [tags, setTags] = useState(["React", "TypeScript"]);
  return (
    <div className="w-full max-w-sm">
      <TagInput
        label="Skills"
        value={tags}
        onChange={setTags}
        placeholder="Add a skill..."
        maxTags={6}
      />
    </div>
  );
}

function TimePickerPreview() {
  const [time, setTime] = useState<{ hours: number; minutes: number } | null>({
    hours: 9,
    minutes: 30,
  });
  return (
    <div className="w-full max-w-xs">
      <TimePicker
        label="Meeting time"
        value={time}
        onChange={setTime}
        placeholder="Select a time"
      />
    </div>
  );
}

function RichTextEditorPreview() {
  const [html, setHtml] = useState(
    "<p>This is a <strong>rich text</strong> editor with <em>formatting</em> support.</p>"
  );
  return (
    <div className="w-full">
      <RichTextEditor
        value={html}
        onChange={setHtml}
        placeholder="Start typing..."
        showWordCount
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Remaining atom preview components
// ---------------------------------------------------------------------------

function SpinnerPreview() {
  return (
    <div className="flex flex-col gap-6 w-full items-center">
      <div className="flex items-end gap-6">
        <div className="flex flex-col items-center gap-2">
          <Spinner size="sm" />
          <Text size="xs" color="muted">Small</Text>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Spinner size="md" />
          <Text size="xs" color="muted">Medium</Text>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Spinner size="lg" />
          <Text size="xs" color="muted">Large</Text>
        </div>
      </div>
    </div>
  );
}

function SkeletonPreview() {
  return (
    <div className="flex flex-col gap-4 w-full">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex items-center gap-3 mt-2">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}

function SkeletonTextPreview() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <Text size="xs" color="muted" className="mb-2">1 line</Text>
        <SkeletonText lines={1} />
      </div>
      <div>
        <Text size="xs" color="muted" className="mb-2">3 lines</Text>
        <SkeletonText lines={3} />
      </div>
      <div>
        <Text size="xs" color="muted" className="mb-2">5 lines (lg gap)</Text>
        <SkeletonText lines={5} gap="lg" />
      </div>
    </div>
  );
}

function SkeletonCirclePreview() {
  return (
    <div className="flex items-end gap-4 w-full justify-center">
      <SkeletonCircle className="h-6 w-6" />
      <SkeletonCircle className="h-8 w-8" />
      <SkeletonCircle className="h-10 w-10" />
      <SkeletonCircle className="h-12 w-12" />
      <SkeletonCircle className="h-16 w-16" />
    </div>
  );
}

function SkeletonCardPreview() {
  return (
    <div className="grid grid-cols-2 gap-4 w-full">
      <SkeletonCard variant="default" />
      <SkeletonCard variant="compact" />
    </div>
  );
}

function SkeletonAvatarPreview() {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center gap-4">
        <SkeletonAvatar size="sm" />
        <SkeletonAvatar size="md" />
        <SkeletonAvatar size="lg" />
        <SkeletonAvatar size="xl" />
      </div>
      <SkeletonAvatar size="md" withText />
    </div>
  );
}

function SkeletonButtonPreview() {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center gap-3">
        <SkeletonButton size="sm" />
        <SkeletonButton size="md" />
        <SkeletonButton size="lg" />
      </div>
      <SkeletonButton size="md" width="full" />
    </div>
  );
}

function SkeletonImagePreview() {
  return (
    <div className="grid grid-cols-2 gap-4 w-full">
      <SkeletonImage aspectRatio="square" />
      <SkeletonImage aspectRatio="video" />
    </div>
  );
}

function SkeletonTablePreview() {
  return (
    <div className="w-full">
      <SkeletonTable rows={3} columns={3} />
    </div>
  );
}

function SkeletonListPreview() {
  return (
    <div className="w-full">
      <SkeletonList items={4} variant="default" />
    </div>
  );
}

function SkeletonPagePreview() {
  return (
    <div className="w-full max-h-[300px] overflow-hidden rounded border">
      <SkeletonPage />
    </div>
  );
}

function SkeletonDashboardPreview() {
  return (
    <div className="w-full max-h-[300px] overflow-hidden rounded border">
      <SkeletonDashboard />
    </div>
  );
}

function SkeletonFormPreview() {
  return (
    <div className="w-full max-h-[300px] overflow-hidden rounded border">
      <SkeletonForm />
    </div>
  );
}

function SkeletonProfilePreview() {
  return (
    <div className="w-full max-h-[300px] overflow-hidden rounded border">
      <SkeletonProfile />
    </div>
  );
}

function SkeletonAuthPreview() {
  return (
    <div className="w-full max-h-[300px] overflow-hidden rounded border">
      <SkeletonAuth />
    </div>
  );
}

function ProgressPreview() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-sm">
      <div>
        <Text size="xs" color="muted" className="mb-2">Default (65%)</Text>
        <Progress value={65} showLabel />
      </div>
      <div>
        <Text size="xs" color="muted" className="mb-2">Success (100%)</Text>
        <Progress value={100} color="success" showLabel />
      </div>
      <div>
        <Text size="xs" color="muted" className="mb-2">Warning (40%)</Text>
        <Progress value={40} color="warning" showLabel />
      </div>
      <div>
        <Text size="xs" color="muted" className="mb-2">Indeterminate</Text>
        <Progress />
      </div>
    </div>
  );
}

function LinearProgressPreview() {
  return (
    <div className="flex flex-col gap-4 w-full max-w-sm">
      <LinearProgress value={25} size="sm" />
      <LinearProgress value={50} size="md" showLabel />
      <LinearProgress value={75} size="lg" color="success" showLabel />
      <LinearProgress color="warning" />
    </div>
  );
}

function CircularProgressPreview() {
  return (
    <div className="flex items-end gap-6 w-full justify-center">
      <CircularProgress value={25} size="sm" />
      <CircularProgress value={50} size="md" showLabel />
      <CircularProgress value={75} size="lg" color="success" showLabel />
      <CircularProgress size="md" />
    </div>
  );
}

function IconPreview() {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-end gap-4">
        <Icon name="House" size="xs" />
        <Icon name="House" size="sm" />
        <Icon name="House" size="md" />
        <Icon name="House" size="lg" />
        <Icon name="House" size="xl" />
      </div>
      <div className="flex items-center gap-4">
        <Icon name="Star" color="default" />
        <Icon name="Star" color="muted" />
        <Icon name="Star" color="primary" />
        <Icon name="Star" color="success" />
        <Icon name="Star" color="warning" />
        <Icon name="Star" color="destructive" />
      </div>
      <div className="flex items-center gap-4">
        <Icon name="Settings" />
        <Icon name="Bell" />
        <Icon name="Search" />
        <Icon name="Heart" />
        <Icon name="Download" />
        <Icon name="ChevronRight" />
      </div>
    </div>
  );
}

function AppLinkPreview() {
  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex flex-wrap items-center gap-4">
        <AppLink href="#" variant="default">Default link</AppLink>
        <AppLink href="#" variant="primary">Primary link</AppLink>
        <AppLink href="#" variant="muted">Muted link</AppLink>
        <AppLink href="#" variant="destructive">Destructive link</AppLink>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <AppLink href="#" underline="always">Always underline</AppLink>
        <AppLink href="#" underline="hover">Hover underline</AppLink>
        <AppLink href="#" underline="none">No underline</AppLink>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <AppLink href="#" size="sm">Small</AppLink>
        <AppLink href="#" size="md">Medium</AppLink>
        <AppLink href="#" size="lg">Large</AppLink>
      </div>
      <AppLink href="https://example.com" external>External link</AppLink>
    </div>
  );
}

function TextPreview() {
  return (
    <div className="flex flex-col gap-3 w-full">
      <Text variant="body" size="lg">Body large text</Text>
      <Text variant="body" size="md">Body medium text — the default</Text>
      <Text variant="body" size="sm">Body small text</Text>
      <Text variant="caption" color="muted">Caption text — secondary information</Text>
      <Text variant="overline">Overline text</Text>
      <Text variant="code">const x = 42;</Text>
      <div className="flex gap-4">
        <Text color="primary">Primary</Text>
        <Text color="muted">Muted</Text>
        <Text color="destructive">Destructive</Text>
      </div>
    </div>
  );
}

function DividerPreview() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <Text size="xs" color="muted" className="mb-2">Solid</Text>
        <Divider />
      </div>
      <div>
        <Text size="xs" color="muted" className="mb-2">Dashed</Text>
        <Divider variant="dashed" />
      </div>
      <div>
        <Text size="xs" color="muted" className="mb-2">With label</Text>
        <Divider label="OR" />
      </div>
      <div>
        <Text size="xs" color="muted" className="mb-2">Vertical</Text>
        <div className="flex items-center gap-4 h-8">
          <span className="text-sm">Left</span>
          <Divider orientation="vertical" />
          <span className="text-sm">Center</span>
          <Divider orientation="vertical" />
          <span className="text-sm">Right</span>
        </div>
      </div>
    </div>
  );
}

function KbdPreview() {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-wrap items-center gap-2">
        <Kbd>⌘</Kbd>
        <Kbd>Shift</Kbd>
        <Kbd>Alt</Kbd>
        <Kbd>Ctrl</Kbd>
        <Kbd>Enter</Kbd>
        <Kbd>Esc</Kbd>
      </div>
      <div className="flex items-center gap-1 text-sm">
        <span>Press</span>
        <Kbd>⌘</Kbd>
        <span>+</span>
        <Kbd>K</Kbd>
        <span>to open the command palette</span>
      </div>
      <div className="flex items-center gap-1 text-sm">
        <span>Save with</span>
        <Kbd>Ctrl</Kbd>
        <span>+</span>
        <Kbd>S</Kbd>
      </div>
    </div>
  );
}

function VisuallyHiddenPreview() {
  return (
    <div className="flex flex-col gap-3 w-full text-center">
      <Text color="muted" size="sm">
        The VisuallyHidden component renders content only for screen readers.
      </Text>
      <div className="flex items-center justify-center gap-2">
        <Button variant="outline" size="icon" aria-label="Settings">
          <Settings className="h-4 w-4" />
          <VisuallyHidden>Open settings</VisuallyHidden>
        </Button>
        <Text size="sm" color="muted">
          This button contains visually hidden text: &quot;Open settings&quot;
        </Text>
      </div>
    </div>
  );
}

interface SampleUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

const sampleUsers: SampleUser[] = [
  { id: "1", name: "Alice Johnson", email: "alice@example.com", role: "Admin" },
  { id: "2", name: "Bob Smith", email: "bob@example.com", role: "Editor" },
  { id: "3", name: "Carol Williams", email: "carol@example.com", role: "Viewer" },
];

const sampleColumns: DataTableColumn<SampleUser>[] = [
  { key: "name", header: "Name", render: (u) => u.name },
  { key: "email", header: "Email", render: (u) => u.email },
  {
    key: "role",
    header: "Role",
    render: (u) => (
      <Badge variant={u.role === "Admin" ? "default" : "secondary"} size="sm">
        {u.role}
      </Badge>
    ),
  },
];

function DataTablePreview() {
  return (
    <div className="w-full">
      <DataTable
        columns={sampleColumns}
        data={sampleUsers}
        keyExtractor={(u) => u.id}
        itemLabel="users"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Molecule preview components
// ---------------------------------------------------------------------------

function NavLinkPreview() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <Text size="xs" color="muted" className="mb-2">Sidebar variant</Text>
        <div className="flex flex-col gap-1 w-56 border rounded-lg p-2 bg-card">
          <NavLink href="/showcase" label="Showcase" icon={<House className="h-4 w-4" />} variant="sidebar" exact />
          <NavLink href="/showcase/molecules" label="Molecules" icon={<Search className="h-4 w-4" />} variant="sidebar" />
          <NavLink href="/nowhere" label="Settings" icon={<Settings className="h-4 w-4" />} variant="sidebar" />
        </div>
      </div>
      <div>
        <Text size="xs" color="muted" className="mb-2">Top nav variant</Text>
        <div className="flex gap-4 border-b pb-2">
          <NavLink href="/showcase" label="Showcase" variant="topnav" exact />
          <NavLink href="/showcase/molecules" label="Molecules" variant="topnav" />
          <NavLink href="/nowhere" label="Settings" variant="topnav" />
        </div>
      </div>
    </div>
  );
}

function IconButtonPreview() {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-wrap items-center gap-3">
        <IconButton icon={<Edit className="h-4 w-4" />} aria-label="Edit" variant="default" />
        <IconButton icon={<Settings className="h-4 w-4" />} aria-label="Settings" variant="secondary" />
        <IconButton icon={<Copy className="h-4 w-4" />} aria-label="Copy" variant="outline" />
        <IconButton icon={<Search className="h-4 w-4" />} aria-label="Search" variant="ghost" />
        <IconButton icon={<Trash2 className="h-4 w-4" />} aria-label="Delete" variant="destructive" />
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <IconButton icon={<Settings className="h-3 w-3" />} aria-label="XS" size="xs" variant="outline" />
        <IconButton icon={<Settings className="h-4 w-4" />} aria-label="SM" size="sm" variant="outline" />
        <IconButton icon={<Settings className="h-4 w-4" />} aria-label="MD" size="md" variant="outline" />
        <IconButton icon={<Settings className="h-5 w-5" />} aria-label="LG" size="lg" variant="outline" />
      </div>
      <div className="flex items-center gap-3">
        <IconButton icon={<Download className="h-4 w-4" />} aria-label="Loading" isLoading />
        <IconButton icon={<Settings className="h-4 w-4" />} aria-label="Disabled" disabled variant="outline" />
      </div>
    </div>
  );
}

function MenuItemPreview() {
  return (
    <div className="w-full max-w-xs border rounded-lg bg-card p-1">
      <MenuItem label="Edit" icon={<Edit className="h-4 w-4" />} shortcut="⌘E" onClick={() => {}} />
      <MenuItem label="Copy" icon={<Copy className="h-4 w-4" />} shortcut="⌘C" onClick={() => {}} />
      <MenuItem label="Download" icon={<Download className="h-4 w-4" />} onClick={() => {}} />
      <MenuItem label="Disabled item" icon={<Settings className="h-4 w-4" />} disabled onClick={() => {}} />
      <MenuItem label="Delete" icon={<Trash2 className="h-4 w-4" />} destructive onClick={() => {}} />
    </div>
  );
}

function StatusBadgePreview() {
  return (
    <div className="flex flex-wrap items-center gap-3 w-full">
      <StatusBadge status="active" />
      <StatusBadge status="inactive" />
      <StatusBadge status="pending" />
      <StatusBadge status="success" />
      <StatusBadge status="warning" />
      <StatusBadge status="error" />
      <StatusBadge status="info" />
      <StatusBadge status="active" showDot={false} />
      <StatusBadge status="error" label="Custom Label" />
    </div>
  );
}

function ThemeTogglePreview() {
  return (
    <div className="flex flex-col gap-4 w-full items-center">
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <ThemeToggle variant="icon" />
          <Text size="xs" color="muted">Icon</Text>
        </div>
        <div className="flex flex-col items-center gap-2">
          <ThemeToggle variant="button" />
          <Text size="xs" color="muted">Button</Text>
        </div>
        <div className="flex flex-col items-center gap-2">
          <ThemeToggle variant="segmented" />
          <Text size="xs" color="muted">Segmented</Text>
        </div>
      </div>
      <ThemeToggle variant="button" showLabel />
    </div>
  );
}

function ConfirmButtonPreview() {
  return (
    <div className="flex flex-col gap-4 w-full items-center">
      <div className="flex flex-wrap items-center gap-3">
        <ConfirmButton
          onConfirm={() => {}}
          confirmMode="double-click"
          variant="destructive"
        >
          Double-click to delete
        </ConfirmButton>
        <ConfirmButton
          onConfirm={() => {}}
          confirmMode="dialog"
          variant="outline"
          confirmTitle="Confirm removal"
          confirmMessage="This item will be permanently removed."
        >
          Dialog confirm
        </ConfirmButton>
      </div>
    </div>
  );
}

function ExportButtonPreview() {
  return (
    <div className="flex flex-wrap items-center gap-3 w-full justify-center">
      <ExportButton
        label="Export CSV"
        onExport={async () => {}}
        variant="outline"
        size="sm"
      />
      <ExportButton
        label="Export"
        formats={["csv", "json"]}
        showFormatSelector
        onExport={async () => {}}
        variant="outline"
        size="sm"
      />
    </div>
  );
}

function CommandPalettePreview() {
  const [open, setOpen] = useState(false);
  return (
    <div className="w-full text-center">
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Search className="h-4 w-4 mr-2" />
        Open Command Palette
        <Kbd>⌘K</Kbd>
      </Button>
      <CommandPalette
        isOpen={open}
        onClose={() => setOpen(false)}
        enableGlobalShortcut={false}
        items={[
          { id: "home", label: "Go to Home", icon: <House className="h-4 w-4" />, onSelect: () => setOpen(false) },
          { id: "settings", label: "Open Settings", icon: <Settings className="h-4 w-4" />, shortcut: "⌘,", onSelect: () => setOpen(false) },
          { id: "search", label: "Search", icon: <Search className="h-4 w-4" />, shortcut: "⌘F", onSelect: () => setOpen(false) },
          { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" />, onSelect: () => setOpen(false) },
          { id: "profile", label: "View Profile", icon: <User className="h-4 w-4" />, onSelect: () => setOpen(false), group: "Account" },
          { id: "logout", label: "Log Out", icon: <LogOut className="h-4 w-4" />, onSelect: () => setOpen(false), group: "Account" },
        ]}
      />
    </div>
  );
}

function QRCodePreview() {
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <QRCode value="https://example.com" size={160} downloadable />
    </div>
  );
}

function CopyButtonPreview() {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-wrap items-center gap-3">
        <CopyButton text="Hello, world!" variant="outline" />
        <CopyButton text="Copied text" variant="outline" showLabel />
        <CopyButton text="Ghost" variant="ghost" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <CopyButton text="Small" variant="outline" size="sm" showLabel />
        <CopyButton text="Medium" variant="outline" size="md" showLabel />
        <CopyButton text="Large" variant="outline" size="lg" showLabel />
      </div>
    </div>
  );
}

function CopyableTextPreview() {
  return (
    <div className="flex flex-col gap-3 w-full">
      <CopyableText text="npm install @starter/ui" />
      <CopyableText text="sk_live_abc123xyz789" />
    </div>
  );
}

function StatCardSkeletonPreview() {
  return (
    <div className="grid grid-cols-2 gap-4 w-full">
      <StatCardSkeleton />
      <StatCardSkeleton size="sm" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Organism preview components
// ---------------------------------------------------------------------------

function AccordionPreview() {
  return (
    <div className="w-full max-w-md">
      <Accordion type="single" defaultValue="item-1" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>What is this component library?</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-muted-foreground">
              A custom-built component library using React, Tailwind CSS, and
              CSS variables for theming. All components are built from scratch.
            </p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Is it accessible?</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-muted-foreground">
              Yes. All components follow WAI-ARIA patterns with proper keyboard
              navigation, focus management, and screen reader support.
            </p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>Can I customize the styles?</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-muted-foreground">
              Absolutely. Components use CSS variables and accept className
              props for full customization via Tailwind utilities.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

function TooltipPreview() {
  return (
    <div className="flex flex-col gap-6 w-full items-center">
      <div className="flex flex-wrap items-center gap-6">
        <Tooltip content="Top tooltip" position="top">
          <Button variant="outline" size="sm">Top</Button>
        </Tooltip>
        <Tooltip content="Bottom tooltip" position="bottom">
          <Button variant="outline" size="sm">Bottom</Button>
        </Tooltip>
        <Tooltip content="Left tooltip" position="left">
          <Button variant="outline" size="sm">Left</Button>
        </Tooltip>
        <Tooltip content="Right tooltip" position="right">
          <Button variant="outline" size="sm">Right</Button>
        </Tooltip>
      </div>
      <div className="flex flex-wrap items-center gap-6">
        <Tooltip content="Dark variant (default)" variant="dark">
          <Button variant="outline" size="sm">Dark</Button>
        </Tooltip>
        <Tooltip content="Light variant" variant="light">
          <Button variant="outline" size="sm">Light</Button>
        </Tooltip>
        <Tooltip
          content={
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span>Rich content tooltip</span>
            </div>
          }
        >
          <Button variant="outline" size="sm">Rich Content</Button>
        </Tooltip>
      </div>
    </div>
  );
}

function PopoverPreview() {
  return (
    <div className="flex flex-wrap items-center gap-4 w-full justify-center">
      <Popover
        trigger={<Button variant="outline">Open Popover</Button>}
      >
        <PopoverHeader>
          <h4 className="font-semibold">Popover Title</h4>
          <p className="text-sm text-muted-foreground">
            This is a popover with header and footer sections.
          </p>
        </PopoverHeader>
        <PopoverContent>
          <div className="space-y-2">
            <p className="text-sm">
              Popovers are useful for displaying additional information or
              actions without navigating away.
            </p>
          </div>
        </PopoverContent>
        <PopoverFooter className="flex justify-end gap-2">
          <PopoverClose>
            <Button variant="outline" size="sm">Cancel</Button>
          </PopoverClose>
          <Button size="sm">Apply</Button>
        </PopoverFooter>
      </Popover>
    </div>
  );
}

function StepperPreview() {
  const [activeStep, setActiveStep] = useState(1);
  return (
    <div className="flex flex-col gap-6 w-full">
      <Stepper
        steps={[
          { id: "account", label: "Account", description: "Create your account" },
          { id: "profile", label: "Profile", description: "Set up your profile" },
          { id: "review", label: "Review", description: "Review and submit" },
        ]}
        activeStep={activeStep}
        onStepChange={setActiveStep}
        clickable
      />
      <div className="flex justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
          disabled={activeStep === 0}
        >
          Previous
        </Button>
        <Button
          size="sm"
          onClick={() => setActiveStep(Math.min(2, activeStep + 1))}
          disabled={activeStep === 2}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function TimelinePreview() {
  return (
    <div className="w-full max-w-md">
      <Timeline
        items={[
          {
            id: "1",
            title: "Order placed",
            description: "Your order has been confirmed",
            timestamp: "10:30 AM",
            status: "success" as const,
          },
          {
            id: "2",
            title: "Processing",
            description: "We are preparing your order",
            timestamp: "11:00 AM",
            status: "info" as const,
          },
          {
            id: "3",
            title: "Shipped",
            description: "Your order is on the way",
            timestamp: "2:00 PM",
            status: "warning" as const,
          },
          {
            id: "4",
            title: "Delivery pending",
            description: "Expected by tomorrow",
            timestamp: "Estimated",
            status: "default" as const,
          },
        ]}
        size="md"
      />
    </div>
  );
}

function CollapsiblePreview() {
  return (
    <div className="flex flex-col gap-4 w-full max-w-md">
      <Collapsible defaultOpen>
        <CollapsibleTrigger>
          <span className="font-medium">Click to toggle</span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="pt-2 text-sm text-muted-foreground">
            This content can be expanded and collapsed. It supports both
            controlled and uncontrolled modes with smooth transitions.
          </div>
        </CollapsibleContent>
      </Collapsible>
      <Collapsible>
        <CollapsibleTrigger>
          <span className="font-medium">Another section</span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="pt-2 text-sm text-muted-foreground">
            Each collapsible operates independently. Great for FAQ sections
            or settings panels.
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function PaginationPreview() {
  const [page, setPage] = useState(1);
  return (
    <div className="flex flex-col gap-6 w-full items-center">
      <Pagination
        page={page}
        totalPages={10}
        onPageChange={setPage}
        totalItems={97}
        showItemCount
      />
      <Pagination
        page={page}
        totalPages={10}
        onPageChange={setPage}
        showFirstLast
        showPageSizeSelector
        size="sm"
      />
    </div>
  );
}

function BreadcrumbPreview() {
  return (
    <div className="flex flex-col gap-4 w-full">
      <Breadcrumb
        items={[
          { label: "Home", href: "#" },
          { label: "Products", href: "#" },
          { label: "Electronics", href: "#" },
          { label: "Smartphones" },
        ]}
        showHomeIcon
      />
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "#" },
          { label: "Settings", href: "#" },
          { label: "Profile" },
        ]}
        separator="/"
      />
      <Breadcrumb
        items={[
          { label: "Home", href: "#" },
          { label: "Category", href: "#" },
          { label: "Subcategory", href: "#" },
          { label: "Page", href: "#" },
          { label: "Current Item" },
        ]}
        maxItems={3}
      />
    </div>
  );
}

function ModalPreview() {
  const [open, setOpen] = useState(false);
  return (
    <div className="w-full text-center">
      <Button onClick={() => setOpen(true)}>Open Modal</Button>
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Edit Profile"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Save Changes</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="modal-name">Name</Label>
            <Input id="modal-name" placeholder="John Doe" />
          </div>
          <div>
            <Label htmlFor="modal-email">Email</Label>
            <Input id="modal-email" type="email" placeholder="john@example.com" />
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SpinnerOverlayPreview() {
  return (
    <div className="w-full relative h-48 rounded-lg border bg-card">
      <div className="p-4">
        <p className="text-sm text-muted-foreground">Content behind the overlay</p>
      </div>
      <SpinnerOverlay />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Molecule previews (remaining)
// ---------------------------------------------------------------------------

function ThemeSelectorPreview() {
  return (
    <div className="flex flex-col gap-4 w-full items-center">
      <ThemeSelector variant="dropdown" size="md" />
      <ThemeSelector variant="grid" size="sm" />
    </div>
  );
}

function AvatarUploadPreview() {
  return (
    <div className="flex flex-col gap-6 w-full items-center">
      <div className="flex items-end gap-6">
        <AvatarUpload
          initials="JD"
          onUpload={async () => {}}
          size="md"
        />
        <AvatarUpload
          initials="AB"
          onUpload={async () => {}}
          onRemove={async () => {}}
          size="lg"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Layout previews
// ---------------------------------------------------------------------------

function ContainerPreview() {
  return (
    <div className="w-full">
      <Container className="border border-dashed border-border rounded-lg py-6 text-center">
        <Text size="sm" color="muted">
          Container centers content with a max-width and horizontal padding.
        </Text>
      </Container>
    </div>
  );
}

function StackPreview() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <Text size="xs" color="muted" className="mb-2">Vertical (default)</Text>
        <Stack spacing="sm">
          <div className="h-10 rounded bg-primary/20 flex items-center justify-center text-xs">Item 1</div>
          <div className="h-10 rounded bg-primary/20 flex items-center justify-center text-xs">Item 2</div>
          <div className="h-10 rounded bg-primary/20 flex items-center justify-center text-xs">Item 3</div>
        </Stack>
      </div>
      <div>
        <Text size="xs" color="muted" className="mb-2">Horizontal</Text>
        <Stack direction="horizontal" spacing="sm">
          <div className="h-10 flex-1 rounded bg-primary/20 flex items-center justify-center text-xs">Item 1</div>
          <div className="h-10 flex-1 rounded bg-primary/20 flex items-center justify-center text-xs">Item 2</div>
          <div className="h-10 flex-1 rounded bg-primary/20 flex items-center justify-center text-xs">Item 3</div>
        </Stack>
      </div>
    </div>
  );
}

function GridPreview() {
  return (
    <div className="w-full">
      <Grid cols={{ base: 2, sm: 3 }} gap="md">
        <GridItem>
          <div className="h-16 rounded bg-primary/20 flex items-center justify-center text-xs">1</div>
        </GridItem>
        <GridItem>
          <div className="h-16 rounded bg-primary/20 flex items-center justify-center text-xs">2</div>
        </GridItem>
        <GridItem>
          <div className="h-16 rounded bg-primary/20 flex items-center justify-center text-xs">3</div>
        </GridItem>
        <GridItem colSpan={2}>
          <div className="h-16 rounded bg-primary/20 flex items-center justify-center text-xs">4 (span 2)</div>
        </GridItem>
        <GridItem>
          <div className="h-16 rounded bg-primary/20 flex items-center justify-center text-xs">5</div>
        </GridItem>
      </Grid>
    </div>
  );
}

function AuthLayoutPreview() {
  return (
    <div className="w-full max-h-[300px] overflow-hidden rounded-lg border">
      <AuthLayout title="Sign In" subtitle="Welcome back">
        <div className="space-y-3">
          <Input placeholder="Email" type="email" />
          <Input placeholder="Password" type="password" />
          <Button className="w-full">Sign In</Button>
        </div>
      </AuthLayout>
    </div>
  );
}

function PageLayoutPreview() {
  return (
    <div className="w-full max-h-[250px] overflow-hidden rounded-lg border">
      <PageLayout
        sidebar={
          <div className="p-4 space-y-2">
            <Text size="sm" className="font-semibold">Sidebar</Text>
            <div className="h-6 rounded bg-muted" />
            <div className="h-6 rounded bg-muted" />
            <div className="h-6 rounded bg-muted" />
          </div>
        }
      >
        <div className="p-6">
          <Text size="sm" className="font-semibold mb-2">Main Content</Text>
          <Text size="sm" color="muted">
            PageLayout provides a standard page structure with an optional sidebar.
          </Text>
        </div>
      </PageLayout>
    </div>
  );
}

function DashboardLayoutPreview() {
  return (
    <div className="w-full max-h-[250px] overflow-hidden rounded-lg border text-center py-12">
      <Text size="sm" color="muted">
        DashboardLayout provides a full admin dashboard shell with sidebar navigation,
        header, and main content area. Best viewed at full page scale.
      </Text>
    </div>
  );
}

function SplitLayoutPreview() {
  return (
    <div className="w-full h-[200px] rounded-lg border overflow-hidden">
      <SplitLayout
        stackOnMobile={false}
        divider
        ratio="30/70"
        left={
          <div className="p-4 h-full bg-muted/30">
            <Text size="sm" className="font-semibold">Left Panel</Text>
            <Text size="xs" color="muted">Navigation or list</Text>
          </div>
        }
        right={
          <div className="p-4 h-full">
            <Text size="sm" className="font-semibold">Right Panel</Text>
            <Text size="xs" color="muted">Detail or content</Text>
          </div>
        }
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const previewRegistry: Record<string, () => React.ReactNode> = {
  button: () => <ButtonPreview />,
  badge: () => <BadgePreview />,
  select: () => <SelectPreview />,
  card: () => <CardPreview />,
  table: () => <TablePreview />,
  avatar: () => <AvatarPreview />,
  "search-input": () => <SearchInputPreview />,
  "stat-card": () => <StatCardPreview />,
  "date-picker": () => <DatePickerPreview />,
  dialog: () => <DialogPreview />,
  tabs: () => <TabsPreview />,
  "dropdown-menu": () => <DropdownMenuPreview />,
  // Form fields
  input: () => <InputPreview />,
  textarea: () => <TextareaPreview />,
  checkbox: () => <CheckboxPreview />,
  radio: () => <RadioPreview />,
  switch: () => <SwitchPreview />,
  slider: () => <SliderPreview />,
  rating: () => <RatingPreview />,
  "number-input": () => <NumberInputPreview />,
  label: () => <LabelPreview />,
  "field-wrapper": () => <FieldWrapperPreview />,
  "password-strength": () => <PasswordStrengthPreview />,
  autocomplete: () => <AutocompletePreview />,
  "tag-input": () => <TagInputPreview />,
  "time-picker": () => <TimePickerPreview />,
  "rich-text-editor": () => <RichTextEditorPreview />,
  // Remaining atoms — display & feedback
  spinner: () => <SpinnerPreview />,
  skeleton: () => <SkeletonPreview />,
  "skeleton-text": () => <SkeletonTextPreview />,
  "skeleton-circle": () => <SkeletonCirclePreview />,
  "skeleton-card": () => <SkeletonCardPreview />,
  "skeleton-avatar": () => <SkeletonAvatarPreview />,
  "skeleton-button": () => <SkeletonButtonPreview />,
  "skeleton-image": () => <SkeletonImagePreview />,
  "skeleton-table": () => <SkeletonTablePreview />,
  "skeleton-list": () => <SkeletonListPreview />,
  "skeleton-page": () => <SkeletonPagePreview />,
  "skeleton-dashboard": () => <SkeletonDashboardPreview />,
  "skeleton-form": () => <SkeletonFormPreview />,
  "skeleton-profile": () => <SkeletonProfilePreview />,
  "skeleton-auth": () => <SkeletonAuthPreview />,
  progress: () => <ProgressPreview />,
  "linear-progress": () => <LinearProgressPreview />,
  "circular-progress": () => <CircularProgressPreview />,
  icon: () => <IconPreview />,
  link: () => <AppLinkPreview />,
  text: () => <TextPreview />,
  divider: () => <DividerPreview />,
  kbd: () => <KbdPreview />,
  "visually-hidden": () => <VisuallyHiddenPreview />,
  "data-table": () => <DataTablePreview />,
  // Sub-component slugs — reuse parent previews
  "radio-group": () => <RadioPreview />,
  "card-header": () => <CardPreview />,
  "card-title": () => <CardPreview />,
  "card-description": () => <CardPreview />,
  "card-content": () => <CardPreview />,
  "card-footer": () => <CardPreview />,
  "table-header": () => <TablePreview />,
  "table-body": () => <TablePreview />,
  "table-footer": () => <TablePreview />,
  "table-row": () => <TablePreview />,
  "table-head": () => <TablePreview />,
  "table-cell": () => <TablePreview />,
  "table-caption": () => <TablePreview />,
  // Molecules
  "nav-link": () => <NavLinkPreview />,
  "icon-button": () => <IconButtonPreview />,
  "menu-item": () => <MenuItemPreview />,
  "status-badge": () => <StatusBadgePreview />,
  "theme-toggle": () => <ThemeTogglePreview />,
  "confirm-button": () => <ConfirmButtonPreview />,
  "export-button": () => <ExportButtonPreview />,
  "export-csv-button": () => <ExportButtonPreview />,
  "export-my-data-button": () => <ExportButtonPreview />,
  "command-palette": () => <CommandPalettePreview />,
  "qr-code": () => <QRCodePreview />,
  "copy-button": () => <CopyButtonPreview />,
  "copyable-text": () => <CopyableTextPreview />,
  "stat-card-skeleton": () => <StatCardSkeletonPreview />,
  // Organisms
  accordion: () => <AccordionPreview />,
  tooltip: () => <TooltipPreview />,
  popover: () => <PopoverPreview />,
  stepper: () => <StepperPreview />,
  timeline: () => <TimelinePreview />,
  collapsible: () => <CollapsiblePreview />,
  pagination: () => <PaginationPreview />,
  breadcrumb: () => <BreadcrumbPreview />,
  modal: () => <ModalPreview />,
  "spinner-overlay": () => <SpinnerOverlayPreview />,
  // Organism sub-component slug aliases
  "accordion-item": () => <AccordionPreview />,
  "accordion-trigger": () => <AccordionPreview />,
  "accordion-content": () => <AccordionPreview />,
  "dialog-header": () => <DialogPreview />,
  "dialog-body": () => <DialogPreview />,
  "dialog-footer": () => <DialogPreview />,
  "tab-list": () => <TabsPreview />,
  "tab-panel": () => <TabsPreview />,
  "tab-panels": () => <TabsPreview />,
  "popover-content": () => <PopoverPreview />,
  "popover-header": () => <PopoverPreview />,
  "popover-footer": () => <PopoverPreview />,
  "popover-close": () => <PopoverPreview />,
  "collapsible-trigger": () => <CollapsiblePreview />,
  "collapsible-content": () => <CollapsiblePreview />,
  step: () => <StepperPreview />,
  "step-indicator": () => <StepperPreview />,
  "step-label": () => <StepperPreview />,
  "step-connector": () => <StepperPreview />,
  "timeline-item": () => <TimelinePreview />,
  tab: () => <TabsPreview />,
  // Remaining molecules
  "theme-selector": () => <ThemeSelectorPreview />,
  "avatar-upload": () => <AvatarUploadPreview />,
  // Layouts
  container: () => <ContainerPreview />,
  stack: () => <StackPreview />,
  grid: () => <GridPreview />,
  "grid-item": () => <GridPreview />,
  "auth-layout": () => <AuthLayoutPreview />,
  "page-layout": () => <PageLayoutPreview />,
  "dashboard-layout": () => <DashboardLayoutPreview />,
  "split-layout": () => <SplitLayoutPreview />,
};

/**
 * Get a live preview for a component by its slug.
 * Returns null if no preview is registered for the given slug.
 */
export function getComponentPreview(slug: string): React.ReactNode | null {
  const factory = previewRegistry[slug];
  return factory ? factory() : null;
}
