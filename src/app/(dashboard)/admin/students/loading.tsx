import { TableSkeleton } from "@/components/ui/Skeleton";

export default function AdminStudentsLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-7 w-32 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-slate-100 rounded mt-2 animate-pulse" />
        </div>
        <div className="h-10 w-28 bg-slate-200 rounded-lg animate-pulse" />
      </div>

      {/* Stats Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200/80 bg-white p-5">
          <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
          <div className="h-8 w-16 bg-slate-100 rounded mt-2 animate-pulse" />
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-5">
          <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
          <div className="h-8 w-16 bg-slate-100 rounded mt-2 animate-pulse" />
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-5">
          <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
          <div className="h-8 w-16 bg-slate-100 rounded mt-2 animate-pulse" />
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-4">
        <div className="flex gap-3">
          <div className="h-10 flex-1 bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-10 w-32 bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-10 w-32 bg-slate-100 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <TableSkeleton rows={8} columns={6} />
      </div>
    </div>
  );
}
