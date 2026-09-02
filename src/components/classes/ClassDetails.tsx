"use client";

import { X, BookOpen, Layers, Users, Calendar, CheckCircle, XCircle } from "lucide-react";

interface ClassDetailsProps {
  classItem: {
    id: string;
    name: string;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    sections?: {
      id: string;
      name: string;
      capacity: number;
      is_active: boolean;
    }[];
    sections_count?: number;
    students_count?: number;
    teachers_count?: number;
  };
  onClose: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function ClassDetails({ classItem, onClose, onEdit, onToggleStatus }: ClassDetailsProps) {
  const sections = classItem.sections || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">Class Details</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Class Header */}
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-50 text-2xl font-bold text-blue-700">
              {classItem.name?.charAt(0) || "C"}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-800">{classItem.name}</h3>
              {classItem.description && (
                <p className="text-sm text-slate-500">{classItem.description}</p>
              )}
              <span
                className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                  classItem.is_active
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {classItem.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-slate-50 p-4 text-center">
              <Layers className="mx-auto mb-1 h-5 w-5 text-purple-600" />
              <p className="text-lg font-bold text-slate-800">{classItem.sections_count || sections.length}</p>
              <p className="text-xs text-slate-500">Sections</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4 text-center">
              <Users className="mx-auto mb-1 h-5 w-5 text-blue-600" />
              <p className="text-lg font-bold text-slate-800">{classItem.students_count || 0}</p>
              <p className="text-xs text-slate-500">Students</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4 text-center">
              <BookOpen className="mx-auto mb-1 h-5 w-5 text-amber-600" />
              <p className="text-lg font-bold text-slate-800">{classItem.teachers_count || 0}</p>
              <p className="text-xs text-slate-500">Teachers</p>
            </div>
          </div>

          {/* Details */}
          <div className="mb-6 space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
              <Calendar size={16} className="text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Created</p>
                <p className="text-sm font-medium text-slate-700">{formatDate(classItem.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
              <Calendar size={16} className="text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Last Updated</p>
                <p className="text-sm font-medium text-slate-700">{formatDate(classItem.updated_at)}</p>
              </div>
            </div>
          </div>

          {/* Sections */}
          {sections.length > 0 && (
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Layers size={16} className="text-purple-600" />
                Sections
              </h4>
              <div className="space-y-2">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-xs font-semibold text-purple-700">
                        {section.name?.charAt(0) || "S"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">Section {section.name}</p>
                        <p className="text-xs text-slate-500">Capacity: {section.capacity}</p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        section.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {section.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
          <button
            onClick={onToggleStatus}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              classItem.is_active
                ? "text-red-600 hover:bg-red-50"
                : "text-emerald-600 hover:bg-emerald-50"
            }`}
          >
            {classItem.is_active ? (
              <>
                <XCircle size={16} />
                Deactivate
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                Activate
              </>
            )}
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
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Edit Class
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
