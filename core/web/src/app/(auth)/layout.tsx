import { Suspense } from "react";
import { SkeletonAuth } from "@/components/ui/skeleton";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<SkeletonAuth />}>
      {children}
    </Suspense>
  );
}
