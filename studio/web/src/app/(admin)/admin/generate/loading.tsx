import { AdminTableSkeleton } from "@/components/admin/table-skeleton";

export default function Loading() {
  return (
    <AdminTableSkeleton
      columns={4}
      rows={6}
      showStats={false}
      showFilters={false}
    />
  );
}
