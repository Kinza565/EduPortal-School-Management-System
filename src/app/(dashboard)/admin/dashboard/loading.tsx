import { CardSkeleton } from "@/components/ui/Skeleton";

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Welcome Section Skeleton */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
        <div className="h-6 w-48 bg-white/20 rounded animate-pulse" />
        <div className="h-4 w-64 bg-white/10 rounded mt-2 animate-pulse" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>

      {/* Quick Actions Skeleton */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-5">
        <div className="h-4 w-24 bg-slate-200 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-4 gap-3">
          <div className="h-16 bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-16 bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-16 bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-16 bg-slate-100 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Charts Skeleton */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200/80 bg-white p-5">
          <div className="h-4 w-32 bg-slate-200 rounded animate-pulse mb-4" />
          <div className="h-40 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-5">
          <div className="h-4 w-32 bg-slate-200 rounded animate-pulse mb-4" />
          <div className="h-40 bg-slate-100 rounded animate-pulse" />
        </div>
      </div>

      {/* Bottom Row Skeleton */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200/80 bg-white p-5">
          <div className="h-4 w-28 bg-slate-200 rounded animate-pulse mb-4" />
          <div className="space-y-3">
            <div className="h-12 bg-slate-100 rounded animate-pulse" />
            <div className="h-12 bg-slate-100 rounded animate-pulse" />
            <div className="h-12 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-5">
          <div className="h-4 w-32 bg-slate-200 rounded animate-pulse mb-4" />
          <div className="space-y-3">
            <div className="h-12 bg-slate-100 rounded animate-pulse" />
            <div className="h-12 bg-slate-100 rounded animate-pulse" />
            <div className="h-12 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Announcements Skeleton */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
        <div className="h-4 w-32 bg-slate-200 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          <div className="h-16 bg-slate-100 rounded animate-pulse" />
          <div className="h-16 bg-slate-100 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
