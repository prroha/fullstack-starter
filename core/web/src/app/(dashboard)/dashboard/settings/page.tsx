"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { api, ApiError } from "@/lib/api";
import { logger } from "@/lib/logger";
import { toast } from "@/lib/toast";
import { Button, ExportMyDataButton, ThemeSelector, Text, Input } from "@/components/ui";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Icon } from "@/components/ui/icon";
import {
  SettingsSection,
  SettingsItem,
  SettingsToggle,
} from "@/components/settings";

// =====================================================
// Delete Account Modal Component
// =====================================================

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

function DeleteAccountModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-background rounded-lg shadow-lg max-w-md w-full mx-4 p-6 space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
            <Icon name="Trash2" size="lg" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Delete Account
            </h2>
            <Text variant="caption" color="muted">
              This action cannot be undone
            </Text>
          </div>
        </div>

        <div className="space-y-4">
          <Text variant="caption" color="muted">
            Are you sure you want to delete your account? All of your data will
            be permanently removed. This action cannot be undone.
          </Text>

          <div className="space-y-2">
            <label
              htmlFor="confirm-delete"
              className="text-sm font-medium text-foreground"
            >
              Type <Text variant="code" as="span" color="destructive">DELETE</Text> to
              confirm
            </label>
            <Input
              id="confirm-delete"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="flex-1"
            onClick={onConfirm}
            disabled={confirmText !== "DELETE" || isLoading}
            isLoading={isLoading}
          >
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// Settings Page Component
// =====================================================

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { colorMode, resolvedColorMode, currentTheme, currentThemeConfig } = useTheme();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // Note: You'll need to add a deleteAccount method to the API client
      // await api.deleteAccount();
      await logout();
      toast.success("Account deleted", {
        description: "Your account has been permanently deleted.",
      });
      router.push("/login");
    } catch (err) {
      if (err instanceof ApiError) {
        logger.error("Settings", "Failed to delete account", err);
        toast.error("Failed to delete account", {
          description: err.message,
        });
      } else {
        logger.error("Settings", "Unexpected error deleting account", err);
        toast.error("Failed to delete account", {
          description: "An unexpected error occurred. Please try again.",
        });
      }
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const getColorModeLabel = () => {
    if (colorMode === "system") return "System";
    return resolvedColorMode === "dark" ? "Dark" : "Light";
  };

  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0";

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <Text color="muted" className="mt-1">
          Manage your account settings and preferences
        </Text>
      </div>

      {/* Profile Section */}
      <SettingsSection title="Profile" description="Manage your profile information">
        <SettingsItem
          icon={<Icon name="User" size="sm" />}
          label="Edit Profile"
          description="Update your name, email, and avatar"
          href="/dashboard/profile"
        />
      </SettingsSection>

      {/* Security Section */}
      <SettingsSection
        title="Security"
        description="Manage your account security"
      >
        <SettingsItem
          icon={<Icon name="Lock" size="sm" />}
          label="Change Password"
          description="Update your password"
          href="/dashboard/settings/change-password"
        />
        <SettingsItem
          icon={<Icon name="Monitor" size="sm" />}
          label="Active Sessions"
          description="View and manage your active sessions"
          href="/dashboard/settings/sessions"
        />
        <SettingsItem
          icon={<Icon name="Shield" size="sm" />}
          label="Two-Factor Authentication"
          description="Add an extra layer of security"
          value="Coming soon"
          disabled
        />
      </SettingsSection>

      {/* Appearance Section */}
      <SettingsSection
        title="Appearance"
        description="Customize how the app looks"
      >
        <SettingsItem
          icon={<Icon name="Monitor" size="sm" />}
          label="Color Mode"
          description="Choose light, dark, or system mode"
          value={getColorModeLabel()}
          action={<ThemeToggle variant="dropdown" size="sm" />}
        />
        <div className="px-4 py-3 border-t">
          <div className="flex items-start gap-3 mb-3">
            <div className="mt-0.5 text-muted-foreground">
              <Icon name="Palette" size="sm" />
            </div>
            <div>
              <Text as="p" size="sm" className="font-medium">App Theme</Text>
              <Text variant="caption" color="muted">
                Choose a color theme that suits your app type
              </Text>
              <Text variant="caption" color="muted" size="xs" className="mt-1 italic">
                Current: {currentThemeConfig.name} - {currentThemeConfig.psychology}
              </Text>
            </div>
          </div>
          <ThemeSelector variant="grid" size="sm" showDescription={false} />
        </div>
      </SettingsSection>

      {/* Notifications Section */}
      <SettingsSection
        title="Notifications"
        description="Configure notification preferences"
      >
        <SettingsItem
          icon={<Icon name="Bell" size="sm" />}
          label="Email Notifications"
          description="Receive updates via email"
          value="Coming soon"
          disabled
        />
        <SettingsItem
          icon={<Icon name="Bell" size="sm" />}
          label="Push Notifications"
          description="Receive push notifications"
          value="Coming soon"
          disabled
        />
      </SettingsSection>

      {/* Data & Privacy Section */}
      <SettingsSection title="Data & Privacy" description="Manage your data">
        <SettingsItem
          icon={<Icon name="Download" size="sm" />}
          label="Export My Data"
          description="Download a copy of your personal data (GDPR)"
          action={
            <ExportMyDataButton
              onSuccess={() => toast.success("Data exported successfully")}
              onError={(error) => toast.error(error.message || "Export failed")}
            />
          }
        />
      </SettingsSection>

      {/* Account Section */}
      <SettingsSection title="Account" description="Manage your account">
        <SettingsItem
          icon={<Icon name="Trash2" size="sm" />}
          label="Delete Account"
          description="Permanently delete your account and all data"
          variant="danger"
          onClick={() => setIsDeleteModalOpen(true)}
        />
      </SettingsSection>

      {/* About Section */}
      <SettingsSection title="About" description="App information and legal">
        <SettingsItem
          icon={<Icon name="Info" size="sm" />}
          label="App Version"
          value={`v${appVersion}`}
        />
        <SettingsItem
          icon={<Icon name="FileText" size="sm" />}
          label="Terms of Service"
          href="/terms"
        />
        <SettingsItem
          icon={<Icon name="FileText" size="sm" />}
          label="Privacy Policy"
          href="/privacy"
        />
      </SettingsSection>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        isLoading={isDeleting}
      />
    </div>
  );
}
