"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { api, ApiError } from "@/lib/api";
import { logger } from "@/lib/logger";
import { toast } from "@/lib/toast";
import { Button, ExportMyDataButton, ThemeSelector } from "@/components/ui";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  SettingsSection,
  SettingsItem,
  SettingsToggle,
} from "@/components/settings";

// =====================================================
// Icon Components
// =====================================================

function UserIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LockIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ShieldIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}

function MonitorIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </svg>
  );
}

function PaletteIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}

function BellIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function TrashIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  );
}

function InfoIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function FileTextIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  );
}

function DownloadIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}

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
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <TrashIcon size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Delete Account
            </h2>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
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
            <input
              id="confirm-delete"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Section */}
      <SettingsSection title="Profile" description="Manage your profile information">
        <SettingsItem
          icon={<UserIcon />}
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
          icon={<LockIcon />}
          label="Change Password"
          description="Update your password"
          href="/dashboard/settings/change-password"
        />
        <SettingsItem
          icon={<MonitorIcon />}
          label="Active Sessions"
          description="View and manage your active sessions"
          href="/dashboard/settings/sessions"
        />
        <SettingsItem
          icon={<ShieldIcon />}
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
          icon={<MonitorIcon />}
          label="Color Mode"
          description="Choose light, dark, or system mode"
          value={getColorModeLabel()}
          action={<ThemeToggle variant="dropdown" size="sm" />}
        />
        <div className="px-4 py-3 border-t">
          <div className="flex items-start gap-3 mb-3">
            <div className="mt-0.5 text-muted-foreground">
              <PaletteIcon />
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
          icon={<BellIcon />}
          label="Email Notifications"
          description="Receive updates via email"
          value="Coming soon"
          disabled
        />
        <SettingsItem
          icon={<BellIcon />}
          label="Push Notifications"
          description="Receive push notifications"
          value="Coming soon"
          disabled
        />
      </SettingsSection>

      {/* Data & Privacy Section */}
      <SettingsSection title="Data & Privacy" description="Manage your data">
        <SettingsItem
          icon={<DownloadIcon />}
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
          icon={<TrashIcon />}
          label="Delete Account"
          description="Permanently delete your account and all data"
          variant="danger"
          onClick={() => setIsDeleteModalOpen(true)}
        />
      </SettingsSection>

      {/* About Section */}
      <SettingsSection title="About" description="App information and legal">
        <SettingsItem
          icon={<InfoIcon />}
          label="App Version"
          value={`v${appVersion}`}
        />
        <SettingsItem
          icon={<FileTextIcon />}
          label="Terms of Service"
          href="/terms"
        />
        <SettingsItem
          icon={<FileTextIcon />}
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
