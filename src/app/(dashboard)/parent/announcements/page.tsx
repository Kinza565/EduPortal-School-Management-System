"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loader2, Bell, Check, CheckCheck } from "lucide-react";
import type { Announcement } from "@/types/database";
import { Pagination } from "@/components/ui/pagination";

interface AnnouncementWithReadStatus extends Announcement {
  is_read: boolean;
}

const PAGE_SIZE = 20;

export default function ParentAnnouncementsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementWithReadStatus[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Reset to page 1 on mount
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setCurrentPage(1);
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    if (!profile?.id || !profile?.school_id) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const userId = profile.id;
      const schoolId = profile.school_id;

      // Get parent's children and their classes/sections
      const { data: parentData } = await supabase
        .from("parents")
        .select("id")
        .eq("profile_id", userId)
        .single();

      if (!parentData) {
        setAnnouncements([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      const { data: parentStudents } = await supabase
        .from("parent_student")
        .select("student_id")
        .eq("parent_id", parentData.id);

      if (!parentStudents || parentStudents.length === 0) {
        setAnnouncements([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      const studentIds = parentStudents.map((ps) => ps.student_id);

      const { data: studentsData } = await supabase
        .from("students")
        .select("class_id, section_id")
        .in("id", studentIds);

      const childrenClassIds = [...new Set(studentsData?.map((s) => s.class_id) || [])];
      const childrenSectionIds = [...new Set(studentsData?.map((s) => s.section_id) || [])];

      // Build query for relevant announcements
      const query = supabase
        .from("announcements")
        .select("*", { count: "exact" })
        .eq("school_id", schoolId)
        .eq("is_active", true)
        .or(
          `target_type.in.(all,parents),target_type.eq.class_and.class_id.in.(${childrenClassIds.join(",") || "null"}),target_type.eq.section_and.section_id.in.(${childrenSectionIds.join(",") || "null"})`
        );

      // Apply pagination
      const startIndex = (currentPage - 1) * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE - 1;

      const { data: announcementsData, count, error: announcementsError } = await query
        .order("created_at", { ascending: false })
        .range(startIndex, endIndex);

      if (announcementsError) throw announcementsError;

      // Get read status
      const announcementIds = (announcementsData || []).map((a) => a.id);

      const { data: readData } = await supabase
        .from("notification_reads")
        .select("*")
        .eq("user_id", userId)
        .in("announcement_id", announcementIds);

      const readMap = new Set((readData || []).map((r) => r.announcement_id));

      const announcementsWithRead: AnnouncementWithReadStatus[] = (announcementsData || []).map(
        (a) => ({
          ...a,
          is_read: readMap.has(a.id),
        })
      );

      setAnnouncements(announcementsWithRead);
      setTotalCount(count || 0);
      setUnreadCount(announcementsWithRead.filter((a) => !a.is_read).length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load announcements");
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [profile, currentPage]);

  useEffect(() => {
    (async () => {
      await fetchAnnouncements();
    })();
  }, [fetchAnnouncements]);

  const markAsRead = async (announcementId: string) => {
    if (!profile?.id) return;

    try {
      const supabase = createClient();

      const { error } = await supabase.from("notification_reads").upsert(
        {
          announcement_id: announcementId,
          user_id: profile.id,
          school_id: profile.school_id,
          read_at: new Date().toISOString(),
        },
        { onConflict: "announcement_id,user_id" }
      );

      if (error) throw error;

      setAnnouncements((prev) =>
        prev.map((a) => (a.id === announcementId ? { ...a, is_read: true } : a))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const getTargetLabel = (target: string) => {
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

  return (
    <DashboardLayout allowedRoles={["parent"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Announcements</h1>
          <p className="mt-1 text-sm text-slate-500">
            View school announcements relevant to you.
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                {unreadCount} unread
              </span>
            )}
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <span className="ml-3 text-slate-600">Loading announcements...</span>
          </div>
        ) : announcements.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <Bell size={48} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-700">No Announcements</h3>
            <p className="mt-1 text-sm text-slate-500">
              There are no announcements relevant to you at this time.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className={`rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${
                    announcement.is_read ? "border-slate-200" : "border-blue-200 bg-blue-50/30"
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3
                          className={`text-lg font-semibold ${
                            announcement.is_read ? "text-slate-700" : "text-slate-900"
                          }`}
                        >
                          {announcement.title}
                        </h3>
                        {!announcement.is_read && (
                          <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span>
                        )}
                      </div>
                      <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                        {announcement.message}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                          {getTargetLabel(announcement.target_type)}
                        </span>
                        <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                        {announcement.expires_at && (
                          <span>
                            Expires: {new Date(announcement.expires_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    {!announcement.is_read && (
                      <button
                        onClick={() => markAsRead(announcement.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                        title="Mark as read"
                      >
                        <Check size={14} />
                        Mark Read
                      </button>
                    )}
                    {announcement.is_read && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                        <CheckCheck size={14} />
                        Read
                      </span>
                    )}
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
