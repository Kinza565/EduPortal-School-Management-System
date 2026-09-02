"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loader2, ArrowLeft, Edit2, Trash2, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Announcement } from "@/types/database";

export default function AnnouncementViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile } = useAuth();
  const router = useRouter();
  const [announcementId, setAnnouncementId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

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
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        const { data, error: fetchError } = await supabase
          .from("announcements")
          .select("*")
          .eq("id", announcementId)
          .eq("school_id", profile.school_id)
          .single();

        if (cancelled) return;
        if (fetchError) throw fetchError;

        setAnnouncement(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load announcement");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [announcementId, profile?.school_id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.from("announcements").delete().eq("id", announcementId);

      if (error) throw error;

      router.push("/admin/announcements");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete announcement");
    }
  };

  const handleToggleStatus = async () => {
    if (!announcement) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("announcements")
        .update({
          is_active: !announcement.is_active,
          published_at: !announcement.is_active ? new Date().toISOString() : null,
        })
        .eq("id", announcementId);

      if (error) throw error;

      setAnnouncement((prev) =>
        prev
          ? {
              ...prev,
              is_active: !prev.is_active,
              published_at: !prev.is_active ? new Date().toISOString() : null,
            }
          : null
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update announcement");
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

  if (loading) {
    return (
      <DashboardLayout allowedRoles={["admin"]}>
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-blue-600" />
          <span className="ml-3 text-slate-600">Loading...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !announcement) {
    return (
      <DashboardLayout allowedRoles={["admin"]}>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <h3 className="text-lg font-semibold text-red-700">
            {error || "Announcement not found"}
          </h3>
          <Link
            href="/admin/announcements"
            className="mt-4 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft size={16} />
            Back to Announcements
          </Link>
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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800">{announcement.title}</h1>
            {getStatusBadge(announcement)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/announcements/${announcement.id}/edit`}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Edit2 size={18} />
            Edit
          </Link>
          <button
            onClick={handleToggleStatus}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              announcement.is_active
                ? "border-red-200 bg-white text-red-700 hover:bg-red-50"
                : "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
            }`}
          >
            {announcement.is_active ? (
              <>
                <XCircle size={18} />
                Unpublish
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Publish
              </>
            )}
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
          >
            <Trash2 size={18} />
            Delete
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="prose max-w-none">
            <p className="whitespace-pre-wrap text-slate-700">{announcement.message}</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">Details</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-slate-500">Target Audience</p>
              <p className="mt-1 text-sm text-slate-800">{getTargetLabel(announcement.target_type)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Status</p>
              <div className="mt-1">{getStatusBadge(announcement)}</div>
            </div>
            {announcement.published_at && (
              <div>
                <p className="text-sm font-medium text-slate-500">Published At</p>
                <p className="mt-1 text-sm text-slate-800">
                  {new Date(announcement.published_at).toLocaleString()}
                </p>
              </div>
            )}
            {announcement.expires_at && (
              <div>
                <p className="text-sm font-medium text-slate-500">Expires At</p>
                <p className="mt-1 text-sm text-slate-800">
                  {new Date(announcement.expires_at).toLocaleString()}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-slate-500">Created At</p>
              <p className="mt-1 text-sm text-slate-800">
                {new Date(announcement.created_at).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Last Updated</p>
              <p className="mt-1 text-sm text-slate-800">
                {new Date(announcement.updated_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
