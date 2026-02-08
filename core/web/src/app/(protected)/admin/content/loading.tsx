import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-16" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-16" />
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
