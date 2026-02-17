import { SkeletonForm } from "@/components/ui";

export default function ChangePasswordLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="h-8 w-48 bg-muted rounded mx-auto animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded mx-auto animate-pulse" />
        </div>
        <SkeletonForm />
      </div>
    </div>
  );
}
