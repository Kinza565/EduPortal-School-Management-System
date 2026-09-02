"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, Trash2, BookOpen, Layers, Users, Calendar, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import type { AcademicAssignment, Profile, Class, Section, Subject } from "@/types/database";

type AssignmentWithDetails = AcademicAssignment & {
  profiles: Profile;
  classes: Class;
  sections: Section;
  subjects: Subject;
};

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function AssignmentDetailPage() {
  const [assignment, setAssignment] = useState<AssignmentWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.id as string;

  const fetchAssignment = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, school_id")
      .eq("id", session.user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      router.push("/login");
      return;
    }

    setError(null);

    const { data: assignmentData, error: assignmentError } = await supabase
      .from("academic_assignments")
      .select("*, profiles(*), classes(*), sections(*), subjects(*)")
      .eq("id", assignmentId)
      .eq("school_id", profile.school_id)
      .single();

    if (assignmentError || !assignmentData) {
      setError("Assignment not found.");
      setIsLoading(false);
      return;
    }

    setAssignment(assignmentData as AssignmentWithDetails);
    setIsLoading(false);
  }, [supabase, router, assignmentId]);

  useEffect(() => {
    (async () => {
      await fetchAssignment();
    })();
  }, [fetchAssignment]);

  const handleDelete = async () => {
    if (!assignment) return;

    setIsDeleting(true);
    try {
      const { error: deleteError } = await supabase
        .from("academic_assignments")
        .delete()
        .eq("id", assignment.id);

      if (deleteError) {
        setError("Failed to delete assignment.");
        return;
      }

      router.push("/admin/academic-assignments");
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete assignment.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getComputedStatus = () => {
    if (!assignment) return "active";
    const today = new Date().toISOString().split("T")[0];
    if (assignment.due_date < today && assignment.status === "active") return "overdue";
    if (assignment.due_date === today) return "due_today";
    if (assignment.due_date > today) return "upcoming";
    return "active";
  };

  const getStatusBadge = () => {
    const computedStatus = getComputedStatus();
    if (computedStatus === "overdue") {
      return { label: "Overdue", className: "bg-red-50 text-red-700", icon: <AlertTriangle size={16} /> };
    }
    if (computedStatus === "due_today") {
      return { label: "Due Today", className: "bg-amber-50 text-amber-700", icon: <Clock size={16} /> };
    }
    if (computedStatus === "upcoming") {
      return { label: "Upcoming", className: "bg-purple-50 text-purple-700", icon: <Calendar size={16} /> };
    }

    const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      active: { label: "Active", className: "bg-emerald-50 text-emerald-700", icon: <CheckCircle size={16} /> },
      inactive: { label: "Inactive", className: "bg-slate-100 text-slate-600", icon: null },
      completed: { label: "Completed", className: "bg-blue-50 text-blue-700", icon: <CheckCircle size={16} /> },
      cancelled: { label: "Cancelled", className: "bg-red-50 text-red-600", icon: null },
    };
    return statusConfig[assignment?.status || "active"] || statusConfig.active;
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading assignment...</p>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push("/admin/academic-assignments")}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft size={16} />
          Back to Assignments
        </button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error || "Assignment not found."}
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge();

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push("/admin/academic-assignments")}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={16} />
        Back to Assignments
      </button>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Header Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{assignment.title}</h1>
            {assignment.description && (
              <p className="mt-2 text-sm text-slate-600">{assignment.description}</p>
            )}
            <span className={`mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge.className}`}>
              {statusBadge.icon}
              {statusBadge.label}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <Trash2 size={16} />
              Delete
            </button>
            <button
              onClick={() => router.push("/admin/academic-assignments")}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <Edit size={16} />
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Subject Information */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
            <BookOpen size={20} className="text-purple-600" />
            Subject Information
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500">Subject Name</p>
              <p className="text-sm font-medium text-slate-700">{assignment.subjects?.name || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Subject Code</p>
              <p className="text-sm font-medium text-slate-700">
                {assignment.subjects?.code ? (
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs">
                    {assignment.subjects.code}
                  </span>
                ) : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Class & Section */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Layers size={20} className="text-amber-600" />
            Class & Section
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500">Class</p>
              <p className="text-sm font-medium text-slate-700">{assignment.classes?.name || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Section</p>
              <p className="text-sm font-medium text-slate-700">{assignment.sections?.name || "—"}</p>
            </div>
          </div>
        </div>

        {/* Teacher */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Users size={20} className="text-emerald-600" />
            Assigned Teacher
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500">Teacher Name</p>
              <p className="text-sm font-medium text-slate-700">{assignment.profiles?.full_name || "—"}</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Calendar size={20} className="text-blue-600" />
            Timeline
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500">Assigned Date</p>
              <p className="text-sm font-medium text-slate-700">{formatDate(assignment.assigned_date)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Due Date</p>
              <p className="text-sm font-medium text-slate-700">{formatDate(assignment.due_date)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Created</p>
              <p className="text-sm font-medium text-slate-700">{formatDate(assignment.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Last Updated</p>
              <p className="text-sm font-medium text-slate-700">{formatDate(assignment.updated_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-800">Delete Assignment</h3>
                <p className="mt-1 text-sm text-slate-500">
                  This assignment will be permanently removed. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="mb-6 rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Assignment</p>
              <p className="text-sm font-semibold text-slate-800">{assignment.title}</p>
            </div>

            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs text-amber-700">
                <strong>Note:</strong> Deleting this assignment will remove all associated data. Consider marking it as &quot;cancelled&quot; instead if you want to keep a record.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
