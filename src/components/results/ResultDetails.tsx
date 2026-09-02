"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, parseISO } from "date-fns";
import {
  ArrowLeft,
  User,
  BookOpen,
  Award,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type { ResultWithDetails } from "@/types/database";
import { getGradeColor, getStatusColor } from "@/utils/gradeCalculator";

interface ResultDetailsProps {
  resultId: string;
  onBack: () => void;
}

export function ResultDetails({ resultId, onBack }: ResultDetailsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultWithDetails | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from("results")
          .select(
            `
            *,
            students(*),
            exams(*),
            exam_subjects(*, subjects(*)),
            classes(*),
            sections(*)
          `
          )
          .eq("id", resultId)
          .single();

        if (cancelled) return;
        if (fetchError) throw fetchError;
        if (!data) throw new Error("Result not found");

        setResult(data as ResultWithDetails);
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Failed to load result";
          setError(message);
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
  }, [resultId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span className="text-slate-600">Loading result...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <AlertCircle size={32} className="mx-auto mb-3 text-red-500" />
        <h3 className="text-lg font-semibold text-red-700">Error Loading Result</h3>
        <p className="mt-1 text-sm text-red-600">{error}</p>
        <button
          onClick={onBack}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <AlertCircle size={48} className="mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-semibold text-slate-700">Result Not Found</h3>
        <p className="mt-1 text-sm text-slate-500">
          The result you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <button
          onClick={onBack}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Back to Results
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Result Details</h1>
          <p className="mt-1 text-sm text-slate-500">
            {result.students?.full_name} • {result.exams?.name}
          </p>
        </div>
      </div>

      {/* Status Banner */}
      <div
        className={`flex items-center gap-3 rounded-xl border p-4 ${
          result.status === "pass"
            ? "border-emerald-200 bg-emerald-50"
            : "border-red-200 bg-red-50"
        }`}
      >
        {result.status === "pass" ? (
          <CheckCircle size={24} className="text-emerald-600" />
        ) : (
          <XCircle size={24} className="text-red-600" />
        )}
        <div>
          <p className="font-medium text-slate-800">
            {result.status === "pass" ? "Passed" : "Failed"}
          </p>
          <p className="text-sm text-slate-600">
            {result.status === "pass"
              ? "Congratulations! The student has passed this exam."
              : "The student did not meet the passing criteria."}
          </p>
        </div>
      </div>

      {/* Student & Exam Info */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Student Information */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
            <User size={18} className="text-blue-600" />
            Student Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Name</span>
              <span className="text-sm font-medium text-slate-800">
                {result.students?.full_name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Student ID</span>
              <span className="text-sm font-medium text-slate-800">
                {result.students?.student_id}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Roll Number</span>
              <span className="text-sm font-medium text-slate-800">
                {result.students?.roll_number || "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Class</span>
              <span className="text-sm font-medium text-slate-800">
                {result.classes?.name}
                {result.sections?.name && ` - ${result.sections.name}`}
              </span>
            </div>
          </div>
        </div>

        {/* Exam Information */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
            <BookOpen size={18} className="text-purple-600" />
            Exam Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Exam</span>
              <span className="text-sm font-medium text-slate-800">
                {result.exams?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Subject</span>
              <span className="text-sm font-medium text-slate-800">
                {result.exam_subjects?.subjects?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Exam Type</span>
              <span className="text-sm font-medium capitalize text-slate-800">
                {result.exams?.exam_type.replace("_", " ")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Exam Date</span>
              <span className="text-sm font-medium text-slate-800">
                {result.exam_subjects?.exam_date
                  ? format(parseISO(result.exam_subjects.exam_date), "MMM d, yyyy")
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Result Summary */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
          <Award size={18} className="text-amber-600" />
          Result Summary
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-slate-50 p-4 text-center">
            <p className="text-xs font-medium text-slate-500">Obtained Marks</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">
              {result.obtained_marks}
            </p>
            <p className="text-xs text-slate-400">out of {result.total_marks}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 text-center">
            <p className="text-xs font-medium text-slate-500">Percentage</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">
              {result.percentage}%
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 text-center">
            <p className="text-xs font-medium text-slate-500">Grade</p>
            <span
              className={`mt-1 inline-flex items-center rounded-full px-3 py-1 text-lg font-bold ring-1 ring-inset ${getGradeColor(
                result.grade
              )}`}
            >
              {result.grade}
            </span>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 text-center">
            <p className="text-xs font-medium text-slate-500">Status</p>
            <span
              className={`mt-1 inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset ${getStatusColor(
                result.status
              )}`}
            >
              {result.status === "pass" ? "Passed" : "Failed"}
            </span>
          </div>
        </div>
      </div>

      {/* Remarks */}
      {result.remarks && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Remarks</h3>
          <p className="text-sm leading-relaxed text-slate-600">{result.remarks}</p>
        </div>
      )}
    </div>
  );
}
