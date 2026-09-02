"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Users, Edit, UserCheck, UserX, Phone, Briefcase, Link } from "lucide-react";
import type { Parent } from "@/types/database";

interface ParentDetailData extends Parent {
  students: {
    id: string;
    full_name: string;
    student_id: string;
    roll_number: string | null;
    class_name: string | null;
    section_name: string | null;
    status: string;
  }[];
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ParentDetailPage() {
  const [parent, setParent] = useState<ParentDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const parentId = params.id as string;

  const fetchParent = useCallback(async () => {
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

    // Fetch parent
    const { data: parentData, error: parentError } = await supabase
      .from("parents")
      .select("*")
      .eq("id", parentId)
      .eq("school_id", profile.school_id)
      .single();

    if (parentError || !parentData) {
      setError("Parent not found.");
      setIsLoading(false);
      return;
    }

    // Fetch linked students
    const { data: relationships } = await supabase
      .from("parent_student")
      .select("student_id")
      .eq("parent_id", parentId);

    const studentIds = relationships?.map((r) => r.student_id) || [];
    let studentsWithDetails: ParentDetailData["students"] = [];

    if (studentIds.length > 0) {
      const { data: studentData } = await supabase
        .from("students")
        .select("*, classes!class_id(name), sections!section_id(name)")
        .in("id", studentIds);

      studentsWithDetails = (studentData || []).map((s) => ({
        id: s.id,
        full_name: s.full_name,
        student_id: s.student_id,
        roll_number: s.roll_number,
        class_name: (s.classes as unknown as { name: string })?.name || null,
        section_name: (s.sections as unknown as { name: string })?.name || null,
        status: s.status,
      }));
    }

    setParent({
      ...parentData,
      students: studentsWithDetails,
    });
    setIsLoading(false);
  }, [supabase, router, parentId]);

  useEffect(() => {
    (async () => {
      await fetchParent();
    })();
  }, [fetchParent]);

  const handleToggleStatus = async () => {
    if (!parent) return;

    setIsUpdatingStatus(true);
    try {
      const { error: updateError } = await supabase
        .from("parents")
        .update({ is_active: !parent.is_active })
        .eq("id", parent.id);

      if (updateError) {
        setError("Failed to update parent status.");
        return;
      }

      setParent({ ...parent, is_active: !parent.is_active });
      setShowStatusDialog(false);
    } catch (err) {
      console.error("Status update error:", err);
      setError("Failed to update parent status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading parent...</p>
        </div>
      </div>
    );
  }

  if (error || !parent) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push("/admin/parents")}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft size={16} />
          Back to Parents
        </button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error || "Parent not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push("/admin/parents")}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={16} />
        Back to Parents
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
              {parent.full_name?.charAt(0) || "P"}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{parent.full_name}</h1>
              <p className="text-sm capitalize text-slate-500">{parent.relationship}</p>
              <span
                className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                  parent.is_active
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {parent.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowStatusDialog(true)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                parent.is_active
                  ? "text-red-600 hover:bg-red-50"
                  : "text-emerald-600 hover:bg-emerald-50"
              }`}
            >
              {parent.is_active ? (
                <><UserX size={16} /> Deactivate</>
              ) : (
                <><UserCheck size={16} /> Activate</>
              )}
            </button>
            <button
              onClick={() => router.push("/admin/parents")}
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
        {/* Contact Information */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Phone size={20} className="text-emerald-600" />
            Contact Information
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500">Phone</p>
              <p className="text-sm font-medium text-slate-700">{parent.phone || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Email</p>
              <p className="text-sm font-medium text-slate-700">{parent.email || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Address</p>
              <p className="text-sm font-medium text-slate-700">{parent.address || "—"}</p>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Briefcase size={20} className="text-amber-600" />
            Additional Information
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500">Occupation</p>
              <p className="text-sm font-medium text-slate-700">{parent.occupation || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Added</p>
              <p className="text-sm font-medium text-slate-700">{formatDate(parent.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Last Updated</p>
              <p className="text-sm font-medium text-slate-700">{formatDate(parent.updated_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Linked Students */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
          <Link size={20} className="text-purple-600" />
          Linked Students ({parent.students.length})
        </h2>
        {parent.students.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {parent.students.map((student) => (
              <div key={student.id} className="flex items-center gap-4 py-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                  {student.full_name?.charAt(0) || "S"}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-800">{student.full_name}</p>
                  <p className="text-xs text-slate-500">
                    {student.student_id} {student.roll_number && `• Roll #${student.roll_number}`}
                  </p>
                </div>
                <div className="text-right">
                  {student.class_name && (
                    <p className="text-sm text-slate-600">
                      {student.class_name} - {student.section_name}
                    </p>
                  )}
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      student.status === "active"
                        ? "bg-emerald-50 text-emerald-700"
                        : student.status === "inactive"
                        ? "bg-red-50 text-red-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {student.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <Users className="mx-auto mb-2 h-8 w-8 text-slate-400" />
            <p className="text-sm text-slate-500">No students linked to this parent</p>
          </div>
        )}
      </div>

      {/* Status Dialog */}
      {showStatusDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
                <Users className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-800">
                  {parent.is_active ? "Deactivate Parent" : "Activate Parent"}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {parent.is_active
                    ? "This parent will be marked as inactive but their data will be preserved."
                    : "This parent will be reactivated and regain access to the system."}
                </p>
              </div>
            </div>

            <div className="mb-6 rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Parent</p>
              <p className="text-sm font-semibold text-slate-800">{parent.full_name}</p>
            </div>

            {parent.is_active && (
              <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs text-amber-700">
                  <strong>Note:</strong> Deactivated parents will not be able to log in, but all their records and student relationships will remain in the system.
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
                  parent.is_active
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {isUpdatingStatus
                  ? "Processing..."
                  : parent.is_active
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
