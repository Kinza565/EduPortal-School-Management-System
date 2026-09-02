"use client";

import { X, Users, BookOpen, Layers, Award, Calendar, Edit, Trash2 } from "lucide-react";

interface TeacherAssignmentDetailsProps {
  assignment: {
    id: string;
    teacher_name: string;
    teacher_email?: string;
    teacher_phone?: string;
    subject_name: string;
    subject_code?: string;
    class_name: string;
    section_name: string;
    is_class_teacher: boolean;
    created_at: string;
    updated_at?: string;
  };
  onClose: () => void;
  onEdit: () => void;
  onRemove: () => void;
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function TeacherAssignmentDetails({
  assignment,
  onClose,
  onEdit,
  onRemove,
}: TeacherAssignmentDetailsProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">Assignment Details</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Assignment Header */}
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
              {assignment.teacher_name?.charAt(0) || "T"}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-800">{assignment.teacher_name}</h3>
              <p className="text-sm text-slate-500">
                {assignment.subject_name} • {assignment.class_name} - {assignment.section_name}
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

          {/* Details Grid */}
          <div className="space-y-6">
            {/* Teacher Info */}
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Users size={16} className="text-blue-600" />
                Teacher Information
              </h4>
              <div className="grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Full Name</p>
                  <p className="text-sm font-medium text-slate-700">{assignment.teacher_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="text-sm font-medium text-slate-700">{assignment.teacher_email || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Phone</p>
                  <p className="text-sm font-medium text-slate-700">{assignment.teacher_phone || "—"}</p>
                </div>
              </div>
            </div>

            {/* Subject Info */}
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <BookOpen size={16} className="text-purple-600" />
                Subject Information
              </h4>
              <div className="grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Subject Name</p>
                  <p className="text-sm font-medium text-slate-700">{assignment.subject_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Subject Code</p>
                  <p className="text-sm font-medium text-slate-700">
                    {assignment.subject_code ? (
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs">
                        {assignment.subject_code}
                      </span>
                    ) : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Class & Section Info */}
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Layers size={16} className="text-amber-600" />
                Class & Section
              </h4>
              <div className="grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Class</p>
                  <p className="text-sm font-medium text-slate-700">{assignment.class_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Section</p>
                  <p className="text-sm font-medium text-slate-700">{assignment.section_name}</p>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Calendar size={16} className="text-emerald-600" />
                Timeline
              </h4>
              <div className="grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-2">
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
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
          <button
            onClick={onRemove}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <Trash2 size={16} />
            Remove
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Close
            </button>
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <Edit size={16} />
              Edit Assignment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
