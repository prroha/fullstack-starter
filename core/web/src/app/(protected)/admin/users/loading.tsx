import { SkeletonAdminPage } from "@/components/shared";

export default function AdminUsersLoading() {
  return (
    <SkeletonAdminPage
      titleWidth="w-48"
      descriptionWidth="w-64"
      headerActions={0}
      filterCount={3}
      tableRows={8}
      tableColumns={5}
    />
  );
}
