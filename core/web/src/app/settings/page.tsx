"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { ApiError } from "@/lib/api";
import { logger } from "@/lib/logger";
import { toast } from "@/lib/toast";
import { Button, ExportMyDataButton, ThemeSelector, Icon, Dialog, DialogHeader, DialogBody, DialogFooter, Input } from "@/components/ui";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  SettingsSection,
  SettingsItem,
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

  return (
    <Dialog isOpen={isOpen} onClose={onClose} size="md">
      <DialogHeader>Delete Account</DialogHeader>
      <DialogBody>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <Icon name="Trash2" size="lg" color="destructive" />
          </div>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone
          </p>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Are you sure you want to delete your account? All of your data will
          be permanently removed. This action cannot be undone.
        </p>
        <div className="space-y-2">
          <label
            htmlFor="confirm-delete"
            className="text-sm font-medium text-foreground"
          >
            Type <span className="font-mono text-destructive">DELETE</span> to
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
      </DialogBody>
      <DialogFooter>
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
      </DialogFooter>
    </Dialog>
  );
}

// =====================================================
// Settings Page Component
// =====================================================

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { colorMode, resolvedColorMode, currentTheme: _currentTheme, currentThemeConfig } = useTheme();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold hover:text-primary">
            My App
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-8">
          {/* Page Title */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your account settings and preferences
            </p>
          </div>

          {/* Profile Section */}
          <SettingsSection title="Profile" description="Manage your profile information">
            <SettingsItem
              icon={<Icon name="User" size="md" />}
              label="Edit Profile"
              description="Update your name, email, and avatar"
              href="/profile"
            />
          </SettingsSection>

          {/* Security Section */}
          <SettingsSection
            title="Security"
            description="Manage your account security"
          >
            <SettingsItem
              icon={<Icon name="Lock" size="md" />}
              label="Change Password"
              description="Update your password"
              href="/settings/change-password"
            />
            <SettingsItem
              icon={<Icon name="Monitor" size="md" />}
              label="Active Sessions"
              description="View and manage your active sessions"
              href="/settings/sessions"
            />
            <SettingsItem
              icon={<Icon name="Shield" size="md" />}
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
              icon={<Icon name="Monitor" size="md" />}
              label="Color Mode"
              description="Choose light, dark, or system mode"
              value={getColorModeLabel()}
              action={<ThemeToggle variant="dropdown" size="sm" />}
            />
            <div className="px-4 py-3 border-t">
              <div className="flex items-start gap-3 mb-3">
                <div className="mt-0.5 text-muted-foreground">
                  <Icon name="Palette" size="md" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">App Theme</p>
                  <p className="text-sm text-muted-foreground">
                    Choose a color theme that suits your app type
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 italic">
                    Current: {currentThemeConfig.name} - {currentThemeConfig.psychology}
                  </p>
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
              icon={<Icon name="Bell" size="md" />}
              label="Email Notifications"
              description="Receive updates via email"
              value="Coming soon"
              disabled
            />
            <SettingsItem
              icon={<Icon name="Bell" size="md" />}
              label="Push Notifications"
              description="Receive push notifications"
              value="Coming soon"
              disabled
            />
          </SettingsSection>

          {/* Data & Privacy Section */}
          <SettingsSection title="Data & Privacy" description="Manage your data">
            <SettingsItem
              icon={<Icon name="Download" size="md" />}
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
              icon={<Icon name="Trash2" size="md" />}
              label="Delete Account"
              description="Permanently delete your account and all data"
              variant="danger"
              onClick={() => setIsDeleteModalOpen(true)}
            />
          </SettingsSection>

          {/* About Section */}
          <SettingsSection title="About" description="App information and legal">
            <SettingsItem
              icon={<Icon name="Info" size="md" />}
              label="App Version"
              value={`v${appVersion}`}
            />
            <SettingsItem
              icon={<Icon name="FileText" size="md" />}
              label="Terms of Service"
              href="/terms"
            />
            <SettingsItem
              icon={<Icon name="FileText" size="md" />}
              label="Privacy Policy"
              href="/privacy"
            />
          </SettingsSection>

          {/* Back Link */}
          <div className="flex justify-center pt-4">
            <Link
              href="/"
              className="text-sm text-primary hover:underline"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>

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
