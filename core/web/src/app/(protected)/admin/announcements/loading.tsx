import { SkeletonAdminPage } from "@/components/shared";
import { Skeleton } from "@/components/ui";

export default function AdminAnnouncementsLoading() {
  return (
    <SkeletonAdminPage
      titleWidth="w-40"
      descriptionWidth="w-64"
      headerActions={1}
      filterCount={0}
      showTable={false}
      customContent={
        <>
          <div className="flex gap-4">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-40" />
          </div>
          <Skeleton className="h-96 w-full" />
        </>
      }
    />
  );
}
