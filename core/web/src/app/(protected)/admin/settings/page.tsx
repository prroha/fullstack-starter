"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  Button,
  Icon,
  Text,
  Input,
  Textarea,
  Select,
  Badge,
  Modal,
  Switch,
  Spinner,
  DataTable,
  IconButton,
  Label,
  ExportCsvButton,
  ConfirmButton,
} from "@/components/ui";
import { api, Setting, CreateSettingData, UpdateSettingData } from "@/lib/api";
import { downloadFile } from "@/lib/export";
import { toast } from "sonner";
import type { Column } from "@/components/ui/data-table";

const typeOptions = [
  { value: "STRING", label: "Text" },
  { value: "NUMBER", label: "Number" },
  { value: "BOOLEAN", label: "Boolean" },
  { value: "JSON", label: "JSON" },
];

const sortOptions = [
  { value: "key:asc", label: "Key A-Z" },
  { value: "key:desc", label: "Key Z-A" },
  { value: "createdAt:desc", label: "Newest First" },
  { value: "createdAt:asc", label: "Oldest First" },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Setting | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("key:asc");

  const [form, setForm] = useState<{
    key: string;
    value: string;
    type: "STRING" | "NUMBER" | "BOOLEAN" | "JSON";
    description: string;
    isPublic: boolean;
  }>({
    key: "",
    value: "",
    type: "STRING",
    description: "",
    isPublic: false,
  });

  const loadData = useCallback(async () => {
    try {
      const res = await api.getSettings();
      setSettings(res.data?.settings || []);
    } catch (error) {
      console.error("Failed to load settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openModal = (setting?: Setting) => {
    if (setting) {
      setEditing(setting);
      setForm({
        key: setting.key,
        value: setting.value,
        type: setting.type,
        description: setting.description || "",
        isPublic: setting.isPublic,
      });
    } else {
      setEditing(null);
      setForm({
        key: "",
        value: "",
        type: "STRING",
        description: "",
        isPublic: false,
      });
    }
    setShowModal(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (editing) {
        const updateData: UpdateSettingData = {
          value: form.value,
          type: form.type,
          description: form.description || null,
          isPublic: form.isPublic,
        };
        await api.updateSetting(editing.key, updateData);
        toast.success("Setting updated");
      } else {
        const createData: CreateSettingData = {
          key: form.key,
          value: form.value,
          type: form.type,
          description: form.description || undefined,
          isPublic: form.isPublic,
        };
        await api.createSetting(createData);
        toast.success("Setting created");
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error("Failed to save setting:", error);
      toast.error("Failed to save setting");
    } finally {
      setSaving(false);
    }
  };

  const deleteSetting = async (key: string) => {
    try {
      await api.deleteSetting(key);
      toast.success("Setting deleted");
      loadData();
    } catch (error) {
      console.error("Failed to delete setting:", error);
      toast.error("Failed to delete setting");
    }
  };

  const filteredSettings = settings
    .filter(
      (s) =>
        s.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const [field, order] = sortBy.split(":") as ["key" | "createdAt", "asc" | "desc"];
      let comparison = 0;
      if (field === "key") {
        comparison = a.key.localeCompare(b.key);
      } else if (field === "createdAt") {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return order === "desc" ? -comparison : comparison;
    });

  const formatValue = (setting: Setting) => {
    if (setting.type === "BOOLEAN") {
      return setting.value === "true" ? "Yes" : "No";
    }
    if (setting.type === "JSON") {
      try {
        return JSON.stringify(JSON.parse(setting.value), null, 2).slice(0, 50) + "...";
      } catch {
        return setting.value.slice(0, 50);
      }
    }
    return setting.value.length > 50 ? setting.value.slice(0, 50) + "..." : setting.value;
  };

  // Define table columns
  const columns: Column<Setting>[] = [
    {
      key: "key",
      header: "Key",
      render: (setting) => (
        <div>
          <Text className="font-mono text-sm">{setting.key}</Text>
          {setting.description && (
            <Text size="xs" color="muted">{setting.description}</Text>
          )}
        </div>
      ),
    },
    {
      key: "value",
      header: "Value",
      render: (setting) => (
        <Text size="sm" className="font-mono">{formatValue(setting)}</Text>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (setting) => <Badge variant="secondary">{setting.type}</Badge>,
    },
    {
      key: "visibility",
      header: "Visibility",
      render: (setting) => (
        <Badge variant={setting.isPublic ? "success" : "warning"}>
          {setting.isPublic ? "Public" : "Private"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      cellClassName: "text-right",
      render: (setting) => (
        <div className="flex justify-end gap-2">
          <IconButton
            icon={<Icon name="Pencil" size="sm" />}
            size="sm"
            variant="ghost"
            onClick={() => openModal(setting)}
            aria-label="Edit setting"
          />
          <ConfirmButton
            size="sm"
            variant="ghost"
            confirmMode="dialog"
            confirmTitle="Delete Setting"
            confirmMessage={`Are you sure you want to delete the setting "${setting.key}"?`}
            onConfirm={() => deleteSetting(setting.key)}
          >
            <Icon name="Trash2" size="sm" />
          </ConfirmButton>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <Text color="muted">Manage application settings</Text>
        </div>
        <div className="flex gap-2">
          <ExportCsvButton
            label="Export"
            onExport={() => downloadFile(api.getSettingsExportUrl())}
            onSuccess={() => toast.success("Settings exported successfully")}
            onError={(error) => toast.error(error.message || "Export failed")}
          />
          <Button onClick={() => openModal()}>
            <Icon name="Plus" size="sm" className="mr-2" />
            Add Setting
          </Button>
        </div>
      </div>

      {/* Search and Sort */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Icon name="Search" size="sm" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search settings..."
            className="pl-9"
          />
        </div>
        <Select
          value={sortBy}
          onChange={(val) => setSortBy(val)}
          className="w-40"
          options={sortOptions}
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filteredSettings}
            keyExtractor={(setting) => setting.id}
            emptyMessage="No settings found"
            hasActiveFilters={!!searchQuery}
            onClearFilters={() => setSearchQuery("")}
          />
        </CardContent>
      </Card>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Edit Setting" : "Add Setting"}
      >
        <div className="space-y-4">
          <div>
            <Label className="mb-1 block">Key</Label>
            <Input
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
              placeholder="app.setting_name"
              disabled={!!editing}
              className="font-mono"
            />
            <Text size="xs" color="muted" className="mt-1">
              Use dot notation for organization (e.g., app.name, email.from)
            </Text>
          </div>
          <div>
            <Label className="mb-1 block">Type</Label>
            <Select
              value={form.type}
              onChange={(val) => setForm({ ...form, type: val as typeof form.type })}
              options={typeOptions}
            />
          </div>
          <div>
            <Label className="mb-1 block">Value</Label>
            {form.type === "BOOLEAN" ? (
              <Select
                value={form.value}
                onChange={(val) => setForm({ ...form, value: val })}
                placeholder="Select..."
                options={[
                  { value: "true", label: "Yes" },
                  { value: "false", label: "No" },
                ]}
              />
            ) : form.type === "JSON" ? (
              <Textarea
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder='{"key": "value"}'
                rows={5}
                className="font-mono"
              />
            ) : (
              <Input
                type={form.type === "NUMBER" ? "number" : "text"}
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder="Value"
              />
            )}
          </div>
          <div>
            <Label className="mb-1 block">Description</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What this setting does..."
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={form.isPublic}
              onChange={(checked) => setForm({ ...form, isPublic: checked })}
            />
            <Text size="sm">Public (accessible without authentication)</Text>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving || !form.key || !form.value}>
              {saving ? <Spinner size="sm" className="mr-2" /> : null}
              {editing ? "Save Changes" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
