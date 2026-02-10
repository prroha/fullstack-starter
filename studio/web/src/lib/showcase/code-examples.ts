/**
 * Code examples for component showcase
 * Provides usage examples and snippets for each component
 */

export interface CodeExample {
  title: string;
  description?: string;
  code: string;
  language: "tsx" | "ts" | "css";
}

export interface ComponentExamples {
  import: string;
  basic: CodeExample;
  variants?: CodeExample[];
}

/**
 * Get code examples for a component
 */
export function getComponentExamples(slug: string): ComponentExamples | null {
  return codeExamples[slug] ?? null;
}

const codeExamples: Record<string, ComponentExamples> = {
  // =============================================================================
  // FORM COMPONENTS
  // =============================================================================
  button: {
    import: `import { Button } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<Button>Click me</Button>`,
      language: "tsx",
    },
    variants: [
      {
        title: "Variants",
        description: "Button comes in multiple visual styles",
        code: `<div className="flex gap-2">
  <Button variant="primary">Primary</Button>
  <Button variant="secondary">Secondary</Button>
  <Button variant="outline">Outline</Button>
  <Button variant="ghost">Ghost</Button>
  <Button variant="destructive">Destructive</Button>
  <Button variant="link">Link</Button>
</div>`,
        language: "tsx",
      },
      {
        title: "Sizes",
        description: "Available in multiple sizes",
        code: `<div className="flex items-center gap-2">
  <Button size="xs">Extra Small</Button>
  <Button size="sm">Small</Button>
  <Button size="md">Medium</Button>
  <Button size="lg">Large</Button>
  <Button size="xl">Extra Large</Button>
</div>`,
        language: "tsx",
      },
      {
        title: "With Icons",
        description: "Add icons to buttons",
        code: `<div className="flex gap-2">
  <Button>
    <Mail className="mr-2 h-4 w-4" />
    Send Email
  </Button>
  <Button variant="outline">
    Download
    <Download className="ml-2 h-4 w-4" />
  </Button>
</div>`,
        language: "tsx",
      },
      {
        title: "Loading State",
        description: "Show loading spinner",
        code: `<Button loading>Processing...</Button>`,
        language: "tsx",
      },
      {
        title: "As Link",
        description: "Render as anchor using asChild",
        code: `<Button asChild>
  <Link href="/dashboard">Go to Dashboard</Link>
</Button>`,
        language: "tsx",
      },
    ],
  },

  input: {
    import: `import { Input } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<Input placeholder="Enter your name" />`,
      language: "tsx",
    },
    variants: [
      {
        title: "With Label",
        description: "Using FieldWrapper for form layout",
        code: `<FieldWrapper label="Email" required>
  <Input type="email" placeholder="you@example.com" />
</FieldWrapper>`,
        language: "tsx",
      },
      {
        title: "With Icons",
        description: "Add icons to input",
        code: `<Input
  placeholder="Search..."
  leftIcon={<Search className="h-4 w-4" />}
/>

<Input
  type="email"
  placeholder="Email"
  rightIcon={<Mail className="h-4 w-4" />}
/>`,
        language: "tsx",
      },
      {
        title: "Error State",
        description: "Show validation error",
        code: `<FieldWrapper label="Email" error="Invalid email address">
  <Input type="email" error />
</FieldWrapper>`,
        language: "tsx",
      },
      {
        title: "Sizes",
        description: "Available in multiple sizes",
        code: `<div className="space-y-2">
  <Input size="sm" placeholder="Small" />
  <Input size="md" placeholder="Medium" />
  <Input size="lg" placeholder="Large" />
</div>`,
        language: "tsx",
      },
    ],
  },

  card: {
    import: `import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description goes here</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here.</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>`,
      language: "tsx",
    },
    variants: [
      {
        title: "Variants",
        description: "Different card styles",
        code: `<div className="grid gap-4 md:grid-cols-3">
  <Card variant="default">
    <CardContent className="pt-6">Default card</CardContent>
  </Card>
  <Card variant="outline">
    <CardContent className="pt-6">Outline card</CardContent>
  </Card>
  <Card variant="elevated">
    <CardContent className="pt-6">Elevated card</CardContent>
  </Card>
</div>`,
        language: "tsx",
      },
      {
        title: "Hoverable",
        description: "Add hover effect",
        code: `<Card hover className="cursor-pointer">
  <CardContent className="pt-6">
    Hover over me
  </CardContent>
</Card>`,
        language: "tsx",
      },
    ],
  },

  badge: {
    import: `import { Badge } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<Badge>Default</Badge>`,
      language: "tsx",
    },
    variants: [
      {
        title: "Variants",
        description: "Different badge styles",
        code: `<div className="flex gap-2">
  <Badge variant="default">Default</Badge>
  <Badge variant="secondary">Secondary</Badge>
  <Badge variant="outline">Outline</Badge>
  <Badge variant="destructive">Destructive</Badge>
  <Badge variant="success">Success</Badge>
  <Badge variant="warning">Warning</Badge>
</div>`,
        language: "tsx",
      },
      {
        title: "With Dot",
        description: "Status indicator dot",
        code: `<Badge dot variant="success">Online</Badge>`,
        language: "tsx",
      },
    ],
  },

  select: {
    import: `import { Select } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<Select
  options={[
    { value: "react", label: "React" },
    { value: "vue", label: "Vue" },
    { value: "angular", label: "Angular" },
  ]}
  placeholder="Select framework"
/>`,
      language: "tsx",
    },
    variants: [
      {
        title: "Searchable",
        description: "Enable search filter",
        code: `<Select
  searchable
  options={countries}
  placeholder="Select country"
/>`,
        language: "tsx",
      },
      {
        title: "Multiple Selection",
        description: "Allow selecting multiple options",
        code: `<Select
  multiple
  options={tags}
  placeholder="Select tags"
/>`,
        language: "tsx",
      },
    ],
  },

  avatar: {
    import: `import { Avatar } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<Avatar
  src="/avatars/user.jpg"
  alt="User Name"
  name="John Doe"
/>`,
      language: "tsx",
    },
    variants: [
      {
        title: "Sizes",
        description: "Available in multiple sizes",
        code: `<div className="flex items-center gap-2">
  <Avatar size="xs" name="JD" />
  <Avatar size="sm" name="JD" />
  <Avatar size="md" name="JD" />
  <Avatar size="lg" name="JD" />
  <Avatar size="xl" name="JD" />
</div>`,
        language: "tsx",
      },
      {
        title: "With Status",
        description: "Show online/offline status",
        code: `<div className="flex gap-4">
  <Avatar name="Online" status="online" />
  <Avatar name="Away" status="away" />
  <Avatar name="Busy" status="busy" />
  <Avatar name="Offline" status="offline" />
</div>`,
        language: "tsx",
      },
    ],
  },

  dialog: {
    import: `import { Dialog, DialogHeader, DialogBody, DialogFooter } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `const [open, setOpen] = useState(false);

return (
  <>
    <Button onClick={() => setOpen(true)}>Open Dialog</Button>
    <Dialog open={open} onClose={() => setOpen(false)}>
      <DialogHeader>
        <h2>Dialog Title</h2>
        <p>Dialog description here</p>
      </DialogHeader>
      <DialogBody>
        <p>Dialog content goes here.</p>
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button onClick={() => setOpen(false)}>Confirm</Button>
      </DialogFooter>
    </Dialog>
  </>
);`,
      language: "tsx",
    },
    variants: [
      {
        title: "Sizes",
        description: "Different dialog sizes",
        code: `<Dialog size="sm" open={open} onClose={onClose}>...</Dialog>
<Dialog size="md" open={open} onClose={onClose}>...</Dialog>
<Dialog size="lg" open={open} onClose={onClose}>...</Dialog>
<Dialog size="xl" open={open} onClose={onClose}>...</Dialog>
<Dialog size="full" open={open} onClose={onClose}>...</Dialog>`,
        language: "tsx",
      },
    ],
  },

  tabs: {
    import: `import { Tabs, TabList, Tab, TabPanels, TabPanel } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<Tabs defaultValue="overview">
  <TabList>
    <Tab value="overview">Overview</Tab>
    <Tab value="analytics">Analytics</Tab>
    <Tab value="settings">Settings</Tab>
  </TabList>
  <TabPanels>
    <TabPanel value="overview">
      <p>Overview content</p>
    </TabPanel>
    <TabPanel value="analytics">
      <p>Analytics content</p>
    </TabPanel>
    <TabPanel value="settings">
      <p>Settings content</p>
    </TabPanel>
  </TabPanels>
</Tabs>`,
      language: "tsx",
    },
    variants: [
      {
        title: "Variants",
        description: "Different tab styles",
        code: `<Tabs variant="default">...</Tabs>
<Tabs variant="pills">...</Tabs>
<Tabs variant="underline">...</Tabs>`,
        language: "tsx",
      },
    ],
  },

  table: {
    import: `import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Role</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {users.map((user) => (
      <TableRow key={user.id}>
        <TableCell>{user.name}</TableCell>
        <TableCell>{user.email}</TableCell>
        <TableCell>{user.role}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>`,
      language: "tsx",
    },
    variants: [
      {
        title: "Striped & Hoverable",
        description: "Add visual enhancements",
        code: `<Table striped hoverable>
  ...
</Table>`,
        language: "tsx",
      },
    ],
  },

  "search-input": {
    import: `import { SearchInput } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<SearchInput
  placeholder="Search..."
  onChange={(value) => setSearchQuery(value)}
/>`,
      language: "tsx",
    },
    variants: [
      {
        title: "With Debounce",
        description: "Custom debounce delay",
        code: `<SearchInput
  placeholder="Search users..."
  debounce={500}
  onChange={handleSearch}
/>`,
        language: "tsx",
      },
      {
        title: "With Loading",
        description: "Show loading state while searching",
        code: `<SearchInput
  placeholder="Search..."
  loading={isSearching}
  onChange={handleSearch}
/>`,
        language: "tsx",
      },
    ],
  },

  "stat-card": {
    import: `import { StatCard } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<StatCard
  title="Total Revenue"
  value="$45,231.89"
  change={12.5}
  trend="up"
  icon="DollarSign"
/>`,
      language: "tsx",
    },
    variants: [
      {
        title: "Grid Layout",
        description: "Common dashboard layout",
        code: `<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  <StatCard
    title="Total Revenue"
    value="$45,231.89"
    change={12.5}
    trend="up"
    icon="DollarSign"
  />
  <StatCard
    title="Subscriptions"
    value="+2,350"
    change={-4.3}
    trend="down"
    icon="Users"
  />
  <StatCard
    title="Sales"
    value="+12,234"
    change={8.2}
    trend="up"
    icon="CreditCard"
  />
  <StatCard
    title="Active Now"
    value="+573"
    change={2.1}
    trend="up"
    icon="Activity"
  />
</div>`,
        language: "tsx",
      },
    ],
  },

  "dropdown-menu": {
    import: `import { DropdownMenu } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<DropdownMenu
  trigger={<Button variant="ghost" size="sm"><MoreVertical /></Button>}
  items={[
    { type: "item", label: "Edit", icon: "Edit", onClick: handleEdit },
    { type: "item", label: "Duplicate", icon: "Copy", onClick: handleDuplicate },
    { type: "separator" },
    { type: "item", label: "Delete", icon: "Trash", destructive: true, onClick: handleDelete },
  ]}
/>`,
      language: "tsx",
    },
    variants: [
      {
        title: "With Groups",
        description: "Organize items into groups",
        code: `<DropdownMenu
  trigger={<Button>Actions</Button>}
  items={[
    {
      type: "group",
      label: "Actions",
      items: [
        { type: "item", label: "Edit", icon: "Edit" },
        { type: "item", label: "Copy", icon: "Copy" },
      ]
    },
    { type: "separator" },
    {
      type: "group",
      label: "Danger Zone",
      items: [
        { type: "item", label: "Delete", destructive: true },
      ]
    },
  ]}
/>`,
        language: "tsx",
      },
    ],
  },

  "date-picker": {
    import: `import { DatePicker } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `const [date, setDate] = useState<Date | null>(null);

return (
  <DatePicker
    value={date}
    onChange={setDate}
    placeholder="Select date"
  />
);`,
      language: "tsx",
    },
    variants: [
      {
        title: "With Range",
        description: "Set min/max date range",
        code: `<DatePicker
  value={date}
  onChange={setDate}
  minDate={new Date()}
  maxDate={addDays(new Date(), 30)}
  placeholder="Select date (next 30 days)"
/>`,
        language: "tsx",
      },
    ],
  },

  "dashboard-layout": {
    import: `import { DashboardLayout, DashboardSidebar, DashboardNavItem, DashboardHeader } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<DashboardLayout
  sidebar={
    <DashboardSidebar>
      <DashboardNavItem href="/dashboard" icon="LayoutDashboard">
        Dashboard
      </DashboardNavItem>
      <DashboardNavItem href="/users" icon="Users">
        Users
      </DashboardNavItem>
      <DashboardNavItem href="/settings" icon="Settings">
        Settings
      </DashboardNavItem>
    </DashboardSidebar>
  }
  header={
    <DashboardHeader>
      <h1>Dashboard</h1>
    </DashboardHeader>
  }
>
  <main>{children}</main>
</DashboardLayout>`,
      language: "tsx",
    },
  },

  container: {
    import: `import { Container } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<Container>
  <h1>Page Title</h1>
  <p>Page content goes here...</p>
</Container>`,
      language: "tsx",
    },
    variants: [
      {
        title: "Sizes",
        description: "Different max-width options",
        code: `<Container size="sm">Small container (max-w-2xl)</Container>
<Container size="md">Medium container (max-w-4xl)</Container>
<Container size="lg">Large container (max-w-6xl)</Container>
<Container size="xl">Extra large container (max-w-7xl)</Container>
<Container size="full">Full width container</Container>`,
        language: "tsx",
      },
    ],
  },

  grid: {
    import: `import { Grid, GridItem } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<Grid cols={{ base: 1, md: 2, lg: 3 }} gap="md">
  <GridItem>Item 1</GridItem>
  <GridItem>Item 2</GridItem>
  <GridItem>Item 3</GridItem>
</Grid>`,
      language: "tsx",
    },
    variants: [
      {
        title: "Column Span",
        description: "Items spanning multiple columns",
        code: `<Grid cols={4} gap="md">
  <GridItem colSpan={2}>Spans 2 columns</GridItem>
  <GridItem>Item 2</GridItem>
  <GridItem>Item 3</GridItem>
  <GridItem colSpan={4}>Full width</GridItem>
</Grid>`,
        language: "tsx",
      },
    ],
  },

  // =============================================================================
  // ADDITIONAL FORM COMPONENTS
  // =============================================================================
  textarea: {
    import: `import { Textarea } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<Textarea placeholder="Enter your message..." />`,
      language: "tsx",
    },
    variants: [
      {
        title: "With Label",
        description: "Using FieldWrapper for form layout",
        code: `<FieldWrapper label="Description" description="Provide a detailed description">
  <Textarea placeholder="Write your description here..." rows={4} />
</FieldWrapper>`,
        language: "tsx",
      },
      {
        title: "Resize Options",
        description: "Control resize behavior",
        code: `<div className="space-y-4">
  <Textarea resize="none" placeholder="No resize" />
  <Textarea resize="vertical" placeholder="Vertical resize (default)" />
  <Textarea resize="horizontal" placeholder="Horizontal resize" />
  <Textarea resize="both" placeholder="Both directions" />
</div>`,
        language: "tsx",
      },
      {
        title: "Error State",
        description: "Show validation error",
        code: `<FieldWrapper label="Bio" error="Bio must be at least 50 characters">
  <Textarea error placeholder="Tell us about yourself..." />
</FieldWrapper>`,
        language: "tsx",
      },
    ],
  },

  checkbox: {
    import: `import { Checkbox } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<Checkbox label="Accept terms and conditions" />`,
      language: "tsx",
    },
    variants: [
      {
        title: "With Description",
        description: "Add helper text below the label",
        code: `<Checkbox
  label="Email notifications"
  description="Receive email updates about your account activity"
/>`,
        language: "tsx",
      },
      {
        title: "Controlled State",
        description: "Manage checkbox state",
        code: `const [checked, setChecked] = useState(false);

return (
  <Checkbox
    label="Subscribe to newsletter"
    checked={checked}
    onChange={(e) => setChecked(e.target.checked)}
  />
);`,
        language: "tsx",
      },
      {
        title: "Indeterminate State",
        description: "Show partial selection",
        code: `<div className="space-y-2">
  <Checkbox
    label="Select all"
    indeterminate={someSelected && !allSelected}
    checked={allSelected}
    onChange={handleSelectAll}
  />
  <div className="ml-6 space-y-1">
    <Checkbox label="Option 1" checked={selected.option1} />
    <Checkbox label="Option 2" checked={selected.option2} />
    <Checkbox label="Option 3" checked={selected.option3} />
  </div>
</div>`,
        language: "tsx",
      },
      {
        title: "Disabled State",
        description: "Prevent user interaction",
        code: `<div className="space-y-2">
  <Checkbox label="Unchecked disabled" disabled />
  <Checkbox label="Checked disabled" checked disabled />
</div>`,
        language: "tsx",
      },
    ],
  },

  radio: {
    import: `import { Radio } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<Radio name="option" value="option1" label="Option 1" />`,
      language: "tsx",
    },
    variants: [
      {
        title: "Radio Group",
        description: "Group of radio buttons",
        code: `<div className="space-y-2">
  <Radio name="plan" value="free" label="Free Plan" />
  <Radio name="plan" value="pro" label="Pro Plan" />
  <Radio name="plan" value="enterprise" label="Enterprise Plan" />
</div>`,
        language: "tsx",
      },
      {
        title: "Controlled State",
        description: "Manage selected value",
        code: `const [selected, setSelected] = useState("option1");

return (
  <div className="space-y-2">
    <Radio
      name="preference"
      value="option1"
      label="Option 1"
      checked={selected === "option1"}
      onChange={() => setSelected("option1")}
    />
    <Radio
      name="preference"
      value="option2"
      label="Option 2"
      checked={selected === "option2"}
      onChange={() => setSelected("option2")}
    />
  </div>
);`,
        language: "tsx",
      },
    ],
  },

  "radio-group": {
    import: `import { RadioGroup } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<RadioGroup
  name="size"
  options={[
    { value: "sm", label: "Small" },
    { value: "md", label: "Medium" },
    { value: "lg", label: "Large" },
  ]}
  defaultValue="md"
/>`,
      language: "tsx",
    },
    variants: [
      {
        title: "Horizontal Layout",
        description: "Display options in a row",
        code: `<RadioGroup
  name="color"
  orientation="horizontal"
  options={[
    { value: "red", label: "Red" },
    { value: "green", label: "Green" },
    { value: "blue", label: "Blue" },
  ]}
/>`,
        language: "tsx",
      },
      {
        title: "With Descriptions",
        description: "Add descriptions to options",
        code: `<RadioGroup
  name="tier"
  options={[
    { value: "starter", label: "Starter", description: "Best for personal projects" },
    { value: "pro", label: "Pro", description: "Best for growing teams" },
    { value: "enterprise", label: "Enterprise", description: "Best for large organizations" },
  ]}
/>`,
        language: "tsx",
      },
      {
        title: "Controlled State",
        description: "Manage selection externally",
        code: `const [value, setValue] = useState("option1");

return (
  <RadioGroup
    name="preference"
    value={value}
    onChange={setValue}
    options={[
      { value: "option1", label: "Option 1" },
      { value: "option2", label: "Option 2" },
      { value: "option3", label: "Option 3" },
    ]}
  />
);`,
        language: "tsx",
      },
    ],
  },

  switch: {
    import: `import { Switch } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<Switch label="Enable notifications" />`,
      language: "tsx",
    },
    variants: [
      {
        title: "Sizes",
        description: "Available in multiple sizes",
        code: `<div className="flex items-center gap-4">
  <Switch size="sm" label="Small" />
  <Switch size="md" label="Medium" />
  <Switch size="lg" label="Large" />
</div>`,
        language: "tsx",
      },
      {
        title: "Controlled State",
        description: "Manage switch state",
        code: `const [enabled, setEnabled] = useState(false);

return (
  <Switch
    label="Dark mode"
    checked={enabled}
    onChange={(e) => setEnabled(e.target.checked)}
  />
);`,
        language: "tsx",
      },
      {
        title: "With Description",
        description: "Add context to the switch",
        code: `<Switch
  label="Marketing emails"
  description="Receive emails about new features and updates"
/>`,
        language: "tsx",
      },
      {
        title: "Disabled State",
        description: "Prevent user interaction",
        code: `<div className="space-y-2">
  <Switch label="Disabled off" disabled />
  <Switch label="Disabled on" checked disabled />
</div>`,
        language: "tsx",
      },
    ],
  },

  slider: {
    import: `import { Slider } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<Slider defaultValue={50} />`,
      language: "tsx",
    },
    variants: [
      {
        title: "With Min/Max/Step",
        description: "Configure range and increments",
        code: `<Slider min={0} max={100} step={10} defaultValue={50} />`,
        language: "tsx",
      },
      {
        title: "With Marks",
        description: "Show tick marks on the slider",
        code: `<Slider
  min={0}
  max={100}
  step={25}
  marks={[
    { value: 0, label: "0%" },
    { value: 25, label: "25%" },
    { value: 50, label: "50%" },
    { value: 75, label: "75%" },
    { value: 100, label: "100%" },
  ]}
/>`,
        language: "tsx",
      },
      {
        title: "Range Slider",
        description: "Select a range of values",
        code: `const [range, setRange] = useState([25, 75]);

return (
  <Slider
    value={range}
    onChange={setRange}
    min={0}
    max={100}
  />
);`,
        language: "tsx",
      },
      {
        title: "With Value Display",
        description: "Show current value",
        code: `const [value, setValue] = useState(50);

return (
  <div className="space-y-2">
    <div className="flex justify-between">
      <Label>Volume</Label>
      <span className="text-sm text-muted-foreground">{value}%</span>
    </div>
    <Slider value={value} onChange={setValue} />
  </div>
);`,
        language: "tsx",
      },
    ],
  },

  "number-input": {
    import: `import { NumberInput } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<NumberInput placeholder="Enter quantity" />`,
      language: "tsx",
    },
    variants: [
      {
        title: "With Min/Max",
        description: "Set value boundaries",
        code: `<NumberInput min={0} max={100} defaultValue={50} />`,
        language: "tsx",
      },
      {
        title: "With Step",
        description: "Custom increment value",
        code: `<NumberInput step={5} min={0} max={100} />`,
        language: "tsx",
      },
      {
        title: "With Precision",
        description: "Control decimal places",
        code: `<NumberInput precision={2} step={0.01} defaultValue={9.99} />`,
        language: "tsx",
      },
      {
        title: "With Label",
        description: "Using FieldWrapper for form layout",
        code: `<FieldWrapper label="Price" required>
  <NumberInput
    min={0}
    precision={2}
    step={0.01}
    placeholder="0.00"
  />
</FieldWrapper>`,
        language: "tsx",
      },
    ],
  },

  rating: {
    import: `import { Rating } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<Rating value={3} />`,
      language: "tsx",
    },
    variants: [
      {
        title: "Sizes",
        description: "Available in multiple sizes",
        code: `<div className="space-y-2">
  <Rating size="sm" value={4} />
  <Rating size="md" value={4} />
  <Rating size="lg" value={4} />
</div>`,
        language: "tsx",
      },
      {
        title: "Interactive",
        description: "Allow user to set rating",
        code: `const [rating, setRating] = useState(0);

return (
  <Rating
    value={rating}
    onChange={setRating}
    max={5}
  />
);`,
        language: "tsx",
      },
      {
        title: "Half Stars",
        description: "Allow half-star ratings",
        code: `<Rating
  value={3.5}
  allowHalf
  onChange={(value) => console.log(value)}
/>`,
        language: "tsx",
      },
      {
        title: "Read-only",
        description: "Display-only rating",
        code: `<Rating value={4.5} readonly allowHalf />`,
        language: "tsx",
      },
      {
        title: "Custom Max",
        description: "Change the maximum stars",
        code: `<Rating value={7} max={10} />`,
        language: "tsx",
      },
    ],
  },

  "field-wrapper": {
    import: `import { FieldWrapper } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<FieldWrapper label="Username">
  <Input placeholder="Enter username" />
</FieldWrapper>`,
      language: "tsx",
    },
    variants: [
      {
        title: "Required Field",
        description: "Show required indicator",
        code: `<FieldWrapper label="Email" required>
  <Input type="email" placeholder="you@example.com" />
</FieldWrapper>`,
        language: "tsx",
      },
      {
        title: "With Description",
        description: "Add helper text",
        code: `<FieldWrapper
  label="Password"
  description="Must be at least 8 characters"
  required
>
  <Input type="password" />
</FieldWrapper>`,
        language: "tsx",
      },
      {
        title: "With Error",
        description: "Show validation error",
        code: `<FieldWrapper
  label="Email"
  error="Please enter a valid email address"
>
  <Input type="email" error />
</FieldWrapper>`,
        language: "tsx",
      },
      {
        title: "Complete Form Example",
        description: "Full form with validation",
        code: `<form className="space-y-4">
  <FieldWrapper label="Name" required>
    <Input placeholder="John Doe" />
  </FieldWrapper>
  <FieldWrapper
    label="Email"
    required
    error={errors.email}
  >
    <Input type="email" error={!!errors.email} />
  </FieldWrapper>
  <FieldWrapper
    label="Bio"
    description="Tell us about yourself"
  >
    <Textarea rows={4} />
  </FieldWrapper>
  <Button type="submit">Submit</Button>
</form>`,
        language: "tsx",
      },
    ],
  },

  "tag-input": {
    import: `import { TagInput } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<TagInput
  value={["react", "typescript"]}
  onChange={setTags}
  placeholder="Add tags..."
/>`,
      language: "tsx",
    },
    variants: [
      {
        title: "With Suggestions",
        description: "Show autocomplete suggestions",
        code: `<TagInput
  value={tags}
  onChange={setTags}
  suggestions={["react", "vue", "angular", "svelte"]}
  placeholder="Type to search..."
/>`,
        language: "tsx",
      },
      {
        title: "Max Tags",
        description: "Limit number of tags",
        code: `<TagInput
  value={tags}
  onChange={setTags}
  maxTags={5}
  placeholder="Max 5 tags..."
/>`,
        language: "tsx",
      },
      {
        title: "Disable Create",
        description: "Only allow suggested values",
        code: `<TagInput
  value={tags}
  onChange={setTags}
  suggestions={availableTags}
  allowCreate={false}
  placeholder="Select from suggestions..."
/>`,
        language: "tsx",
      },
    ],
  },

  autocomplete: {
    import: `import { Autocomplete } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<Autocomplete
  options={[
    { value: "react", label: "React" },
    { value: "vue", label: "Vue" },
    { value: "angular", label: "Angular" },
  ]}
  placeholder="Search frameworks..."
/>`,
      language: "tsx",
    },
    variants: [
      {
        title: "Async Search",
        description: "Load options on search",
        code: `const [options, setOptions] = useState([]);
const [loading, setLoading] = useState(false);

const handleSearch = async (query) => {
  setLoading(true);
  const results = await searchUsers(query);
  setOptions(results);
  setLoading(false);
};

return (
  <Autocomplete
    options={options}
    onSearch={handleSearch}
    loading={loading}
    placeholder="Search users..."
  />
);`,
        language: "tsx",
      },
      {
        title: "Free Solo",
        description: "Allow custom values",
        code: `<Autocomplete
  options={commonEmails}
  freeSolo
  placeholder="Enter email..."
/>`,
        language: "tsx",
      },
      {
        title: "With Custom Render",
        description: "Custom option rendering",
        code: `<Autocomplete
  options={users}
  renderOption={(option) => (
    <div className="flex items-center gap-2">
      <Avatar size="sm" name={option.label} />
      <span>{option.label}</span>
    </div>
  )}
  placeholder="Search users..."
/>`,
        language: "tsx",
      },
    ],
  },

  "time-picker": {
    import: `import { TimePicker } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `const [time, setTime] = useState(null);

return (
  <TimePicker
    value={time}
    onChange={setTime}
    placeholder="Select time"
  />
);`,
      language: "tsx",
    },
    variants: [
      {
        title: "24-Hour Format",
        description: "Use 24-hour time format",
        code: `<TimePicker
  value={time}
  onChange={setTime}
  format="24h"
  placeholder="HH:MM"
/>`,
        language: "tsx",
      },
      {
        title: "Custom Minute Step",
        description: "Change minute increment",
        code: `<TimePicker
  value={time}
  onChange={setTime}
  minuteStep={30}
  placeholder="Select time (30 min intervals)"
/>`,
        language: "tsx",
      },
      {
        title: "With Label",
        description: "Using FieldWrapper",
        code: `<FieldWrapper label="Meeting Time" required>
  <TimePicker
    value={time}
    onChange={setTime}
    placeholder="Select meeting time"
  />
</FieldWrapper>`,
        language: "tsx",
      },
    ],
  },

  // =============================================================================
  // DISPLAY COMPONENTS
  // =============================================================================
  spinner: {
    import: `import { Spinner } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<Spinner />`,
      language: "tsx",
    },
    variants: [
      {
        title: "Sizes",
        description: "Available in multiple sizes",
        code: `<div className="flex items-center gap-4">
  <Spinner size="xs" />
  <Spinner size="sm" />
  <Spinner size="md" />
  <Spinner size="lg" />
  <Spinner size="xl" />
</div>`,
        language: "tsx",
      },
      {
        title: "Colors",
        description: "Different color options",
        code: `<div className="flex items-center gap-4">
  <Spinner color="primary" />
  <Spinner color="secondary" />
  <div className="bg-primary p-2 rounded">
    <Spinner color="white" />
  </div>
</div>`,
        language: "tsx",
      },
      {
        title: "Full Page Loading",
        description: "Centered loading indicator",
        code: `<div className="flex items-center justify-center min-h-[200px]">
  <Spinner size="lg" />
</div>`,
        language: "tsx",
      },
    ],
  },

  skeleton: {
    import: `import { Skeleton } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<Skeleton width={200} height={20} />`,
      language: "tsx",
    },
    variants: [
      {
        title: "Shapes",
        description: "Different skeleton shapes",
        code: `<div className="space-y-4">
  <Skeleton width={200} height={20} />
  <Skeleton width={100} height={100} rounded />
  <Skeleton width="100%" height={150} />
</div>`,
        language: "tsx",
      },
      {
        title: "Card Skeleton",
        description: "Loading state for cards",
        code: `<Card>
  <CardContent className="space-y-4 pt-6">
    <div className="flex items-center gap-4">
      <Skeleton width={48} height={48} rounded />
      <div className="space-y-2">
        <Skeleton width={150} height={16} />
        <Skeleton width={100} height={12} />
      </div>
    </div>
    <Skeleton width="100%" height={60} />
    <div className="flex gap-2">
      <Skeleton width={80} height={32} />
      <Skeleton width={80} height={32} />
    </div>
  </CardContent>
</Card>`,
        language: "tsx",
      },
      {
        title: "Static Skeleton",
        description: "Without animation",
        code: `<Skeleton width={200} height={20} animate={false} />`,
        language: "tsx",
      },
    ],
  },

  progress: {
    import: `import { Progress } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<Progress value={60} />`,
      language: "tsx",
    },
    variants: [
      {
        title: "Colors",
        description: "Different color options",
        code: `<div className="space-y-4">
  <Progress value={60} color="primary" />
  <Progress value={60} color="success" />
  <Progress value={60} color="warning" />
  <Progress value={60} color="destructive" />
</div>`,
        language: "tsx",
      },
      {
        title: "Sizes",
        description: "Available in multiple sizes",
        code: `<div className="space-y-4">
  <Progress value={60} size="sm" />
  <Progress value={60} size="md" />
  <Progress value={60} size="lg" />
</div>`,
        language: "tsx",
      },
      {
        title: "With Value Display",
        description: "Show percentage",
        code: `<Progress value={75} showValue />`,
        language: "tsx",
      },
      {
        title: "Circular Progress",
        description: "Circular variant",
        code: `<div className="flex items-center gap-4">
  <Progress variant="circular" value={25} size="sm" />
  <Progress variant="circular" value={50} size="md" />
  <Progress variant="circular" value={75} size="lg" showValue />
</div>`,
        language: "tsx",
      },
    ],
  },

  divider: {
    import: `import { Divider } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<Divider />`,
      language: "tsx",
    },
    variants: [
      {
        title: "Orientations",
        description: "Horizontal and vertical dividers",
        code: `<div className="space-y-4">
  <Divider orientation="horizontal" />
  <div className="flex items-center gap-4 h-10">
    <span>Left</span>
    <Divider orientation="vertical" />
    <span>Right</span>
  </div>
</div>`,
        language: "tsx",
      },
      {
        title: "Line Styles",
        description: "Different line styles",
        code: `<div className="space-y-4">
  <Divider variant="solid" />
  <Divider variant="dashed" />
  <Divider variant="dotted" />
</div>`,
        language: "tsx",
      },
      {
        title: "With Label",
        description: "Add text in the middle",
        code: `<Divider label="OR" />`,
        language: "tsx",
      },
    ],
  },

  text: {
    import: `import { Text } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<Text>This is body text</Text>`,
      language: "tsx",
    },
    variants: [
      {
        title: "Variants",
        description: "Typography variants",
        code: `<div className="space-y-2">
  <Text variant="h1">Heading 1</Text>
  <Text variant="h2">Heading 2</Text>
  <Text variant="h3">Heading 3</Text>
  <Text variant="h4">Heading 4</Text>
  <Text variant="body">Body text</Text>
  <Text variant="small">Small text</Text>
  <Text variant="muted">Muted text</Text>
</div>`,
        language: "tsx",
      },
      {
        title: "Colors",
        description: "Different text colors",
        code: `<div className="space-y-1">
  <Text color="default">Default color</Text>
  <Text color="muted">Muted color</Text>
  <Text color="primary">Primary color</Text>
  <Text color="destructive">Destructive color</Text>
</div>`,
        language: "tsx",
      },
      {
        title: "As Different Elements",
        description: "Render as specific HTML elements",
        code: `<Text variant="h1" as="h2">
  Styled as h1, rendered as h2
</Text>`,
        language: "tsx",
      },
    ],
  },

  label: {
    import: `import { Label } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<Label htmlFor="email">Email</Label>`,
      language: "tsx",
    },
    variants: [
      {
        title: "Required Label",
        description: "Show required indicator",
        code: `<Label htmlFor="name" required>Name</Label>`,
        language: "tsx",
      },
      {
        title: "With Input",
        description: "Complete form field",
        code: `<div className="space-y-2">
  <Label htmlFor="email" required>Email Address</Label>
  <Input id="email" type="email" placeholder="you@example.com" />
</div>`,
        language: "tsx",
      },
    ],
  },

  icon: {
    import: `import { Icon } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<Icon name="Home" />`,
      language: "tsx",
    },
    variants: [
      {
        title: "Sizes",
        description: "Available in multiple sizes",
        code: `<div className="flex items-center gap-4">
  <Icon name="Star" size="xs" />
  <Icon name="Star" size="sm" />
  <Icon name="Star" size="md" />
  <Icon name="Star" size="lg" />
  <Icon name="Star" size="xl" />
</div>`,
        language: "tsx",
      },
      {
        title: "Colors",
        description: "Custom icon colors",
        code: `<div className="flex items-center gap-4">
  <Icon name="Heart" color="red" />
  <Icon name="Star" color="yellow" />
  <Icon name="Check" color="green" />
</div>`,
        language: "tsx",
      },
      {
        title: "Common Icons",
        description: "Frequently used icons",
        code: `<div className="flex items-center gap-4">
  <Icon name="Home" />
  <Icon name="Settings" />
  <Icon name="User" />
  <Icon name="Search" />
  <Icon name="Menu" />
  <Icon name="X" />
</div>`,
        language: "tsx",
      },
    ],
  },

  link: {
    import: `import { AppLink } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<AppLink href="/dashboard">Go to Dashboard</AppLink>`,
      language: "tsx",
    },
    variants: [
      {
        title: "External Link",
        description: "Open in new tab with icon",
        code: `<AppLink href="https://example.com" external>
  Visit Example.com
</AppLink>`,
        language: "tsx",
      },
      {
        title: "Variants",
        description: "Different link styles",
        code: `<div className="space-y-2">
  <AppLink href="/page" variant="default">Default link</AppLink>
  <AppLink href="/page" variant="muted">Muted link</AppLink>
  <AppLink href="/page" variant="underline">Underlined link</AppLink>
</div>`,
        language: "tsx",
      },
    ],
  },

  kbd: {
    import: `import { Kbd } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<Kbd>Ctrl</Kbd>`,
      language: "tsx",
    },
    variants: [
      {
        title: "Keyboard Shortcuts",
        description: "Common keyboard combinations",
        code: `<div className="space-y-2">
  <div className="flex items-center gap-1">
    <Kbd>Ctrl</Kbd>
    <span>+</span>
    <Kbd>C</Kbd>
    <span className="ml-2 text-muted-foreground">Copy</span>
  </div>
  <div className="flex items-center gap-1">
    <Kbd>Ctrl</Kbd>
    <span>+</span>
    <Kbd>V</Kbd>
    <span className="ml-2 text-muted-foreground">Paste</span>
  </div>
  <div className="flex items-center gap-1">
    <Kbd>Ctrl</Kbd>
    <span>+</span>
    <Kbd>K</Kbd>
    <span className="ml-2 text-muted-foreground">Open command palette</span>
  </div>
</div>`,
        language: "tsx",
      },
    ],
  },

  "status-badge": {
    import: `import { StatusBadge } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<StatusBadge status="success" label="Active" />`,
      language: "tsx",
    },
    variants: [
      {
        title: "Status Types",
        description: "All available status types",
        code: `<div className="flex flex-wrap gap-2">
  <StatusBadge status="success" label="Active" />
  <StatusBadge status="warning" label="Pending" />
  <StatusBadge status="error" label="Failed" />
  <StatusBadge status="info" label="Processing" />
  <StatusBadge status="pending" label="Waiting" />
</div>`,
        language: "tsx",
      },
      {
        title: "Sizes",
        description: "Available in multiple sizes",
        code: `<div className="flex items-center gap-2">
  <StatusBadge status="success" size="sm" label="Small" />
  <StatusBadge status="success" size="md" label="Medium" />
  <StatusBadge status="success" size="lg" label="Large" />
</div>`,
        language: "tsx",
      },
    ],
  },

  "copy-button": {
    import: `import { CopyButton } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<CopyButton text="Text to copy" />`,
      language: "tsx",
    },
    variants: [
      {
        title: "Variants",
        description: "Icon-only or with label",
        code: `<div className="flex items-center gap-4">
  <CopyButton text="Text to copy" variant="icon" />
  <CopyButton text="Text to copy" variant="button" />
</div>`,
        language: "tsx",
      },
      {
        title: "With Callback",
        description: "Handle copy event",
        code: `<CopyButton
  text="API_KEY_12345"
  onCopy={(text) => toast.success("API key copied!")}
/>`,
        language: "tsx",
      },
    ],
  },

  "copyable-text": {
    import: `import { CopyableText } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<CopyableText text="sk_live_abc123xyz" />`,
      language: "tsx",
    },
    variants: [
      {
        title: "Truncated",
        description: "Truncate long text",
        code: `<CopyableText
  text="sk_live_abc123xyz789def456ghi"
  truncate
/>`,
        language: "tsx",
      },
      {
        title: "API Key Display",
        description: "Common use case for secrets",
        code: `<div className="space-y-2">
  <Label>API Key</Label>
  <div className="p-3 bg-muted rounded-md font-mono text-sm">
    <CopyableText text="sk_live_abc123xyz789def456ghi" truncate />
  </div>
</div>`,
        language: "tsx",
      },
    ],
  },

  "qr-code": {
    import: `import { QRCode } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<QRCode value="https://example.com" />`,
      language: "tsx",
    },
    variants: [
      {
        title: "Sizes",
        description: "Different QR code sizes",
        code: `<div className="flex items-end gap-4">
  <QRCode value="https://example.com" size={64} />
  <QRCode value="https://example.com" size={128} />
  <QRCode value="https://example.com" size={200} />
</div>`,
        language: "tsx",
      },
      {
        title: "With Download",
        description: "Enable download button",
        code: `<QRCode
  value="https://example.com"
  size={200}
  download
/>`,
        language: "tsx",
      },
      {
        title: "Error Correction",
        description: "Different error correction levels",
        code: `<div className="flex items-end gap-4">
  <div className="text-center">
    <QRCode value="https://example.com" errorCorrection="L" size={100} />
    <span className="text-xs text-muted-foreground">Low</span>
  </div>
  <div className="text-center">
    <QRCode value="https://example.com" errorCorrection="M" size={100} />
    <span className="text-xs text-muted-foreground">Medium</span>
  </div>
  <div className="text-center">
    <QRCode value="https://example.com" errorCorrection="H" size={100} />
    <span className="text-xs text-muted-foreground">High</span>
  </div>
</div>`,
        language: "tsx",
      },
    ],
  },

  // =============================================================================
  // FEEDBACK COMPONENTS
  // =============================================================================
  alert: {
    import: `import { Alert, AlertTitle, AlertDescription } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<Alert>
  <AlertTitle>Heads up!</AlertTitle>
  <AlertDescription>
    You can add components to your app using the cli.
  </AlertDescription>
</Alert>`,
      language: "tsx",
    },
    variants: [
      {
        title: "Variants",
        description: "Different alert types",
        code: `<div className="space-y-4">
  <Alert variant="default">
    <AlertTitle>Default</AlertTitle>
    <AlertDescription>This is a default alert.</AlertDescription>
  </Alert>
  <Alert variant="info">
    <AlertTitle>Info</AlertTitle>
    <AlertDescription>This is an informational alert.</AlertDescription>
  </Alert>
  <Alert variant="success">
    <AlertTitle>Success</AlertTitle>
    <AlertDescription>Operation completed successfully.</AlertDescription>
  </Alert>
  <Alert variant="warning">
    <AlertTitle>Warning</AlertTitle>
    <AlertDescription>Please review before proceeding.</AlertDescription>
  </Alert>
  <Alert variant="destructive">
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>Something went wrong.</AlertDescription>
  </Alert>
</div>`,
        language: "tsx",
      },
      {
        title: "With Icon",
        description: "Add custom icons",
        code: `<Alert variant="info">
  <Info className="h-4 w-4" />
  <AlertTitle>New Update Available</AlertTitle>
  <AlertDescription>
    A new software update is available. Download now to get the latest features.
  </AlertDescription>
</Alert>`,
        language: "tsx",
      },
      {
        title: "Dismissible",
        description: "Allow users to close the alert",
        code: `const [show, setShow] = useState(true);

return show ? (
  <Alert variant="success" onClose={() => setShow(false)}>
    <AlertTitle>Success!</AlertTitle>
    <AlertDescription>Your changes have been saved.</AlertDescription>
  </Alert>
) : null;`,
        language: "tsx",
      },
    ],
  },

  toast: {
    import: `import { toast } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `toast("Event has been created");`,
      language: "tsx",
    },
    variants: [
      {
        title: "Toast Types",
        description: "Different toast variants",
        code: `<div className="flex flex-wrap gap-2">
  <Button onClick={() => toast("Default toast message")}>
    Default
  </Button>
  <Button onClick={() => toast.success("Successfully saved!")}>
    Success
  </Button>
  <Button onClick={() => toast.error("Something went wrong")}>
    Error
  </Button>
  <Button onClick={() => toast.warning("Please review your input")}>
    Warning
  </Button>
  <Button onClick={() => toast.info("New update available")}>
    Info
  </Button>
</div>`,
        language: "tsx",
      },
      {
        title: "With Description",
        description: "Add more context",
        code: `toast.success("Profile updated", {
  description: "Your changes have been saved successfully.",
});`,
        language: "tsx",
      },
      {
        title: "With Action",
        description: "Add action button",
        code: `toast("File deleted", {
  action: {
    label: "Undo",
    onClick: () => handleUndo(),
  },
});`,
        language: "tsx",
      },
      {
        title: "Custom Duration",
        description: "Control how long toast is shown",
        code: `toast.success("Quick message", {
  duration: 2000, // 2 seconds
});

toast.error("Important error", {
  duration: 10000, // 10 seconds
});`,
        language: "tsx",
      },
      {
        title: "Loading Toast",
        description: "Show loading then update",
        code: `const id = toast.loading("Saving...");

await saveData();

toast.success("Saved successfully!", { id });`,
        language: "tsx",
      },
    ],
  },

  tooltip: {
    import: `import { Tooltip } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<Tooltip content="This is a tooltip">
  <Button variant="outline">Hover me</Button>
</Tooltip>`,
      language: "tsx",
    },
    variants: [
      {
        title: "Positions",
        description: "Different tooltip placements",
        code: `<div className="flex gap-4">
  <Tooltip content="Top tooltip" side="top">
    <Button variant="outline">Top</Button>
  </Tooltip>
  <Tooltip content="Right tooltip" side="right">
    <Button variant="outline">Right</Button>
  </Tooltip>
  <Tooltip content="Bottom tooltip" side="bottom">
    <Button variant="outline">Bottom</Button>
  </Tooltip>
  <Tooltip content="Left tooltip" side="left">
    <Button variant="outline">Left</Button>
  </Tooltip>
</div>`,
        language: "tsx",
      },
      {
        title: "Rich Content",
        description: "Complex tooltip content",
        code: `<Tooltip
  content={
    <div className="space-y-1">
      <p className="font-semibold">Delete Item</p>
      <p className="text-xs text-muted-foreground">
        This action cannot be undone.
      </p>
    </div>
  }
>
  <Button variant="destructive">Delete</Button>
</Tooltip>`,
        language: "tsx",
      },
      {
        title: "Without Arrow",
        description: "Hide the tooltip arrow",
        code: `<Tooltip content="No arrow" arrow={false}>
  <Button variant="outline">Hover me</Button>
</Tooltip>`,
        language: "tsx",
      },
      {
        title: "Custom Delay",
        description: "Change show delay",
        code: `<Tooltip content="Delayed tooltip" delay={500}>
  <Button variant="outline">Wait for it...</Button>
</Tooltip>`,
        language: "tsx",
      },
    ],
  },

  popover: {
    import: `import { Popover } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<Popover
  trigger={<Button variant="outline">Open Popover</Button>}
  content={
    <div className="space-y-2">
      <h4 className="font-medium">Dimensions</h4>
      <p className="text-sm text-muted-foreground">
        Set the dimensions for the layer.
      </p>
    </div>
  }
/>`,
      language: "tsx",
    },
    variants: [
      {
        title: "Positions",
        description: "Different popover placements",
        code: `<div className="flex gap-4">
  <Popover
    side="top"
    trigger={<Button variant="outline">Top</Button>}
    content={<p>Top popover content</p>}
  />
  <Popover
    side="right"
    trigger={<Button variant="outline">Right</Button>}
    content={<p>Right popover content</p>}
  />
  <Popover
    side="bottom"
    trigger={<Button variant="outline">Bottom</Button>}
    content={<p>Bottom popover content</p>}
  />
  <Popover
    side="left"
    trigger={<Button variant="outline">Left</Button>}
    content={<p>Left popover content</p>}
  />
</div>`,
        language: "tsx",
      },
      {
        title: "With Form",
        description: "Form inside popover",
        code: `<Popover
  trigger={<Button>Update dimensions</Button>}
  content={
    <div className="space-y-4 w-64">
      <div className="space-y-2">
        <Label htmlFor="width">Width</Label>
        <Input id="width" defaultValue="100%" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="height">Height</Label>
        <Input id="height" defaultValue="auto" />
      </div>
      <Button className="w-full">Save</Button>
    </div>
  }
/>`,
        language: "tsx",
      },
    ],
  },

  modal: {
    import: `import { Modal } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `const [open, setOpen] = useState(false);

return (
  <>
    <Button onClick={() => setOpen(true)}>Open Modal</Button>
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title="Edit Profile"
      description="Make changes to your profile here."
      footer={
        <>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setOpen(false)}>Save</Button>
        </>
      }
    >
      <div className="space-y-4">
        <FieldWrapper label="Name">
          <Input defaultValue="John Doe" />
        </FieldWrapper>
        <FieldWrapper label="Email">
          <Input type="email" defaultValue="john@example.com" />
        </FieldWrapper>
      </div>
    </Modal>
  </>
);`,
      language: "tsx",
    },
    variants: [
      {
        title: "Confirmation Modal",
        description: "Simple confirmation dialog",
        code: `<Modal
  open={open}
  onClose={onClose}
  title="Delete Item"
  description="Are you sure you want to delete this item? This action cannot be undone."
  footer={
    <>
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button variant="destructive" onClick={handleDelete}>Delete</Button>
    </>
  }
/>`,
        language: "tsx",
      },
    ],
  },

  // =============================================================================
  // NAVIGATION COMPONENTS
  // =============================================================================
  breadcrumb: {
    import: `import { Breadcrumb } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<Breadcrumb
  items={[
    { label: "Home", href: "/" },
    { label: "Products", href: "/products" },
    { label: "Electronics", href: "/products/electronics" },
    { label: "Phones" },
  ]}
/>`,
      language: "tsx",
    },
    variants: [
      {
        title: "Custom Separator",
        description: "Use different separators",
        code: `<Breadcrumb
  items={[
    { label: "Home", href: "/" },
    { label: "Products", href: "/products" },
    { label: "Details" },
  ]}
  separator=">"
/>`,
        language: "tsx",
      },
      {
        title: "With Max Items",
        description: "Collapse middle items",
        code: `<Breadcrumb
  items={[
    { label: "Home", href: "/" },
    { label: "Category", href: "/category" },
    { label: "Subcategory", href: "/category/sub" },
    { label: "Products", href: "/category/sub/products" },
    { label: "Product Details" },
  ]}
  maxItems={3}
/>`,
        language: "tsx",
      },
    ],
  },

  pagination: {
    import: `import { Pagination } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `const [page, setPage] = useState(1);

return (
  <Pagination
    page={page}
    totalPages={10}
    onPageChange={setPage}
  />
);`,
      language: "tsx",
    },
    variants: [
      {
        title: "With Page Size",
        description: "Show page size selector",
        code: `<Pagination
  page={page}
  totalPages={totalPages}
  pageSize={pageSize}
  onPageChange={setPage}
  onPageSizeChange={setPageSize}
  showSizeChanger
/>`,
        language: "tsx",
      },
      {
        title: "Simple Pagination",
        description: "Just previous/next buttons",
        code: `<div className="flex items-center justify-between">
  <Button
    variant="outline"
    onClick={() => setPage(page - 1)}
    disabled={page === 1}
  >
    Previous
  </Button>
  <span className="text-sm text-muted-foreground">
    Page {page} of {totalPages}
  </span>
  <Button
    variant="outline"
    onClick={() => setPage(page + 1)}
    disabled={page === totalPages}
  >
    Next
  </Button>
</div>`,
        language: "tsx",
      },
    ],
  },

  "nav-link": {
    import: `import { NavLink } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<NavLink href="/dashboard">Dashboard</NavLink>`,
      language: "tsx",
    },
    variants: [
      {
        title: "With Icon",
        description: "Add icon to nav link",
        code: `<NavLink href="/dashboard" icon="LayoutDashboard">
  Dashboard
</NavLink>`,
        language: "tsx",
      },
      {
        title: "Sidebar Navigation",
        description: "Common sidebar pattern",
        code: `<nav className="space-y-1">
  <NavLink href="/dashboard" icon="LayoutDashboard" variant="sidebar">
    Dashboard
  </NavLink>
  <NavLink href="/users" icon="Users" variant="sidebar">
    Users
  </NavLink>
  <NavLink href="/settings" icon="Settings" variant="sidebar">
    Settings
  </NavLink>
</nav>`,
        language: "tsx",
      },
      {
        title: "Tab Style",
        description: "Tab navigation style",
        code: `<div className="flex gap-4 border-b">
  <NavLink href="/overview" variant="tab">Overview</NavLink>
  <NavLink href="/analytics" variant="tab">Analytics</NavLink>
  <NavLink href="/reports" variant="tab">Reports</NavLink>
</div>`,
        language: "tsx",
      },
    ],
  },

  stepper: {
    import: `import { Stepper, Step } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<Stepper activeStep={1}>
  <Step title="Account" description="Create your account" />
  <Step title="Profile" description="Add your details" />
  <Step title="Complete" description="Finish setup" />
</Stepper>`,
      language: "tsx",
    },
    variants: [
      {
        title: "Vertical Orientation",
        description: "Stack steps vertically",
        code: `<Stepper activeStep={1} orientation="vertical">
  <Step title="Order Placed" description="January 15, 2024" />
  <Step title="Processing" description="January 16, 2024" />
  <Step title="Shipped" description="Pending" />
  <Step title="Delivered" description="Pending" />
</Stepper>`,
        language: "tsx",
      },
      {
        title: "Clickable Steps",
        description: "Allow navigation between steps",
        code: `<Stepper activeStep={step} clickable onStepClick={setStep}>
  <Step title="Cart" />
  <Step title="Shipping" />
  <Step title="Payment" />
  <Step title="Confirm" />
</Stepper>`,
        language: "tsx",
      },
      {
        title: "With Status",
        description: "Show step status",
        code: `<Stepper activeStep={2}>
  <Step title="Account" status="completed" />
  <Step title="Profile" status="completed" />
  <Step title="Verification" status="current" />
  <Step title="Complete" status="pending" />
</Stepper>`,
        language: "tsx",
      },
    ],
  },

  timeline: {
    import: `import { Timeline, TimelineItem } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<Timeline>
  <TimelineItem
    title="Order Placed"
    description="Your order has been placed successfully."
    time="2 hours ago"
  />
  <TimelineItem
    title="Processing"
    description="Your order is being processed."
    time="1 hour ago"
  />
  <TimelineItem
    title="Shipped"
    description="Your order has been shipped."
    time="Just now"
  />
</Timeline>`,
      language: "tsx",
    },
    variants: [
      {
        title: "With Icons",
        description: "Add icons to timeline items",
        code: `<Timeline>
  <TimelineItem
    icon="ShoppingCart"
    title="Order Placed"
    description="Order #12345 was created"
    time="Dec 15, 2024"
  />
  <TimelineItem
    icon="Package"
    title="Order Shipped"
    description="Package left the warehouse"
    time="Dec 16, 2024"
  />
  <TimelineItem
    icon="Truck"
    title="Out for Delivery"
    description="Your package is on its way"
    time="Dec 17, 2024"
  />
</Timeline>`,
        language: "tsx",
      },
      {
        title: "Alternating",
        description: "Items alternate sides",
        code: `<Timeline alternating>
  <TimelineItem title="2020" description="Company founded" />
  <TimelineItem title="2021" description="First product launch" />
  <TimelineItem title="2022" description="Series A funding" />
  <TimelineItem title="2023" description="Global expansion" />
</Timeline>`,
        language: "tsx",
      },
    ],
  },

  accordion: {
    import: `import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>Is it accessible?</AccordionTrigger>
    <AccordionContent>
      Yes. It adheres to the WAI-ARIA design pattern.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-2">
    <AccordionTrigger>Is it styled?</AccordionTrigger>
    <AccordionContent>
      Yes. It comes with default styles that match the other components.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-3">
    <AccordionTrigger>Is it animated?</AccordionTrigger>
    <AccordionContent>
      Yes. It's animated by default with smooth transitions.
    </AccordionContent>
  </AccordionItem>
</Accordion>`,
      language: "tsx",
    },
    variants: [
      {
        title: "Multiple Open",
        description: "Allow multiple items open at once",
        code: `<Accordion type="multiple" defaultValue={["item-1", "item-2"]}>
  <AccordionItem value="item-1">
    <AccordionTrigger>Section 1</AccordionTrigger>
    <AccordionContent>Content for section 1</AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-2">
    <AccordionTrigger>Section 2</AccordionTrigger>
    <AccordionContent>Content for section 2</AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-3">
    <AccordionTrigger>Section 3</AccordionTrigger>
    <AccordionContent>Content for section 3</AccordionContent>
  </AccordionItem>
</Accordion>`,
        language: "tsx",
      },
      {
        title: "FAQ Section",
        description: "Common FAQ pattern",
        code: `<Accordion type="single" collapsible className="w-full">
  {faqs.map((faq, index) => (
    <AccordionItem key={index} value={\`faq-\${index}\`}>
      <AccordionTrigger>{faq.question}</AccordionTrigger>
      <AccordionContent>{faq.answer}</AccordionContent>
    </AccordionItem>
  ))}
</Accordion>`,
        language: "tsx",
      },
    ],
  },

  collapsible: {
    import: `import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<Collapsible>
  <CollapsibleTrigger asChild>
    <Button variant="ghost" className="w-full justify-between">
      Toggle Content
      <ChevronDown className="h-4 w-4" />
    </Button>
  </CollapsibleTrigger>
  <CollapsibleContent>
    <div className="p-4">
      This content can be collapsed and expanded.
    </div>
  </CollapsibleContent>
</Collapsible>`,
      language: "tsx",
    },
    variants: [
      {
        title: "Controlled State",
        description: "Manage open state externally",
        code: `const [open, setOpen] = useState(false);

return (
  <Collapsible open={open} onOpenChange={setOpen}>
    <CollapsibleTrigger asChild>
      <Button variant="outline">
        {open ? "Hide" : "Show"} details
      </Button>
    </CollapsibleTrigger>
    <CollapsibleContent>
      <div className="mt-4 p-4 border rounded">
        Detailed information goes here...
      </div>
    </CollapsibleContent>
  </Collapsible>
);`,
        language: "tsx",
      },
      {
        title: "Sidebar Menu",
        description: "Common sidebar pattern",
        code: `<Collapsible defaultOpen>
  <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 hover:bg-muted rounded">
    <Folder className="h-4 w-4" />
    <span>Documents</span>
    <ChevronDown className="ml-auto h-4 w-4" />
  </CollapsibleTrigger>
  <CollapsibleContent className="ml-6 space-y-1">
    <NavLink href="/docs/intro">Introduction</NavLink>
    <NavLink href="/docs/guide">Guide</NavLink>
    <NavLink href="/docs/api">API Reference</NavLink>
  </CollapsibleContent>
</Collapsible>`,
        language: "tsx",
      },
    ],
  },

  // =============================================================================
  // ACTION COMPONENTS
  // =============================================================================
  "icon-button": {
    import: `import { IconButton } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<IconButton icon="Settings" label="Settings" />`,
      language: "tsx",
    },
    variants: [
      {
        title: "Variants",
        description: "Different button styles",
        code: `<div className="flex items-center gap-2">
  <IconButton icon="Edit" label="Edit" variant="ghost" />
  <IconButton icon="Copy" label="Copy" variant="outline" />
  <IconButton icon="Trash" label="Delete" variant="primary" />
</div>`,
        language: "tsx",
      },
      {
        title: "Sizes",
        description: "Available in multiple sizes",
        code: `<div className="flex items-center gap-2">
  <IconButton icon="Plus" label="Add" size="sm" />
  <IconButton icon="Plus" label="Add" size="md" />
  <IconButton icon="Plus" label="Add" size="lg" />
</div>`,
        language: "tsx",
      },
      {
        title: "Common Actions",
        description: "Typical toolbar pattern",
        code: `<div className="flex items-center gap-1 p-2 border rounded">
  <IconButton icon="Bold" label="Bold" />
  <IconButton icon="Italic" label="Italic" />
  <IconButton icon="Underline" label="Underline" />
  <Divider orientation="vertical" className="h-6 mx-2" />
  <IconButton icon="AlignLeft" label="Align Left" />
  <IconButton icon="AlignCenter" label="Align Center" />
  <IconButton icon="AlignRight" label="Align Right" />
</div>`,
        language: "tsx",
      },
    ],
  },

  "confirm-button": {
    import: `import { ConfirmButton } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<ConfirmButton
  onConfirm={() => handleDelete()}
  title="Delete Item"
  message="Are you sure you want to delete this item?"
>
  Delete
</ConfirmButton>`,
      language: "tsx",
    },
    variants: [
      {
        title: "Confirmation Modes",
        description: "Different confirmation styles",
        code: `<div className="flex gap-2">
  <ConfirmButton
    mode="dialog"
    onConfirm={handleDelete}
    title="Delete"
    message="This action cannot be undone."
  >
    Dialog Mode
  </ConfirmButton>
  <ConfirmButton
    mode="popover"
    onConfirm={handleDelete}
    message="Delete this item?"
  >
    Popover Mode
  </ConfirmButton>
  <ConfirmButton
    mode="double-click"
    onConfirm={handleDelete}
  >
    Double Click
  </ConfirmButton>
</div>`,
        language: "tsx",
      },
      {
        title: "Custom Text",
        description: "Customize confirmation dialog",
        code: `<ConfirmButton
  variant="destructive"
  onConfirm={handleDelete}
  title="Delete Account"
  message="This will permanently delete your account and all associated data."
  confirmText="Yes, delete my account"
  cancelText="Keep my account"
>
  Delete Account
</ConfirmButton>`,
        language: "tsx",
      },
    ],
  },

  "theme-toggle": {
    import: `import { ThemeToggle } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<ThemeToggle />`,
      language: "tsx",
    },
    variants: [
      {
        title: "Variants",
        description: "Different toggle styles",
        code: `<div className="flex items-center gap-4">
  <ThemeToggle variant="icon" />
  <ThemeToggle variant="switch" />
  <ThemeToggle variant="dropdown" />
</div>`,
        language: "tsx",
      },
      {
        title: "Sizes",
        description: "Available sizes",
        code: `<div className="flex items-center gap-4">
  <ThemeToggle size="sm" />
  <ThemeToggle size="md" />
  <ThemeToggle size="lg" />
</div>`,
        language: "tsx",
      },
    ],
  },

  "theme-selector": {
    import: `import { ThemeSelector } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<ThemeSelector />`,
      language: "tsx",
    },
    variants: [
      {
        title: "With Label",
        description: "Show selected theme name",
        code: `<ThemeSelector variant="labeled" />`,
        language: "tsx",
      },
      {
        title: "In Settings",
        description: "Common settings pattern",
        code: `<div className="flex items-center justify-between">
  <div>
    <Label>Theme</Label>
    <p className="text-sm text-muted-foreground">
      Select your preferred theme
    </p>
  </div>
  <ThemeSelector />
</div>`,
        language: "tsx",
      },
    ],
  },

  // =============================================================================
  // DATA TABLE COMPONENT
  // =============================================================================
  "data-table": {
    import: `import { DataTable } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `const columns = [
  { key: "name", header: "Name" },
  { key: "email", header: "Email" },
  { key: "role", header: "Role" },
];

const data = [
  { id: 1, name: "John Doe", email: "john@example.com", role: "Admin" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", role: "User" },
];

return <DataTable columns={columns} data={data} />;`,
      language: "tsx",
    },
    variants: [
      {
        title: "With Loading",
        description: "Show loading state",
        code: `<DataTable
  columns={columns}
  data={data}
  loading={isLoading}
/>`,
        language: "tsx",
      },
      {
        title: "Empty State",
        description: "Custom empty message",
        code: `<DataTable
  columns={columns}
  data={[]}
  emptyMessage="No users found. Create your first user to get started."
/>`,
        language: "tsx",
      },
      {
        title: "With Custom Cells",
        description: "Render custom cell content",
        code: `const columns = [
  { key: "name", header: "Name" },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <StatusBadge status={row.status} label={row.statusLabel} />
    ),
  },
  {
    key: "actions",
    header: "",
    render: (row) => (
      <DropdownMenu
        trigger={<IconButton icon="MoreVertical" label="Actions" />}
        items={[
          { type: "item", label: "Edit", onClick: () => handleEdit(row) },
          { type: "item", label: "Delete", destructive: true },
        ]}
      />
    ),
  },
];`,
        language: "tsx",
      },
    ],
  },

  // =============================================================================
  // LAYOUT COMPONENTS
  // =============================================================================
  stack: {
    import: `import { Stack } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<Stack gap="md">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</Stack>`,
      language: "tsx",
    },
    variants: [
      {
        title: "Horizontal Stack",
        description: "Row direction",
        code: `<Stack direction="row" gap="md">
  <Button>Button 1</Button>
  <Button>Button 2</Button>
  <Button>Button 3</Button>
</Stack>`,
        language: "tsx",
      },
      {
        title: "Gap Sizes",
        description: "Different spacing options",
        code: `<Stack gap="xs">Extra small gap</Stack>
<Stack gap="sm">Small gap</Stack>
<Stack gap="md">Medium gap (default)</Stack>
<Stack gap="lg">Large gap</Stack>
<Stack gap="xl">Extra large gap</Stack>`,
        language: "tsx",
      },
      {
        title: "Alignment",
        description: "Control alignment",
        code: `<Stack direction="row" align="center" justify="between" className="w-full">
  <Logo />
  <nav className="flex gap-4">
    <NavLink href="/home">Home</NavLink>
    <NavLink href="/about">About</NavLink>
  </nav>
  <Button>Sign In</Button>
</Stack>`,
        language: "tsx",
      },
    ],
  },

  "auth-layout": {
    import: `import { AuthLayout } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<AuthLayout
  title="Welcome back"
  description="Enter your credentials to access your account"
>
  <form className="space-y-4">
    <FieldWrapper label="Email" required>
      <Input type="email" placeholder="you@example.com" />
    </FieldWrapper>
    <FieldWrapper label="Password" required>
      <Input type="password" />
    </FieldWrapper>
    <Button className="w-full">Sign In</Button>
  </form>
</AuthLayout>`,
      language: "tsx",
    },
    variants: [
      {
        title: "Sign Up Page",
        description: "Registration form layout",
        code: `<AuthLayout
  title="Create an account"
  description="Start your 14-day free trial"
  showLogo
>
  <form className="space-y-4">
    <FieldWrapper label="Full Name" required>
      <Input placeholder="John Doe" />
    </FieldWrapper>
    <FieldWrapper label="Email" required>
      <Input type="email" placeholder="you@example.com" />
    </FieldWrapper>
    <FieldWrapper label="Password" required>
      <Input type="password" />
    </FieldWrapper>
    <Button className="w-full">Create Account</Button>
    <p className="text-center text-sm text-muted-foreground">
      Already have an account? <AppLink href="/login">Sign in</AppLink>
    </p>
  </form>
</AuthLayout>`,
        language: "tsx",
      },
    ],
  },

  "page-layout": {
    import: `import { PageLayout } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<PageLayout>
  <Container>
    <h1>Page Title</h1>
    <p>Page content goes here</p>
  </Container>
</PageLayout>`,
      language: "tsx",
    },
    variants: [
      {
        title: "With Sidebar",
        description: "Add sidebar navigation",
        code: `<PageLayout
  sidebar={
    <nav className="space-y-1 p-4">
      <NavLink href="/docs/intro">Introduction</NavLink>
      <NavLink href="/docs/installation">Installation</NavLink>
      <NavLink href="/docs/components">Components</NavLink>
    </nav>
  }
  sidebarWidth={280}
>
  <Container>
    <h1>Documentation</h1>
    <p>Content here...</p>
  </Container>
</PageLayout>`,
        language: "tsx",
      },
      {
        title: "Collapsible Sidebar",
        description: "Allow sidebar to collapse",
        code: `<PageLayout
  sidebar={<Sidebar />}
  sidebarPosition="left"
  collapsible
>
  {children}
</PageLayout>`,
        language: "tsx",
      },
    ],
  },

  "split-layout": {
    import: `import { SplitLayout } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `<SplitLayout
  left={
    <div className="p-4">
      <h2>Left Panel</h2>
      <p>Left content here</p>
    </div>
  }
  right={
    <div className="p-4">
      <h2>Right Panel</h2>
      <p>Right content here</p>
    </div>
  }
/>`,
      language: "tsx",
    },
    variants: [
      {
        title: "Custom Ratio",
        description: "Different split ratios",
        code: `<SplitLayout
  ratio="30/70"
  left={<Sidebar />}
  right={<MainContent />}
/>`,
        language: "tsx",
      },
      {
        title: "Resizable",
        description: "Allow user to resize panels",
        code: `<SplitLayout
  resizable
  left={<FileTree />}
  right={<Editor />}
/>`,
        language: "tsx",
      },
      {
        title: "Email Client Layout",
        description: "Common email app pattern",
        code: `<SplitLayout
  ratio="30/70"
  left={
    <div className="h-full overflow-auto">
      <SearchInput placeholder="Search emails..." />
      <EmailList emails={emails} />
    </div>
  }
  right={
    <div className="h-full overflow-auto">
      <EmailDetail email={selectedEmail} />
    </div>
  }
/>`,
        language: "tsx",
      },
    ],
  },

  "command-palette": {
    import: `import { CommandPalette } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `const [open, setOpen] = useState(false);

useEffect(() => {
  const down = (e) => {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setOpen((open) => !open);
    }
  };
  document.addEventListener("keydown", down);
  return () => document.removeEventListener("keydown", down);
}, []);

return (
  <CommandPalette
    open={open}
    onOpenChange={setOpen}
    commands={[
      {
        group: "Navigation",
        items: [
          { label: "Home", icon: "Home", onSelect: () => router.push("/") },
          { label: "Dashboard", icon: "LayoutDashboard", onSelect: () => router.push("/dashboard") },
        ],
      },
      {
        group: "Actions",
        items: [
          { label: "Create Project", icon: "Plus", onSelect: createProject },
          { label: "Settings", icon: "Settings", onSelect: openSettings },
        ],
      },
    ]}
  />
);`,
      language: "tsx",
    },
    variants: [
      {
        title: "With Search",
        description: "Fuzzy search through commands",
        code: `<CommandPalette
  open={open}
  onOpenChange={setOpen}
  placeholder="Type a command or search..."
  commands={commands}
/>`,
        language: "tsx",
      },
    ],
  },

  "password-strength": {
    import: `import { PasswordStrengthMeter } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `const [password, setPassword] = useState("");

return (
  <div className="space-y-2">
    <FieldWrapper label="Password" required>
      <Input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
    </FieldWrapper>
    <PasswordStrengthMeter password={password} />
  </div>
);`,
      language: "tsx",
    },
    variants: [
      {
        title: "With Requirements",
        description: "Show password requirements",
        code: `<PasswordStrengthMeter
  password={password}
  minLength={12}
  showRequirements
/>`,
        language: "tsx",
      },
      {
        title: "Hide Requirements",
        description: "Just show strength bar",
        code: `<PasswordStrengthMeter
  password={password}
  showRequirements={false}
/>`,
        language: "tsx",
      },
    ],
  },

  "rich-text-editor": {
    import: `import { RichTextEditor } from "@/components/ui";`,
    basic: {
      title: "Basic Usage",
      code: `const [content, setContent] = useState("");

return (
  <RichTextEditor
    value={content}
    onChange={setContent}
    placeholder="Write your content here..."
  />
);`,
      language: "tsx",
    },
    variants: [
      {
        title: "Custom Toolbar",
        description: "Customize available formatting options",
        code: `<RichTextEditor
  value={content}
  onChange={setContent}
  toolbar={["bold", "italic", "underline", "link", "bulletList", "orderedList"]}
/>`,
        language: "tsx",
      },
      {
        title: "With Form",
        description: "Inside a form with validation",
        code: `<FieldWrapper label="Description" error={errors.description}>
  <RichTextEditor
    value={description}
    onChange={setDescription}
    placeholder="Describe your project..."
  />
</FieldWrapper>`,
        language: "tsx",
      },
    ],
  },
};
