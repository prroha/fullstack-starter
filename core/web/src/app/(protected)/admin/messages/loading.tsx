import { SkeletonAdminPage } from "@/components/shared";

export default function AdminMessagesLoading() {
  return (
    <SkeletonAdminPage
      titleWidth="w-48"
      descriptionWidth="w-64"
      headerActions={0}
      filterCount={2}
      tableRows={8}
      tableColumns={5}
    />
  );
}
