"use client";

import { Eye, Edit, Trash2, MoreVertical, Award, BookOpen } from "lucide-react";
import { useState } from "react";

interface Assignment {
  id: string;
  teacher_name: string;
  subject_name: string;
  subject_code?: string;
  class_name: string;
  section_name: string;
  is_class_teacher: boolean;
  created_at: string;
}

interface TeacherAssignmentTableProps {
  assignments: Assignment[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function TeacherAssignmentTable({
  assignments,
  onView,
  onEdit,
  onRemove,
}: TeacherAssignmentTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  if (assignments.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <BookOpen className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700">No teacher assignments found</h3>
        <p className="mt-1 text-sm text-slate-500">
          Try adjusting your search or filters, or create a new assignment.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Desktop Table */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-left font-medium text-slate-500">Teacher</th>
                <th className="px-6 py-4 text-left font-medium text-slate-500">Subject</th>
                <th className="px-6 py-4 text-left font-medium text-slate-500">Class</th>
                <th className="px-6 py-4 text-left font-medium text-slate-500">Section</th>
                <th className="px-6 py-4 text-left font-medium text-slate-500">Role</th>
                <th className="px-6 py-4 text-left font-medium text-slate-500">Created</th>
                <th className="px-6 py-4 text-right font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment) => (
                <tr
                  key={assignment.id}
                  className="border-b border-slate-100 transition-colors hover:bg-slate-50/50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                        {assignment.teacher_name?.charAt(0) || "T"}
                      </div>
                      <p className="font-medium text-slate-800">{assignment.teacher_name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-800">{assignment.subject_name}</p>
                      {assignment.subject_code && (
                        <p className="text-xs text-slate-400">{assignment.subject_code}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{assignment.class_name}</td>
                  <td className="px-6 py-4 text-slate-600">{assignment.section_name}</td>
                  <td className="px-6 py-4">
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
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {formatDate(assignment.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onView(assignment.id)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-blue-600"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => onEdit(assignment.id)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-amber-600"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => onRemove(assignment.id)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        title="Remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile/Tablet Cards */}
      <div className="lg:hidden">
        <div className="divide-y divide-slate-100">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                    {assignment.teacher_name?.charAt(0) || "T"}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{assignment.teacher_name}</p>
                    <p className="text-xs text-slate-500">{assignment.subject_name}</p>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === assignment.id ? null : assignment.id)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {openMenuId === assignment.id && (
                    <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                      <button
                        onClick={() => { onView(assignment.id); setOpenMenuId(null); }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                      >
                        <Eye size={14} /> View
                      </button>
                      <button
                        onClick={() => { onEdit(assignment.id); setOpenMenuId(null); }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                      >
                        <Edit size={14} /> Edit
                      </button>
                      <button
                        onClick={() => { onRemove(assignment.id); setOpenMenuId(null); }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span>{assignment.class_name} - {assignment.section_name}</span>
                {assignment.is_class_teacher && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-700">
                    <Award size={10} />
                    Class Teacher
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
