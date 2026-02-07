import { Suspense } from "react";
import { SkeletonAuth } from "@/components/ui";

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
