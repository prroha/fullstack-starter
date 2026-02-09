import { SkeletonSettingsPage } from "@/components/shared";

export default function AdminSettingsLoading() {
  return (
    <SkeletonSettingsPage
      sections={3}
      fieldsPerSection={3}
    />
  );
}
