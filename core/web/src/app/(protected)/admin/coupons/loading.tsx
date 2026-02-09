import { SkeletonAdminPage } from "@/components/shared";
import { Skeleton } from "@/components/ui";

export default function AdminCouponsLoading() {
  return (
    <SkeletonAdminPage
      titleWidth="w-32"
      descriptionWidth="w-64"
      headerActions={1}
      filterCount={0}
      showTable={false}
      customContent={
        <>
          <div className="flex gap-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-40" />
          </div>
          <Skeleton className="h-96 w-full" />
        </>
      }
    />
  );
}
