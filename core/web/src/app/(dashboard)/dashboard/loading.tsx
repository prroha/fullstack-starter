import { Spinner } from "@/components/ui";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <Spinner size="lg" />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  );
}
