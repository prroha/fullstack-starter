import { SkeletonAdminPage } from "@/components/shared";
import { Skeleton } from "@/components/ui";

export default function AdminFaqsLoading() {
  return (
    <SkeletonAdminPage
      titleWidth="w-32"
      descriptionWidth="w-64"
      headerActions={2}
      filterCount={0}
      showTable={false}
      customContent={
        <>
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-96 w-full" />
        </>
      }
    />
  );
}
