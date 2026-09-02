"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, Trash2, Users, BookOpen, Layers, Award, Calendar } from "lucide-react";
import type { Profile, Class, Section, Subject, TeacherAssignment } from "@/types/database";

type AssignmentWithDetails = TeacherAssignment & {
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
      .from("teacher_assignments")
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
        .from("teacher_assignments")
        .delete()
        .eq("id", assignment.id);

      if (deleteError) {
        setError("Failed to remove assignment.");
        return;
      }

      router.push("/admin/assignments");
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to remove assignment.");
    } finally {
      setIsDeleting(false);
    }
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
          onClick={() => router.push("/admin/assignments")}
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

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push("/admin/assignments")}
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
              {assignment.profiles?.full_name?.charAt(0) || "T"}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {assignment.profiles?.full_name || "Unknown"}
              </h1>
              <p className="text-sm text-slate-500">
                {assignment.subjects?.name} • {assignment.classes?.name} - {assignment.sections?.name}
              </p>
              <span
                className={`mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                  assignment.is_class_teacher
                    ? "bg-blue-50 text-blue-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {assignment.is_class_teacher ? (
                  <><Award size={12} /> Class Teacher</>
                ) : (
                  "Subject Teacher"
                )}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <Trash2 size={16} />
              Remove
            </button>
            <button
              onClick={() => {
                // Navigate back to list - edit is handled via modal on list page
                router.push("/admin/assignments");
              }}
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
        {/* Teacher Information */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Users size={20} className="text-blue-600" />
            Teacher Information
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500">Full Name</p>
              <p className="text-sm font-medium text-slate-700">{assignment.profiles?.full_name || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Email</p>
              <p className="text-sm font-medium text-slate-700">{assignment.profiles?.email || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Phone</p>
              <p className="text-sm font-medium text-slate-700">{assignment.profiles?.phone || "—"}</p>
            </div>
          </div>
        </div>

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
            <div>
              <p className="text-xs text-slate-500">Description</p>
              <p className="text-sm font-medium text-slate-700">{assignment.subjects?.description || "—"}</p>
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
            <div>
              <p className="text-xs text-slate-500">Role</p>
              <p className="text-sm font-medium text-slate-700">
                {assignment.is_class_teacher ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                    <Award size={12} />
                    Class Teacher
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    Subject Teacher
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Calendar size={20} className="text-emerald-600" />
            Timeline
          </h2>
          <div className="space-y-4">
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
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-800">Remove Assignment</h3>
                <p className="mt-1 text-sm text-slate-500">
                  This assignment relationship will be permanently removed.
                </p>
              </div>
            </div>

            <div className="mb-6 rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Assignment</p>
              <p className="text-sm font-semibold text-slate-800">
                {assignment.profiles?.full_name}
              </p>
              <p className="text-xs text-slate-500">
                {assignment.subjects?.name} • {assignment.classes?.name} - {assignment.sections?.name}
              </p>
            </div>

            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs text-amber-700">
                <strong>Note:</strong> Removing this assignment will not delete the teacher, subject, class, or section. Only the assignment relationship will be removed.
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
                {isDeleting ? "Removing..." : "Remove Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
