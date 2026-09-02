"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { Bell, Check, Loader2, AlertCircle, ChevronRight, Sparkles } from "lucide-react";
import type { Announcement } from "@/types/database";

interface AnnouncementWithReadStatus extends Announcement {
  is_read: boolean;
}

interface AnnouncementWidgetProps {
  role: "admin" | "teacher" | "parent";
  maxItems?: number;
}

export function AnnouncementWidget({ role, maxItems = 5 }: AnnouncementWidgetProps) {
  const { profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementWithReadStatus[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const announcementsPath = `/${role}/announcements`;

  const fetchAnnouncements = useCallback(async () => {
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
        .order("created_at", { ascending: false })
        .limit(maxItems);

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

      const { data: allAnnouncements, error: fetchError } = await query;

      if (fetchError) {
        if (process.env.NODE_ENV === "development") {
          console.error("Announcement query error:", fetchError);
        }
        throw new Error(fetchError.message || "Failed to fetch announcements");
      }

      // Filter by expiration in memory to avoid .or() filter issues
      const nowDate = new Date();
      const announcementsData = (allAnnouncements || []).filter((a) => {
        if (!a.expires_at) return true;
        return new Date(a.expires_at) > nowDate;
      });

      const announcementIds = announcementsData.map((a) => a.id);

      let readData = null;
      if (announcementIds.length > 0) {
        const readResult = await supabase
          .from("notification_reads")
          .select("*")
          .eq("user_id", userId)
          .in("announcement_id", announcementIds);
        if (readResult.error) {
          if (process.env.NODE_ENV === "development") {
            console.error("Notification reads query error:", readResult.error);
          }
        }
        readData = readResult.data;
      }

      const readMap = new Set((readData || []).map((r) => r.announcement_id));

      const announcementsWithRead: AnnouncementWithReadStatus[] = announcementsData.map(
        (a) => ({
          ...a,
          is_read: readMap.has(a.id),
        })
      );

      setAnnouncements(announcementsWithRead);
      setUnreadCount(announcementsWithRead.filter((a) => !a.is_read).length);
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("AnnouncementWidget error:", err);
      }
      let errorMessage = "Failed to load announcements";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === "object" && "message" in err) {
        errorMessage = String((err as { message: unknown }).message);
      } else if (typeof err === "string") {
        errorMessage = err;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [profile?.id, profile?.school_id, role, maxItems]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

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

  const getTargetLabel = (target: string) => {
    switch (target) {
      case "all":
        return "Everyone";
      case "teachers":
        return "Teachers";
      case "parents":
        return "Parents";
      case "class":
        return "Class";
      case "section":
        return "Section";
      default:
        return target;
    }
  };

  const getTargetColor = (target: string) => {
    switch (target) {
      case "all":
        return "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20";
      case "teachers":
        return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20";
      case "parents":
        return "bg-purple-50 text-purple-700 ring-1 ring-purple-600/20";
      default:
        return "bg-slate-50 text-slate-700 ring-1 ring-slate-600/20";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-gradient-to-r from-slate-50 to-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-blue-50 p-1.5">
            <Bell size={16} className="text-blue-600" />
          </div>
          <h2 className="font-semibold text-slate-800">Announcements</h2>
          {unreadCount > 0 && (
            <span className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 px-2 py-0.5 text-xs font-medium text-white shadow-sm animate-pulse">
              {unreadCount} new
            </span>
          )}
        </div>
        <button
          onClick={() => router.push(announcementsPath)}
          className="flex items-center gap-1 text-sm font-medium text-blue-600 transition-all duration-200 hover:text-blue-700 hover:scale-105"
        >
          View all
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="divide-y divide-slate-100">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 size={24} className="animate-spin text-blue-600" />
            <p className="text-sm text-slate-500">Loading announcements...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <div className="rounded-full bg-red-50 p-3">
              <AlertCircle size={24} className="text-red-500" />
            </div>
            <p className="text-sm text-slate-600">Failed to load announcements</p>
            <button
              onClick={fetchAnnouncements}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:scale-105"
            >
              Try again
            </button>
          </div>
        ) : announcements.length === 0 ? (
          <div className="py-12 text-center animate-fade-in">
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <Sparkles size={24} className="text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-700">No announcements yet</p>
            <p className="text-xs text-slate-400 mt-1">Announcements will appear here when published</p>
          </div>
        ) : (
          announcements.map((announcement, index) => (
            <button
              key={announcement.id}
              onClick={() => {
                if (!announcement.is_read) {
                  markAsRead(announcement.id);
                }
                router.push(announcementsPath);
              }}
              className={`w-full px-5 py-3 text-left transition-all duration-200 hover:bg-blue-50/50 group ${
                !announcement.is_read ? "bg-blue-50/30" : ""
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
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
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`truncate text-sm transition-colors duration-200 ${
                        announcement.is_read ? "text-slate-600" : "font-medium text-slate-800 group-hover:text-blue-700"
                      }`}
                    >
                      {announcement.title}
                    </p>
                    <span className="flex-shrink-0 text-xs text-slate-400">
                      {formatDate(announcement.created_at)}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                    {announcement.message}
                  </p>
                  <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getTargetColor(announcement.target_type)}`}>
                    {getTargetLabel(announcement.target_type)}
                  </span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
