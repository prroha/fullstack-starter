import { SkeletonAdminPage } from "@/components/shared";
import { Skeleton } from "@/components/ui";

export default function AdminContentLoading() {
  return (
    <SkeletonAdminPage
      titleWidth="w-40"
      descriptionWidth="w-56"
      headerActions={1}
      filterCount={0}
      showTable={false}
      customContent={
        <>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-16" />
          </div>
          <Skeleton className="h-96 w-full" />
        </>
      }
    />
  );
}
