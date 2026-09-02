import { CardSkeleton } from "@/components/ui/Skeleton";

export default function ParentDashboardLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-6 w-40 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-64 bg-slate-100 rounded mt-1 animate-pulse" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <div className="rounded-xl border border-slate-200/80 bg-white p-5">
        <div className="h-4 w-32 bg-slate-200 rounded animate-pulse mb-4" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="h-20 bg-slate-100 rounded animate-pulse" />
          <div className="h-20 bg-slate-100 rounded animate-pulse" />
          <div className="h-20 bg-slate-100 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
