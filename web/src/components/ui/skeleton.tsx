import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export function SkeletonText({ className, ...props }: SkeletonProps) {
  return (
    <Skeleton className={cn("h-4 w-full", className)} {...props} />
  );
}

export function SkeletonCircle({ className, ...props }: SkeletonProps) {
  return (
    <Skeleton className={cn("h-12 w-12 rounded-full", className)} {...props} />
  );
}

export function SkeletonCard({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      <Skeleton className="h-40 w-full" />
      <div className="space-y-2">
        <SkeletonText className="w-3/4" />
        <SkeletonText className="w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonAvatar({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("flex items-center gap-3", className)} {...props}>
      <SkeletonCircle className="h-10 w-10" />
      <div className="space-y-2 flex-1">
        <SkeletonText className="w-32" />
        <SkeletonText className="w-24 h-3" />
      </div>
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
  ...props
}: SkeletonProps & { rows?: number; columns?: number }) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonText key={i} className="flex-1 h-6" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <SkeletonText key={colIndex} className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
