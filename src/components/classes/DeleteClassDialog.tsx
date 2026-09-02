"use client";

import { AlertTriangle, X } from "lucide-react";

interface DeleteClassDialogProps {
  className: string;
  isActive: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DeleteClassDialog({
  className,
  isActive,
  onConfirm,
  onCancel,
  isLoading = false,
}: DeleteClassDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-4 flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-800">
              {isActive ? "Deactivate Class" : "Activate Class"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {isActive
                ? "This class will be marked as inactive but all data will be preserved."
                : "This class will be reactivated and available for use."}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Class Name */}
        <div className="mb-6 rounded-lg bg-slate-50 p-4">
          <p className="text-xs text-slate-500">Class</p>
          <p className="text-sm font-semibold text-slate-800">{className}</p>
        </div>

        {/* Warning for deactivation */}
        {isActive && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs text-amber-700">
              <strong>Note:</strong> Deactivated classes will not appear in active lists, but all sections, students, and assignments will remain in the system.
            </p>
          </div>
        )}

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
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              isActive
                ? "bg-red-600 hover:bg-red-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {isLoading
              ? "Processing..."
              : isActive
              ? "Deactivate"
              : "Activate"}
          </button>
        </div>
      </div>
    </div>
  );
}
