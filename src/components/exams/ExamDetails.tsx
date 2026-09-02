"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, parseISO } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Clock,
  BookOpen,
  MapPin,
  User,
  Edit,
  AlertCircle,
  FileText,
  CheckCircle,
  XCircle,
  Timer,
} from "lucide-react";
import type { ExamWithDetails } from "@/types/database";

interface ExamDetailsProps {
  examId: string;
  onBack: () => void;
  onEdit: () => void;
  onManageSubjects: () => void;
}

function formatExamType(type: string): string {
  const types: Record<string, string> = {
    unit_test: "Unit Test",
    mid_term: "Mid Term",
    final: "Final",
    quarterly: "Quarterly",
    half_yearly: "Half Yearly",
    annual: "Annual",
    other: "Other",
  };
  return types[type] || type;
}

function getStatusConfig(status: string) {
  switch (status) {
    case "upcoming":
      return {
        color: "bg-purple-50 text-purple-700 ring-purple-600/20",
        icon: Timer,
        label: "Upcoming",
      };
    case "ongoing":
      return {
        color: "bg-amber-50 text-amber-700 ring-amber-600/20",
        icon: Clock,
        label: "Ongoing",
      };
    case "completed":
      return {
        color: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
        icon: CheckCircle,
        label: "Completed",
      };
    case "cancelled":
      return {
        color: "bg-red-50 text-red-700 ring-red-600/20",
        icon: XCircle,
        label: "Cancelled",
      };
    default:
      return {
        color: "bg-slate-50 text-slate-700 ring-slate-600/20",
        icon: FileText,
        label: status,
      };
  }
}

export function ExamDetails({
  examId,
  onBack,
  onEdit,
  onManageSubjects,
}: ExamDetailsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exam, setExam] = useState<ExamWithDetails | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        const { data, error: fetchError } = await supabase
          .from("exams")
          .select(
            `
            *,
            classes (*),
            sections (*),
            exam_subjects (
              *,
              subjects (*),
              invigilator:profiles (*)
            )
          `
          )
          .eq("id", examId)
          .single();

        if (cancelled) return;

        if (fetchError) throw fetchError;
        if (!data) throw new Error("Exam not found");

        setExam(data as ExamWithDetails);
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Failed to load exam details";
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
  }, [examId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span className="text-slate-600">Loading exam details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <AlertCircle size={32} className="mx-auto mb-3 text-red-500" />
        <h3 className="text-lg font-semibold text-red-700">Error Loading Exam</h3>
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

  if (!exam) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <FileText size={48} className="mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-semibold text-slate-700">Exam Not Found</h3>
        <p className="mt-1 text-sm text-slate-500">
          The exam you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <button
          onClick={onBack}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Back to Exams
        </button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(exam.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{exam.name}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {formatExamType(exam.exam_type)} • {exam.classes?.name}
              {exam.sections?.name && ` • ${exam.sections.name}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onManageSubjects}
            className="flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-100"
          >
            <BookOpen size={16} />
            Manage Subjects
          </button>
          <button
            onClick={onEdit}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Edit size={16} />
            Edit Exam
          </button>
        </div>
      </div>

      {/* Status Banner */}
      <div
        className={`flex items-center gap-3 rounded-xl border p-4 ${
          exam.status === "upcoming"
            ? "border-purple-200 bg-purple-50"
            : exam.status === "ongoing"
            ? "border-amber-200 bg-amber-50"
            : exam.status === "completed"
            ? "border-emerald-200 bg-emerald-50"
            : "border-red-200 bg-red-50"
        }`}
      >
        <StatusIcon
          size={24}
          className={
            exam.status === "upcoming"
              ? "text-purple-600"
              : exam.status === "ongoing"
              ? "text-amber-600"
              : exam.status === "completed"
              ? "text-emerald-600"
              : "text-red-600"
          }
        />
        <div>
          <p className="font-medium text-slate-800">{statusConfig.label}</p>
          <p className="text-sm text-slate-600">
            {exam.status === "upcoming" && "This exam is scheduled for the future"}
            {exam.status === "ongoing" && "This exam is currently in progress"}
            {exam.status === "completed" && "This exam has been completed"}
            {exam.status === "cancelled" && "This exam has been cancelled"}
          </p>
        </div>
      </div>

      {/* Exam Info Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2">
              <Calendar size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Start Date</p>
              <p className="text-sm font-semibold text-slate-800">
                {format(parseISO(exam.start_date), "MMM d, yyyy")}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-50 p-2">
              <Calendar size={18} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">End Date</p>
              <p className="text-sm font-semibold text-slate-800">
                {format(parseISO(exam.end_date), "MMM d, yyyy")}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2">
              <BookOpen size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Subjects</p>
              <p className="text-sm font-semibold text-slate-800">
                {exam.exam_subjects?.length || 0} subjects
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-50 p-2">
              <Clock size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Duration</p>
              <p className="text-sm font-semibold text-slate-800">
                {Math.ceil(
                  (new Date(exam.end_date).getTime() -
                    new Date(exam.start_date).getTime()) /
                    (1000 * 60 * 60 * 24)
                ) + 1}{" "}
                days
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {exam.description && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">Description</h3>
          <p className="text-sm leading-relaxed text-slate-600">{exam.description}</p>
        </div>
      )}

      {/* Subject Schedule */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-800">Subject Schedule</h3>
          <p className="mt-1 text-sm text-slate-500">
            Detailed schedule for each subject in this exam
          </p>
        </div>

        {exam.exam_subjects && exam.exam_subjects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Subject
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Total Marks
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Passing Marks
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Room
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Invigilator
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exam.exam_subjects.map((es) => (
                  <tr key={es.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                          <BookOpen size={14} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {es.subjects?.name || "Unknown"}
                          </p>
                          {es.subjects?.code && (
                            <p className="text-xs text-slate-500">{es.subjects.code}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Calendar size={14} className="text-slate-400" />
                        {format(parseISO(es.exam_date), "MMM d, yyyy")}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Clock size={14} className="text-slate-400" />
                        {es.start_time && es.end_time
                          ? `${es.start_time} - ${es.end_time}`
                          : "Not set"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-slate-700">
                        {es.total_marks}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-600">{es.passing_marks}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <MapPin size={14} className="text-slate-400" />
                        {es.room_number || "Not assigned"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <User size={14} className="text-slate-400" />
                        {es.invigilator
                          ? es.invigilator.full_name || "Unknown"
                          : "Not assigned"}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <BookOpen size={32} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm text-slate-500">
              No subjects have been added to this exam yet.
            </p>
            <button
              onClick={onManageSubjects}
              className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Add Subjects →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
