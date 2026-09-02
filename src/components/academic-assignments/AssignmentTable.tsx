"use client";

import { Eye, Edit, Trash2, MoreVertical, Clock, AlertTriangle, CheckCircle, Calendar } from "lucide-react";
import { useState } from "react";

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  subject_name: string;
  class_name: string;
  section_name: string;
  teacher_name: string;
  assigned_date: string;
  due_date: string;
  status: "active" | "inactive" | "completed" | "cancelled";
  computed_status: "upcoming" | "due_today" | "overdue" | "active";
}

interface AssignmentTableProps {
  assignments: Assignment[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatusBadge(status: string, computedStatus: string) {
  if (computedStatus === "overdue") {
    return { label: "Overdue", className: "bg-red-50 text-red-700", icon: <AlertTriangle size={12} /> };
  }
  if (computedStatus === "due_today") {
    return { label: "Due Today", className: "bg-amber-50 text-amber-700", icon: <Clock size={12} /> };
  }
  if (computedStatus === "upcoming") {
    return { label: "Upcoming", className: "bg-purple-50 text-purple-700", icon: <Calendar size={12} /> };
  }

  const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    active: { label: "Active", className: "bg-emerald-50 text-emerald-700", icon: <CheckCircle size={12} /> },
    inactive: { label: "Inactive", className: "bg-slate-100 text-slate-600", icon: null },
    completed: { label: "Completed", className: "bg-blue-50 text-blue-700", icon: <CheckCircle size={12} /> },
    cancelled: { label: "Cancelled", className: "bg-red-50 text-red-600", icon: null },
  };
  return statusConfig[status] || statusConfig.active;
}

export function AssignmentTable({ assignments, onView, onEdit, onDelete }: AssignmentTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  if (assignments.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <Calendar className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700">No assignments found</h3>
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
                <th className="px-6 py-4 text-left font-medium text-slate-500">Assignment</th>
                <th className="px-6 py-4 text-left font-medium text-slate-500">Subject</th>
                <th className="px-6 py-4 text-left font-medium text-slate-500">Class</th>
                <th className="px-6 py-4 text-left font-medium text-slate-500">Teacher</th>
                <th className="px-6 py-4 text-left font-medium text-slate-500">Due Date</th>
                <th className="px-6 py-4 text-left font-medium text-slate-500">Status</th>
                <th className="px-6 py-4 text-right font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment) => {
                const statusBadge = getStatusBadge(assignment.status, assignment.computed_status);
                return (
                  <tr
                    key={assignment.id}
                    className={`border-b border-slate-100 transition-colors hover:bg-slate-50/50 ${
                      assignment.computed_status === "overdue" ? "bg-red-50/30" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-800">{assignment.title}</p>
                        {assignment.description && (
                          <p className="max-w-xs truncate text-xs text-slate-400">{assignment.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{assignment.subject_name}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {assignment.class_name} - {assignment.section_name}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{assignment.teacher_name}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {formatDate(assignment.due_date)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge.className}`}>
                        {statusBadge.icon}
                        {statusBadge.label}
                      </span>
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
                          onClick={() => onDelete(assignment.id)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile/Tablet Cards */}
      <div className="lg:hidden">
        <div className="divide-y divide-slate-100">
          {assignments.map((assignment) => {
            const statusBadge = getStatusBadge(assignment.status, assignment.computed_status);
            return (
              <div
                key={assignment.id}
                className={`p-4 ${assignment.computed_status === "overdue" ? "bg-red-50/30" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{assignment.title}</p>
                    <p className="text-xs text-slate-500">
                      {assignment.subject_name} • {assignment.class_name} - {assignment.section_name}
                    </p>
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
                          onClick={() => { onDelete(assignment.id); setOpenMenuId(null); }}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>Due: {formatDate(assignment.due_date)}</span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${statusBadge.className}`}>
                    {statusBadge.icon}
                    {statusBadge.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
