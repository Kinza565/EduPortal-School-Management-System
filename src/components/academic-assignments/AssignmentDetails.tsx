"use client";

import { X, BookOpen, Layers, Users, Calendar, Edit, Trash2, Clock, AlertTriangle, CheckCircle } from "lucide-react";

interface AssignmentDetailsProps {
  assignment: {
    id: string;
    title: string;
    description: string | null;
    subject_name: string;
    subject_code?: string;
    class_name: string;
    section_name: string;
    teacher_name: string;
    assigned_date: string;
    due_date: string;
    status: string;
    computed_status: string;
    created_at: string;
    updated_at?: string;
  };
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function AssignmentDetails({ assignment, onClose, onEdit, onDelete }: AssignmentDetailsProps) {
  const getStatusBadge = () => {
    if (assignment.computed_status === "overdue") {
      return { label: "Overdue", className: "bg-red-50 text-red-700", icon: <AlertTriangle size={16} /> };
    }
    if (assignment.computed_status === "due_today") {
      return { label: "Due Today", className: "bg-amber-50 text-amber-700", icon: <Clock size={16} /> };
    }
    if (assignment.computed_status === "upcoming") {
      return { label: "Upcoming", className: "bg-purple-50 text-purple-700", icon: <Calendar size={16} /> };
    }

    const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      active: { label: "Active", className: "bg-emerald-50 text-emerald-700", icon: <CheckCircle size={16} /> },
      inactive: { label: "Inactive", className: "bg-slate-100 text-slate-600", icon: null },
      completed: { label: "Completed", className: "bg-blue-50 text-blue-700", icon: <CheckCircle size={16} /> },
      cancelled: { label: "Cancelled", className: "bg-red-50 text-red-600", icon: null },
    };
    return statusConfig[assignment.status] || statusConfig.active;
  };

  const statusBadge = getStatusBadge();

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
          {/* Title and Status */}
          <div className="mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-800">{assignment.title}</h3>
                <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge.className}`}>
                  {statusBadge.icon}
                  {statusBadge.label}
                </span>
              </div>
            </div>
            {assignment.description && (
              <p className="mt-3 text-sm text-slate-600">{assignment.description}</p>
            )}
          </div>

          {/* Details Grid */}
          <div className="space-y-6">
            {/* Subject */}
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <BookOpen size={16} className="text-purple-600" />
                Subject
              </h4>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-700">{assignment.subject_name}</p>
                {assignment.subject_code && (
                  <p className="text-xs text-slate-500">{assignment.subject_code}</p>
                )}
              </div>
            </div>

            {/* Class & Section */}
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Layers size={16} className="text-amber-600" />
                Class & Section
              </h4>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-700">
                  {assignment.class_name} - {assignment.section_name}
                </p>
              </div>
            </div>

            {/* Teacher */}
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Users size={16} className="text-emerald-600" />
                Assigned Teacher
              </h4>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-700">{assignment.teacher_name}</p>
              </div>
            </div>

            {/* Dates */}
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Calendar size={16} className="text-blue-600" />
                Timeline
              </h4>
              <div className="grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Assigned Date</p>
                  <p className="text-sm font-medium text-slate-700">{formatDate(assignment.assigned_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Due Date</p>
                  <p className="text-sm font-medium text-slate-700">{formatDate(assignment.due_date)}</p>
                </div>
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
            onClick={onDelete}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <Trash2 size={16} />
            Delete
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
