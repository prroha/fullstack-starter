"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
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
  Table,
  TableRow,
  TableCell,
  TableHeader,
  IconButton,
  Label,
} from "@/components/ui";
import { api } from "@/lib/api";

interface Setting {
  id: string;
  key: string;
  value: string;
  type: "STRING" | "NUMBER" | "BOOLEAN" | "JSON";
  description: string | null;
  isPublic: boolean;
}

const typeOptions = [
  { value: "STRING", label: "Text" },
  { value: "NUMBER", label: "Number" },
  { value: "BOOLEAN", label: "Boolean" },
  { value: "JSON", label: "JSON" },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Setting | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
      const res = await api.get<{ settings: Setting[] }>("/settings");
      setSettings(res.data?.settings || []);
    } catch (error) {
      console.error("Failed to load settings:", error);
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
        await api.patch(`/settings/${editing.key}`, {
          value: form.value,
          type: form.type,
          description: form.description || null,
          isPublic: form.isPublic,
        });
      } else {
        await api.post("/settings", form);
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error("Failed to save setting:", error);
    } finally {
      setSaving(false);
    }
  };

  const deleteSetting = async (key: string) => {
    if (!confirm(`Are you sure you want to delete the setting "${key}"?`)) return;
    try {
      await api.delete(`/settings/${key}`);
      loadData();
    } catch (error) {
      console.error("Failed to delete setting:", error);
    }
  };

  const filteredSettings = settings.filter(
    (s) =>
      s.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <Text color="muted">Manage application settings</Text>
        </div>
        <Button onClick={() => openModal()}>
          <Icon name="Plus" size="sm" className="mr-2" />
          Add Setting
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Icon name="Search" size="sm" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search settings..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <thead>
              <TableRow>
                <TableHeader>Key</TableHeader>
                <TableHeader>Value</TableHeader>
                <TableHeader>Type</TableHeader>
                <TableHeader>Visibility</TableHeader>
                <TableHeader className="text-right">Actions</TableHeader>
              </TableRow>
            </thead>
            <tbody>
              {filteredSettings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Text color="muted">No settings found</Text>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSettings.map((setting) => (
                  <TableRow key={setting.id}>
                    <TableCell>
                      <div>
                        <Text className="font-mono text-sm">{setting.key}</Text>
                        {setting.description && (
                          <Text size="xs" color="muted">{setting.description}</Text>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Text size="sm" className="font-mono">{formatValue(setting)}</Text>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{setting.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={setting.isPublic ? "success" : "warning"}>
                        {setting.isPublic ? "Public" : "Private"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <IconButton
                          icon={<Icon name="Pencil" size="sm" />}
                          size="sm"
                          variant="ghost"
                          onClick={() => openModal(setting)}
                          aria-label="Edit setting"
                        />
                        <IconButton
                          icon={<Icon name="Trash2" size="sm" />}
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteSetting(setting.key)}
                          aria-label="Delete setting"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </tbody>
          </Table>
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
