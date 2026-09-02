import { cn } from "@/components/ui/card";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "rounded";
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function Skeleton({
  className = "",
  variant = "text",
  width,
  height,
  lines = 1,
}: SkeletonProps) {
  const baseClasses = "animate-pulse bg-slate-200";

  const variantClasses = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded-none",
    rounded: "rounded-lg",
  };

  const style = {
    width: width || "100%",
    height:
      height ||
      (variant === "circular" ? "2.5rem" : variant === "text" ? "1rem" : "6rem"),
  };

  if (lines > 1) {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(baseClasses, variantClasses[variant])}
            style={{
              ...style,
              width: i === lines - 1 ? "75%" : style.width,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={style}
    />
  );
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4 pb-3 border-b border-slate-100">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="flex-1" height={16} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4 py-3">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton key={colIdx} className="flex-1" height={14} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="w-24" height={14} />
        <Skeleton variant="circular" width={40} height={40} />
      </div>
      <Skeleton className="w-16" height={28} />
      <Skeleton className="w-20" height={12} />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <Skeleton className="w-20" height={12} />
          <Skeleton className="w-16" height={28} />
          <Skeleton className="w-24" height={10} />
        </div>
        <Skeleton variant="rounded" width={44} height={44} />
      </div>
    </div>
  );
}
