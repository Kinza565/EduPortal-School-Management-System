"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Loader2,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Bell,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import type { Announcement, AnnouncementTargetType } from "@/types/database";
import { Pagination } from "@/components/ui/pagination";

interface AnnouncementStats {
  total: number;
  published: number;
  draft: number;
  expiringSoon: number;
  active: number;
}

const PAGE_SIZE = 20;

export default function AnnouncementsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<AnnouncementStats>({
    total: 0,
    published: 0,
    draft: 0,
    expiringSoon: 0,
    active: 0,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [targetFilter, setTargetFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Reset to page 1 when filters change
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setCurrentPage(1);
  }, [searchQuery, targetFilter, statusFilter]);

  // Fetch stats on mount
  const fetchStats = useCallback(async () => {
    if (!profile?.school_id) return;

    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("announcements")
        .select("is_active, published_at, expires_at")
        .eq("school_id", profile.school_id);

      const announcementsData = data || [];
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      setStats({
        total: announcementsData.length,
        published: announcementsData.filter(
          (a) => a.is_active && a.published_at && new Date(a.published_at) <= now
        ).length,
        draft: announcementsData.filter((a) => !a.is_active).length,
        expiringSoon: announcementsData.filter(
          (a) =>
            a.is_active &&
            a.expires_at &&
            new Date(a.expires_at) > now &&
            new Date(a.expires_at) <= threeDaysFromNow
        ).length,
        active: announcementsData.filter(
          (a) =>
            a.is_active &&
            a.published_at &&
            new Date(a.published_at) <= now &&
            (!a.expires_at || new Date(a.expires_at) > now)
        ).length,
      });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, [profile]);

  // Fetch announcements with pagination
  const fetchAnnouncements = useCallback(async () => {
    if (!profile?.school_id) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      let query = supabase
        .from("announcements")
        .select("*", { count: "exact" })
        .eq("school_id", profile.school_id);

      // Apply search filter
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        query = query.or(`title.ilike.%${search}%,message.ilike.%${search}%`);
      }

      // Apply target filter
      if (targetFilter !== "all") {
        query = query.eq("target_type", targetFilter);
      }

      // Apply status filter
      const now = new Date();
      if (statusFilter === "draft") {
        query = query.eq("is_active", false);
      } else if (statusFilter === "published") {
        query = query.eq("is_active", true).lte("published_at", now.toISOString());
      } else if (statusFilter === "active") {
        query = query.eq("is_active", true).lte("published_at", now.toISOString()).or(`expires_at.gt.${now.toISOString()},expires_at.is.null`);
      } else if (statusFilter === "expired") {
        query = query.eq("is_active", true).lt("expires_at", now.toISOString());
      }

      // Apply pagination
      const startIndex = (currentPage - 1) * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE - 1;

      const { data, count, error: fetchError } = await query
        .order("created_at", { ascending: false })
        .range(startIndex, endIndex);

      if (fetchError) throw fetchError;

      setAnnouncements(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load announcements");
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [profile, searchQuery, targetFilter, statusFilter, currentPage]);

  // Fetch stats on mount
  useEffect(() => {
    (async () => {
      await fetchStats();
    })();
  }, [fetchStats]);

  // Fetch announcements when filters change
  useEffect(() => {
    (async () => {
      await fetchAnnouncements();
    })();
  }, [fetchAnnouncements]);

  const getTargetLabel = (target: AnnouncementTargetType) => {
    switch (target) {
      case "all":
        return "Everyone";
      case "teachers":
        return "Teachers";
      case "parents":
        return "Parents";
      case "class":
        return "Specific Class";
      case "section":
        return "Specific Section";
      default:
        return target;
    }
  };

  const getStatusBadge = (announcement: Announcement) => {
    const now = new Date();
    const isPublished = announcement.is_active && announcement.published_at && new Date(announcement.published_at) <= now;
    const isExpired = announcement.expires_at && new Date(announcement.expires_at) <= now;

    if (!announcement.is_active) {
      return (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-500/20">
          Draft
        </span>
      );
    }
    if (isExpired) {
      return (
        <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-500/20">
          Expired
        </span>
      );
    }
    if (isPublished) {
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-500/20">
          Published
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-500/20">
        Scheduled
      </span>
    );
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.from("announcements").delete().eq("id", id);

      if (error) throw error;

      // Refresh the list
      fetchAnnouncements();
      fetchStats();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete announcement");
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("announcements")
        .update({
          is_active: !currentStatus,
          published_at: !currentStatus ? new Date().toISOString() : null,
        })
        .eq("id", id);

      if (error) throw error;

      // Refresh the list
      fetchAnnouncements();
      fetchStats();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update announcement");
    }
  };

  return (
    <DashboardLayout allowedRoles={["admin"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Announcements</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage school announcements and communications.
            </p>
          </div>
          <Link
            href="/admin/announcements/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus size={18} />
            Create Announcement
          </Link>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Bell size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                <p className="text-xs text-slate-500">Total</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                <CheckCircle size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.active}</p>
                <p className="text-xs text-slate-500">Active</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                <XCircle size={20} className="text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.draft}</p>
                <p className="text-xs text-slate-500">Draft</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                <AlertCircle size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.expiringSoon}</p>
                <p className="text-xs text-slate-500">Expiring Soon</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <CheckCircle size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.published}</p>
                <p className="text-xs text-slate-500">Published</p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Search</label>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search title or message..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Target Audience</label>
              <select
                value={targetFilter}
                onChange={(e) => setTargetFilter(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">All</option>
                <option value="all">Everyone</option>
                <option value="teachers">Teachers</option>
                <option value="parents">Parents</option>
                <option value="class">Specific Class</option>
                <option value="section">Specific Section</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
        </div>

        {/* Announcements List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <span className="ml-3 text-slate-600">Loading announcements...</span>
          </div>
        ) : announcements.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <Bell size={48} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-700">No Announcements Found</h3>
            <p className="mt-1 text-sm text-slate-500">
              {stats.total === 0
                ? "Create your first announcement to get started."
                : "No announcements match your current filters."}
            </p>
            {stats.total === 0 && (
              <Link
                href="/admin/announcements/new"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                <Plus size={18} />
                Create Announcement
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-slate-800">{announcement.title}</h3>
                        {getStatusBadge(announcement)}
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600">{announcement.message}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">
                          <Filter size={12} />
                          {getTargetLabel(announcement.target_type)}
                        </span>
                        {announcement.published_at && (
                          <span>
                            Published: {new Date(announcement.published_at).toLocaleDateString()}
                          </span>
                        )}
                        {announcement.expires_at && (
                          <span>
                            Expires: {new Date(announcement.expires_at).toLocaleDateString()}
                          </span>
                        )}
                        <span>Created: {new Date(announcement.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/announcements/${announcement.id}`}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                        title="View"
                      >
                        <Eye size={18} />
                      </Link>
                      <Link
                        href={`/admin/announcements/${announcement.id}/edit`}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </Link>
                      <button
                        onClick={() => handleToggleStatus(announcement.id, announcement.is_active)}
                        className={`rounded-lg p-2 transition-colors ${
                          announcement.is_active
                            ? "text-slate-400 hover:bg-red-50 hover:text-red-600"
                            : "text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                        }`}
                        title={announcement.is_active ? "Unpublish" : "Publish"}
                      >
                        {announcement.is_active ? <XCircle size={18} /> : <CheckCircle size={18} />}
                      </button>
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalRecords={totalCount}
                  pageSize={PAGE_SIZE}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
