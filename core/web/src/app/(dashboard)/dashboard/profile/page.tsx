"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { Spinner, Badge, Text } from "@/components/ui";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { FormErrorBoundary } from "@/components/shared";
import { CardSection } from "@/components/layout";

// =====================================================
// Types
// =====================================================

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

// =====================================================
// Profile Page
// =====================================================

export default function ProfilePage() {
  const router = useRouter();
  const { user: _user, refreshAuth } = useAuth();
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
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Spinner size="lg" />
        <Text color="muted">Loading profile...</Text>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile Settings</h1>
        <Text color="muted" className="mt-1">
          Manage your account information
        </Text>
      </div>

      {/* Avatar Section */}
      <CardSection title="Profile Picture">
        <div className="flex flex-col sm:flex-row items-center gap-4">
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
            <Text variant="caption" color="muted">{profile?.email}</Text>
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
      </CardSection>

      {/* Profile Form */}
      <CardSection title="Edit Profile">
        <FormErrorBoundary>
          <Form form={form} onSubmit={onSubmit} className="space-y-4">
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
      </CardSection>

      {/* Account Info */}
      <CardSection title="Account Information">
        <dl className="space-y-4">
          <div className="flex justify-between">
            <Text as="span" color="muted">User ID</Text>
            <Text as="span" variant="code" size="sm">{profile?.id}</Text>
          </div>
          <div className="flex justify-between">
            <Text as="span" color="muted">Member Since</Text>
            <Text as="span">
              {profile?.createdAt &&
                new Date(profile.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
            </Text>
          </div>
          <div className="flex justify-between">
            <Text as="span" color="muted">Last Updated</Text>
            <Text as="span">
              {profile?.updatedAt &&
                new Date(profile.updatedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
            </Text>
          </div>
        </dl>
      </CardSection>
    </div>
  );
}
