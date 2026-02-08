"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "@/lib/toast";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import { updateProfileSchema, type UpdateProfileFormData } from "@/lib/validations";
import { logger } from "@/lib/logger";
import {
  Form,
  FormFieldInput,
  FormStatusMessage,
  FormActions,
  useZodForm,
} from "@/components/forms";
import { Button, Spinner, Badge } from "@/components/ui";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { FormErrorBoundary } from "@/components/shared";

interface Profile {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Avatar {
  url: string | null;
  initials: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, refreshAuth } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatar, setAvatar] = useState<Avatar | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const form = useZodForm({
    schema: updateProfileSchema,
    defaultValues: {
      name: "",
      email: "",
    },
  });

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [profileRes, avatarRes] = await Promise.all([
          api.getProfile(),
          api.getAvatar(),
        ]);

        if (profileRes.data) {
          setProfile(profileRes.data.profile);
          form.reset({
            name: profileRes.data.profile.name || "",
            email: profileRes.data.profile.email,
          });
        }

        if (avatarRes.data) {
          setAvatar(avatarRes.data.avatar);
        }

        logger.debug("Profile", "Profile data loaded successfully");
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.status === 401) {
            router.push("/login");
            return;
          }
          setError(err.message);
          logger.error("Profile", "Failed to load profile", err);
        } else {
          setError("Failed to load profile. Please try again.");
          logger.error("Profile", "Unexpected error loading profile", err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [form, router]);

  const onSubmit = async (data: UpdateProfileFormData) => {
    setError(null);
    try {
      const response = await api.updateProfile({
        name: data.name,
        email: data.email,
      });

      if (response.data) {
        setProfile(response.data.profile);
        // Refresh auth context to update user data
        await refreshAuth();
        toast.success("Profile updated successfully");
        logger.info("Profile", "Profile updated successfully");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        logger.warn("Profile", "Failed to update profile", { code: err.code });
        toast.error(err.message);
        setError(err.message);
      } else {
        logger.error("Profile", "Unexpected error updating profile", err);
        toast.error("Failed to update profile. Please try again.");
        setError("Failed to update profile. Please try again.");
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleAvatarUpload = useCallback(async (file: File) => {
    setIsUploadingAvatar(true);
    setUploadProgress(0);
    try {
      const response = await api.uploadAvatar(file, (progress) => {
        setUploadProgress(progress);
      });
      if (response.data) {
        setAvatar((prev) => prev ? { ...prev, url: response.data!.avatar.url } : null);
        toast.success("Avatar uploaded successfully");
        logger.info("Profile", "Avatar uploaded successfully");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
        logger.error("Profile", "Failed to upload avatar", err);
      } else {
        toast.error("Failed to upload avatar. Please try again.");
        logger.error("Profile", "Unexpected error uploading avatar", err);
      }
      throw err;
    } finally {
      setIsUploadingAvatar(false);
      setUploadProgress(0);
    }
  }, []);

  const handleAvatarRemove = useCallback(async () => {
    try {
      await api.deleteAvatar();
      setAvatar((prev) => prev ? { ...prev, url: null } : null);
      toast.success("Avatar removed successfully");
      logger.info("Profile", "Avatar removed successfully");
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
        logger.error("Profile", "Failed to remove avatar", err);
      } else {
        toast.error("Failed to remove avatar. Please try again.");
        logger.error("Profile", "Unexpected error removing avatar", err);
      }
      throw err;
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <Spinner size="lg" />
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold hover:text-primary">
            My App
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.email}
            </span>
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
            <h1 className="text-2xl font-bold tracking-tight">Profile Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your account information
            </p>
          </div>

          {/* Avatar Section */}
          <div className="p-6 rounded-lg border bg-card">
            <h2 className="text-lg font-semibold mb-6">Profile Picture</h2>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <AvatarUpload
                currentAvatarUrl={avatar?.url}
                initials={avatar?.initials || "U"}
                onUpload={handleAvatarUpload}
                onRemove={avatar?.url ? handleAvatarRemove : undefined}
                isUploading={isUploadingAvatar}
                uploadProgress={uploadProgress}
                size="lg"
              />
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-medium">{profile?.name || "No name set"}</h3>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                  <Badge variant={profile?.role === "ADMIN" ? "default" : "secondary"}>
                    {profile?.role}
                  </Badge>
                  {profile?.isActive && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Active
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="p-6 rounded-lg border bg-card">
            <h2 className="text-lg font-semibold mb-6">Edit Profile</h2>

            <FormErrorBoundary>
              <Form form={form} onSubmit={onSubmit} className="space-y-6">
                <FormStatusMessage variant="error" message={error} />

                <FormFieldInput
                  control={form.control}
                  name="name"
                  label="Name"
                  required
                  placeholder="Enter your name"
                  inputProps={{ autoComplete: "name" }}
                />

                <FormFieldInput
                  control={form.control}
                  name="email"
                  label="Email"
                  required
                  type="email"
                  placeholder="you@example.com"
                  inputProps={{ autoComplete: "email" }}
                />

                <FormActions
                  submitLabel="Save Changes"
                  isSubmitting={form.formState.isSubmitting}
                  onCancel={() => {
                    if (profile) {
                      form.reset({
                        name: profile.name || "",
                        email: profile.email,
                      });
                    }
                  }}
                />
              </Form>
            </FormErrorBoundary>
          </div>

          {/* Account Info */}
          <div className="p-6 rounded-lg border bg-card">
            <h2 className="text-lg font-semibold mb-4">Account Information</h2>
            <dl className="space-y-4">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">User ID</dt>
                <dd className="font-mono text-sm">{profile?.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Member Since</dt>
                <dd>
                  {profile?.createdAt &&
                    new Date(profile.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Last Updated</dt>
                <dd>
                  {profile?.updatedAt &&
                    new Date(profile.updatedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                </dd>
              </div>
            </dl>
          </div>

          {/* Navigation Links */}
          <div className="flex justify-between items-center pt-4">
            <Link
              href="/"
              className="text-sm text-primary hover:underline"
            >
              Back to Home
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/settings/change-password"
                className="text-sm text-primary hover:underline"
              >
                Change Password
              </Link>
              <Link
                href="/settings"
                className="text-sm text-primary hover:underline"
              >
                Settings
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
