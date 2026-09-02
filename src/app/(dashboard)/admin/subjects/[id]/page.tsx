"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Edit, Power, PowerOff, Users, Layers, Hash } from "lucide-react";
import type { Subject } from "@/types/database";

interface SubjectDetailData extends Subject {
  classes: { id: string; name: string }[];
  sections: { id: string; name: string; class_name: string }[];
  teachers: { id: string; full_name: string }[];
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function SubjectDetailPage() {
  const [subject, setSubject] = useState<SubjectDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const subjectId = params.id as string;

  const fetchSubject = useCallback(async () => {
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

    // Fetch subject
    const { data: subjectData, error: subjectError } = await supabase
      .from("subjects")
      .select("*")
      .eq("id", subjectId)
      .eq("school_id", profile.school_id)
      .single();

    if (subjectError || !subjectData) {
      setError("Subject not found.");
      setIsLoading(false);
      return;
    }

    // Fetch teacher assignments with related data
    const { data: assignments } = await supabase
      .from("teacher_assignments")
      .select(`
        teacher_id,
        class_id,
        section_id,
        profiles!teacher_assignments_teacher_id_fkey(full_name),
        classes!teacher_assignments_class_id_fkey(name),
        sections!teacher_assignments_section_id_fkey(name)
      `)
      .eq("subject_id", subjectId)
      .eq("school_id", profile.school_id);

    // Extract unique teachers, classes, and sections
    const teachersMap = new Map<string, { id: string; full_name: string }>();
    const classesMap = new Map<string, { id: string; name: string }>();
    const sectionsMap = new Map<string, { id: string; name: string; class_name: string }>();

    if (assignments) {
      assignments.forEach((a) => {
        if (a.profiles && !teachersMap.has(a.teacher_id)) {
          teachersMap.set(a.teacher_id, {
            id: a.teacher_id,
            full_name: (a.profiles as unknown as { full_name: string }).full_name,
          });
        }
        if (a.classes && !classesMap.has(a.class_id)) {
          classesMap.set(a.class_id, {
            id: a.class_id,
            name: (a.classes as unknown as { name: string }).name,
          });
        }
        if (a.sections && !sectionsMap.has(a.section_id)) {
          sectionsMap.set(a.section_id, {
            id: a.section_id,
            name: (a.sections as unknown as { name: string }).name,
            class_name: (a.classes as unknown as { name: string }).name || "",
          });
        }
      });
    }

    const subjectDetail: SubjectDetailData = {
      ...subjectData,
      classes: Array.from(classesMap.values()),
      sections: Array.from(sectionsMap.values()),
      teachers: Array.from(teachersMap.values()),
    };

    setSubject(subjectDetail);
    setIsLoading(false);
  }, [supabase, router, subjectId]);

  useEffect(() => {
    (async () => {
      await fetchSubject();
    })();
  }, [fetchSubject]);

  const handleToggleStatus = async () => {
    if (!subject) return;

    setIsUpdatingStatus(true);
    try {
      const { error: updateError } = await supabase
        .from("subjects")
        .update({ is_active: !subject.is_active })
        .eq("id", subject.id);

      if (updateError) {
        setError("Failed to update subject status.");
        return;
      }

      setSubject({ ...subject, is_active: !subject.is_active });
      setShowStatusDialog(false);
    } catch (err) {
      console.error("Status update error:", err);
      setError("Failed to update subject status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading subject...</p>
        </div>
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push("/admin/subjects")}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft size={16} />
          Back to Subjects
        </button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error || "Subject not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push("/admin/subjects")}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={16} />
        Back to Subjects
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
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-2xl font-bold text-purple-700">
              {subject.name?.charAt(0) || "S"}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{subject.name}</h1>
              <p className="text-sm text-slate-500">{subject.code}</p>
              <span
                className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                  subject.is_active
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {subject.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowStatusDialog(true)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                subject.is_active
                  ? "text-red-600 hover:bg-red-50"
                  : "text-emerald-600 hover:bg-emerald-50"
              }`}
            >
              {subject.is_active ? (
                <><PowerOff size={16} /> Deactivate</>
              ) : (
                <><Power size={16} /> Activate</>
              )}
            </button>
            <button
              onClick={() => {
                // Navigate back to list and open edit modal
                router.push("/admin/subjects");
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
        {/* Subject Information */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
            <BookOpen size={20} className="text-purple-600" />
            Subject Information
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500">Subject Name</p>
              <p className="text-sm font-medium text-slate-700">{subject.name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Subject Code</p>
              <p className="text-sm font-medium text-slate-700">
                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs">
                  {subject.code}
                </span>
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Description</p>
              <p className="text-sm font-medium text-slate-700">{subject.description || "—"}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500">Created</p>
                <p className="text-sm font-medium text-slate-700">{formatDate(subject.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Last Updated</p>
                <p className="text-sm font-medium text-slate-700">{formatDate(subject.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Statistics</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-emerald-50 p-4 text-center">
              <Users size={24} className="mx-auto text-emerald-600" />
              <p className="mt-2 text-2xl font-bold text-emerald-700">{subject.teachers.length}</p>
              <p className="text-xs text-emerald-600">Teachers</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-4 text-center">
              <Layers size={24} className="mx-auto text-amber-600" />
              <p className="mt-2 text-2xl font-bold text-amber-700">{subject.classes.length}</p>
              <p className="text-xs text-amber-600">Classes</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-4 text-center">
              <Hash size={24} className="mx-auto text-blue-600" />
              <p className="mt-2 text-2xl font-bold text-blue-700">{subject.sections.length}</p>
              <p className="text-xs text-blue-600">Sections</p>
            </div>
          </div>
        </div>
      </div>

      {/* Teachers */}
      {subject.teachers.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Users size={20} className="text-emerald-600" />
            Assigned Teachers ({subject.teachers.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {subject.teachers.map((teacher) => (
              <span
                key={teacher.id}
                className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700"
              >
                {teacher.full_name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Classes */}
      {subject.classes.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Layers size={20} className="text-amber-600" />
            Classes ({subject.classes.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {subject.classes.map((cls) => (
              <span
                key={cls.id}
                className="rounded-full bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700"
              >
                {cls.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sections */}
      {subject.sections.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Hash size={20} className="text-blue-600" />
            Sections ({subject.sections.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {subject.sections.map((section) => (
              <span
                key={section.id}
                className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700"
              >
                {section.class_name} - {section.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Empty State for No Assignments */}
      {subject.teachers.length === 0 && subject.classes.length === 0 && subject.sections.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <BookOpen className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700">No assignments yet</h3>
          <p className="mt-1 text-sm text-slate-500">
            This subject has not been assigned to any teachers or classes yet.
          </p>
        </div>
      )}

      {/* Status Dialog */}
      {showStatusDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
                <BookOpen className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-800">
                  {subject.is_active ? "Deactivate Subject" : "Activate Subject"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {subject.is_active
                    ? "This subject will be marked as inactive but all records will be preserved."
                    : "This subject will be reactivated and available for assignments."}
                </p>
              </div>
            </div>

            <div className="mb-6 rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Subject</p>
              <p className="text-sm font-semibold text-slate-800">{subject.name}</p>
              <p className="text-xs text-slate-500">{subject.code}</p>
            </div>

            {subject.is_active && (
              <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs text-amber-700">
                  <strong>Note:</strong> Deactivated subjects will not appear in new assignments, but existing records will remain intact.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowStatusDialog(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleStatus}
                disabled={isUpdatingStatus}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  subject.is_active
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {isUpdatingStatus
                  ? "Processing..."
                  : subject.is_active
                  ? "Deactivate"
                  : "Activate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
