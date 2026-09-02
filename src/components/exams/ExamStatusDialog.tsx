"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AlertTriangle, X } from "lucide-react";
import type { Exam } from "@/types/database";

interface ExamStatusDialogProps {
  exam: Exam;
  onClose: () => void;
  onSuccess: () => void;
}

export function ExamStatusDialog({
  exam,
  onClose,
  onSuccess,
}: ExamStatusDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStatusChange(newStatus: string) {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("exams")
        .update({ status: newStatus })
        .eq("id", exam.id);

      if (updateError) throw updateError;
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update status";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const statusOptions = [
    { value: "upcoming", label: "Upcoming", color: "bg-purple-100 text-purple-700" },
    { value: "ongoing", label: "Ongoing", color: "bg-amber-100 text-amber-700" },
    { value: "completed", label: "Completed", color: "bg-emerald-100 text-emerald-700" },
    { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-700" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">Change Exam Status</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 flex items-start gap-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Status Options */}
        <div className="p-6">
          <p className="mb-4 text-sm text-slate-600">
            Current status:{" "}
            <span className="font-medium capitalize">{exam.status}</span>
          </p>

          <div className="space-y-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusChange(option.value)}
                disabled={loading || option.value === exam.status}
                className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                  option.value === exam.status
                    ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-50"
                    : "border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                }`}
              >
                <span className="text-sm font-medium text-slate-700">
                  {option.label}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${option.color}`}
                >
                  {option.value === exam.status ? "Current" : "Select"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end border-t border-slate-100 px-6 py-4">
          <button
            onClick={onClose}
            className="h-10 rounded-lg border border-slate-200 px-5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
