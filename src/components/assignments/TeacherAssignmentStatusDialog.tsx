"use client";

import { AlertTriangle, X } from "lucide-react";

interface TeacherAssignmentStatusDialogProps {
  assignmentInfo: {
    teacher_name: string;
    subject_name: string;
    class_name: string;
    section_name: string;
  };
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TeacherAssignmentStatusDialog({
  assignmentInfo,
  onConfirm,
  onCancel,
  isLoading = false,
}: TeacherAssignmentStatusDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-4 flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-800">
              Remove Assignment
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              This assignment relationship will be permanently removed.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Assignment Info */}
        <div className="mb-6 rounded-lg bg-slate-50 p-4">
          <p className="text-xs text-slate-500">Assignment</p>
          <p className="text-sm font-semibold text-slate-800">
            {assignmentInfo.teacher_name}
          </p>
          <p className="text-xs text-slate-500">
            {assignmentInfo.subject_name} • {assignmentInfo.class_name} - {assignmentInfo.section_name}
          </p>
        </div>

        {/* Warning */}
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs text-amber-700">
            <strong>Note:</strong> Removing this assignment will not delete the teacher, subject, class, or section. Only the assignment relationship will be removed.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Removing..." : "Remove Assignment"}
          </button>
        </div>
      </div>
    </div>
  );
}
