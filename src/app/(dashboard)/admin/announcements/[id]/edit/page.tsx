"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loader2, ArrowLeft, Save, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AnnouncementTargetType, Class, Section } from "@/types/database";

export default function EditAnnouncementPage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = useAuth();
  const router = useRouter();
  const [announcementId, setAnnouncementId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState<AnnouncementTargetType>("all");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [publishedAt, setPublishedAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  useEffect(() => {
    (async () => {
      const { id } = await params;
      setAnnouncementId(id);
    })();
  }, [params]);

  useEffect(() => {
    if (!announcementId || !profile?.school_id) return;

    let cancelled = false;

    (async () => {
      setLoadingData(true);
      try {
        const supabase = createClient();

        const [classesRes, announcementRes] = await Promise.all([
          supabase
            .from("classes")
            .select("*")
            .eq("school_id", profile.school_id)
            .eq("is_active", true)
            .order("name"),
          supabase.from("announcements").select("*").eq("id", announcementId).single(),
        ]);

        if (cancelled) return;

        setClasses(classesRes.data || []);

        if (announcementRes.data) {
          const announcement = announcementRes.data;
          setTitle(announcement.title);
          setMessage(announcement.message);
          setTargetType(announcement.target_type);
          setSelectedClass(announcement.class_id || "");
          setSelectedSection(announcement.section_id || "");
          setPublishedAt(
            announcement.published_at
              ? new Date(announcement.published_at).toISOString().slice(0, 16)
              : ""
          );
          setExpiresAt(
            announcement.expires_at
              ? new Date(announcement.expires_at).toISOString().slice(0, 16)
              : ""
          );

          if (announcement.class_id) {
            const { data: sectionsData } = await supabase
              .from("sections")
              .select("*")
              .eq("class_id", announcement.class_id)
              .eq("is_active", true)
              .order("name");

            if (!cancelled) {
              setSections(sectionsData || []);
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load data");
        }
      } finally {
        if (!cancelled) {
          setLoadingData(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [announcementId, profile?.school_id]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!selectedClass || !profile?.school_id) {
        setSections([]);
        return;
      }

      try {
        const supabase = createClient();

        const { data: sectionsData } = await supabase
          .from("sections")
          .select("*")
          .eq("class_id", selectedClass)
          .eq("is_active", true)
          .order("name");

        if (cancelled) return;

        setSections(sectionsData || []);
        setSelectedSection("");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load sections");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedClass, profile?.school_id]);

  const validate = (): boolean => {
    if (!title.trim()) {
      setError("Title is required");
      return false;
    }
    if (!message.trim()) {
      setError("Message is required");
      return false;
    }
    if (targetType === "class" && !selectedClass) {
      setError("Please select a class");
      return false;
    }
    if (targetType === "section" && !selectedSection) {
      setError("Please select a section");
      return false;
    }
    if (publishedAt && expiresAt && new Date(expiresAt) <= new Date(publishedAt)) {
      setError("Expiry date cannot be before publish date");
      return false;
    }
    return true;
  };

  const handleSubmit = async (publish: boolean) => {
    if (!validate()) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const announcementData = {
        title: title.trim(),
        message: message.trim(),
        target_type: targetType,
        class_id: targetType === "class" ? selectedClass : null,
        section_id: targetType === "section" ? selectedSection : null,
        is_active: publish,
        published_at: publish ? new Date().toISOString() : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      };

      const { error } = await supabase
        .from("announcements")
        .update(announcementData)
        .eq("id", announcementId);

      if (error) throw error;

      router.push("/admin/announcements");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save announcement");
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <DashboardLayout allowedRoles={["admin"]}>
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-blue-600" />
          <span className="ml-3 text-slate-600">Loading...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout allowedRoles={["admin"]}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Link
            href="/admin/announcements"
            className="mb-2 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft size={16} />
            Back to Announcements
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">Edit Announcement</h1>
          <p className="mt-1 text-sm text-slate-500">Update the announcement details.</p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-6">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter announcement title"
                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter announcement message"
                rows={6}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Target Audience <span className="text-red-500">*</span>
              </label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as AnnouncementTargetType)}
                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">Everyone</option>
                <option value="teachers">Teachers Only</option>
                <option value="parents">Parents Only</option>
                <option value="class">Specific Class</option>
                <option value="section">Specific Section</option>
              </select>
            </div>

            {(targetType === "class" || targetType === "section") && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Class <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {targetType === "section" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Section <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  disabled={!selectedClass}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select Section</option>
                  {sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Publish Date (optional)
              </label>
              <input
                type="datetime-local"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <p className="mt-1 text-xs text-slate-500">Leave empty to set when published</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Expiry Date (optional)
              </label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <p className="mt-1 text-xs text-slate-500">Leave empty for no expiry</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link
            href="/admin/announcements"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            onClick={() => handleSubmit(false)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <Save size={18} />
            Save as Draft
          </button>
          <button
            onClick={() => handleSubmit(true)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            <Send size={18} />
            {loading ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
