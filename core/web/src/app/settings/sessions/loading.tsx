import { Spinner } from "@/components/ui";

export default function SessionsLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <Spinner size="lg" />
      <p className="text-muted-foreground">Loading sessions...</p>
    </div>
  );
}
