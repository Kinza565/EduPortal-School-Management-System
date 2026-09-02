"use client";

import { format, parseISO } from "date-fns";
import { Eye, Edit, BookOpen, Calendar, Clock } from "lucide-react";
import type { ExamWithDetails } from "@/types/database";

interface ExamTableProps {
  exams: ExamWithDetails[];
  onView: (exam: ExamWithDetails) => void;
  onEdit: (exam: ExamWithDetails) => void;
  onManageSubjects: (exam: ExamWithDetails) => void;
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

function getStatusColor(status: string): string {
  switch (status) {
    case "upcoming":
      return "bg-purple-50 text-purple-700 ring-purple-600/20";
    case "ongoing":
      return "bg-amber-50 text-amber-700 ring-amber-600/20";
    case "completed":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
    case "cancelled":
      return "bg-red-50 text-red-700 ring-red-600/20";
    default:
      return "bg-slate-50 text-slate-700 ring-slate-600/20";
  }
}

export function ExamTable({ exams, onView, onEdit, onManageSubjects }: ExamTableProps) {
  if (exams.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <Calendar size={28} className="text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700">No exams found</h3>
        <p className="mt-1 text-sm text-slate-500">
          Create your first exam to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Exam Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Class
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Section
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Start Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                End Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Subjects
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {exams.map((exam) => (
              <tr
                key={exam.id}
                className="transition-colors hover:bg-slate-50/50"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                      <Calendar size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{exam.name}</p>
                      {exam.description && (
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {exam.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-slate-600">
                    {formatExamType(exam.exam_type)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-slate-600">
                    {exam.classes?.name || "N/A"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-slate-600">
                    {exam.sections?.name || "All"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Clock size={14} className="text-slate-400" />
                    {format(parseISO(exam.start_date), "MMM d, yyyy")}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Clock size={14} className="text-slate-400" />
                    {format(parseISO(exam.end_date), "MMM d, yyyy")}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <BookOpen size={14} className="text-slate-400" />
                    <span className="text-sm text-slate-600">
                      {exam.exam_subjects?.length || 0} subjects
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${getStatusColor(
                      exam.status
                    )}`}
                  >
                    {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onView(exam)}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => onEdit(exam)}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600"
                      title="Edit Exam"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => onManageSubjects(exam)}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-purple-50 hover:text-purple-600"
                      title="Manage Subjects"
                    >
                      <BookOpen size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
