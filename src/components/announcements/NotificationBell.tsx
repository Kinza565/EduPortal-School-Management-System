"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck, Loader2, AlertCircle, Sparkles } from "lucide-react";
import type { Announcement, NotificationRead } from "@/types/database";

interface AnnouncementWithReadStatus extends Announcement {
  is_read: boolean;
}

interface NotificationBellProps {
  role: "admin" | "teacher" | "parent";
}

export function NotificationBell({ role }: NotificationBellProps) {
  const { profile } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementWithReadStatus[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const announcementsPath = `/${role}/announcements`;

  const fetchNotifications = useCallback(async () => {
    if (!profile?.id || !profile?.school_id) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const userId = profile.id;
      const schoolId = profile.school_id;
      const now = new Date().toISOString();

      let query = supabase
        .from("announcements")
        .select("*")
        .eq("school_id", schoolId)
        .eq("is_active", true)
        .lte("published_at", now)
        .or(`expires_at.gt.${now},expires_at.is.null`)
        .order("created_at", { ascending: false })
        .limit(10);

      if (role === "teacher") {
        const { data: assignments } = await supabase
          .from("teacher_assignments")
          .select("class_id, section_id")
          .eq("teacher_id", userId);

        const assignedClassIds = [...new Set(assignments?.map((a) => a.class_id) || [])];
        const assignedSectionIds = [...new Set(assignments?.map((a) => a.section_id) || [])];

        if (assignedClassIds.length > 0 || assignedSectionIds.length > 0) {
          const classFilter = assignedClassIds.length > 0
            ? `target_type.eq.class_and.class_id.in.(${assignedClassIds.join(",")})`
            : "";
          const sectionFilter = assignedSectionIds.length > 0
            ? `target_type.eq.section_and.section_id.in.(${assignedSectionIds.join(",")})`
            : "";
          const filters = ["target_type.in.(all,teachers)", classFilter, sectionFilter]
            .filter(Boolean)
            .join(",");
          query = query.or(filters);
        } else {
          query = query.in("target_type", ["all", "teachers"]);
        }
      } else if (role === "parent") {
        const { data: parentData } = await supabase
          .from("parents")
          .select("id")
          .eq("profile_id", userId)
          .single();

        if (parentData) {
          const { data: parentStudents } = await supabase
            .from("parent_student")
            .select("student_id")
            .eq("parent_id", parentData.id);

          if (parentStudents && parentStudents.length > 0) {
            const studentIds = parentStudents.map((ps) => ps.student_id);
            const { data: studentsData } = await supabase
              .from("students")
              .select("class_id, section_id")
              .in("id", studentIds);

            const childrenClassIds = [...new Set(studentsData?.map((s) => s.class_id) || [])];
            const childrenSectionIds = [...new Set(studentsData?.map((s) => s.section_id) || [])];

            if (childrenClassIds.length > 0 || childrenSectionIds.length > 0) {
              const classFilter = childrenClassIds.length > 0
                ? `target_type.eq.class_and.class_id.in.(${childrenClassIds.join(",")})`
                : "";
              const sectionFilter = childrenSectionIds.length > 0
                ? `target_type.eq.section_and.section_id.in.(${childrenSectionIds.join(",")})`
                : "";
              const filters = ["target_type.in.(all,parents)", classFilter, sectionFilter]
                .filter(Boolean)
                .join(",");
              query = query.or(filters);
            } else {
              query = query.in("target_type", ["all", "parents"]);
            }
          } else {
            query = query.in("target_type", ["all", "parents"]);
          }
        } else {
          query = query.in("target_type", ["all", "parents"]);
        }
      }

      const { data: announcementsData, error: fetchError } = await query;

      if (fetchError) throw fetchError;

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
      setUnreadCount(announcementsWithRead.filter((a) => !a.is_read).length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [profile?.id, profile?.school_id, role]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (announcementId: string) => {
    if (!profile?.id || !profile?.school_id) return;

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

  const markAllAsRead = async () => {
    if (!profile?.id || !profile?.school_id) return;

    try {
      const supabase = createClient();
      const unreadAnnouncements = announcements.filter((a) => !a.is_read);

      if (unreadAnnouncements.length === 0) return;

      const { error } = await supabase.from("notification_reads").upsert(
        unreadAnnouncements.map((a) => ({
          announcement_id: a.id,
          user_id: profile.id,
          school_id: profile.school_id,
          read_at: new Date().toISOString(),
        })),
        { onConflict: "announcement_id,user_id" }
      );

      if (error) throw error;

      setAnnouncements((prev) => prev.map((a) => ({ ...a, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleNotificationClick = (announcement: AnnouncementWithReadStatus) => {
    if (!announcement.is_read) {
      markAsRead(announcement.id);
    }
    setIsOpen(false);
    router.push(announcementsPath);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-xl p-2.5 text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-slate-700 hover:scale-105"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-slate-200 bg-white shadow-2xl sm:w-96 dropdown-enter overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-50/50">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-blue-600" />
              <h3 className="font-semibold text-slate-800">Notifications</h3>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs font-medium text-blue-600 transition-all duration-200 hover:text-blue-700 hover:scale-105"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <Loader2 size={24} className="animate-spin text-blue-600" />
                <p className="text-xs text-slate-500">Loading...</p>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-red-600">
                <AlertCircle size={16} />
                {error}
              </div>
            ) : announcements.length === 0 ? (
              <div className="py-8 text-center animate-fade-in">
                <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <Sparkles size={24} className="text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-700">No notifications</p>
                <p className="text-xs text-slate-400 mt-1">You&apos;re all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {announcements.map((announcement, index) => (
                  <button
                    key={announcement.id}
                    onClick={() => handleNotificationClick(announcement)}
                    className={`w-full px-4 py-3 text-left transition-all duration-200 hover:bg-blue-50/50 group ${
                      !announcement.is_read ? "bg-blue-50/30" : ""
                    }`}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {!announcement.is_read ? (
                          <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 block shadow-sm" />
                        ) : (
                          <div className="rounded-full bg-emerald-50 p-0.5">
                            <Check size={12} className="text-emerald-500" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm transition-colors duration-200 ${
                            announcement.is_read ? "text-slate-600" : "font-medium text-slate-800 group-hover:text-blue-700"
                          }`}
                        >
                          {announcement.title}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                          {announcement.message}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {formatDate(announcement.created_at)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 px-4 py-2 bg-slate-50/50">
            <button
              onClick={() => {
                setIsOpen(false);
                router.push(announcementsPath);
              }}
              className="w-full py-2 text-center text-sm font-medium text-blue-600 transition-all duration-200 hover:text-blue-700 hover:scale-105"
            >
              View all announcements
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
