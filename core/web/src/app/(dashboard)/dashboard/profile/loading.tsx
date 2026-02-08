import { Spinner } from "@/components/ui";

export default function ProfileLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <Spinner size="lg" />
      <p className="text-muted-foreground">Loading profile...</p>
    </div>
  );
}
