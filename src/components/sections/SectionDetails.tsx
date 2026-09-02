"use client";

import { X, Layers, BookOpen, Users, Hash, Calendar, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface SectionDetailsProps {
  section: {
    id: string;
    name: string;
    class_name: string;
    capacity: number;
    student_count: number;
    available_seats: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    is_over_capacity: boolean;
    teachers?: {
      id: string;
      full_name: string;
      subject?: string;
      is_class_teacher: boolean;
    }[];
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

export function SectionDetails({ section, onClose, onEdit, onToggleStatus }: SectionDetailsProps) {
  const teachers = section.teachers || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">Section Details</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-purple-50 text-2xl font-bold text-purple-700">
              {section.name?.charAt(0) || "S"}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-800">Section {section.name}</h3>
              <p className="text-sm text-slate-500">{section.class_name}</p>
              <span
                className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                  section.is_active
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {section.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {section.is_over_capacity && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-700">Over Capacity</p>
                  <p className="text-xs text-red-600">
                    This section has {section.student_count} students but capacity is only {section.capacity}.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-slate-50 p-4 text-center">
              <Hash className="mx-auto mb-1 h-5 w-5 text-blue-600" />
              <p className="text-lg font-bold text-slate-800">{section.capacity}</p>
              <p className="text-xs text-slate-500">Capacity</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4 text-center">
              <Users className="mx-auto mb-1 h-5 w-5 text-emerald-600" />
              <p className="text-lg font-bold text-slate-800">{section.student_count}</p>
              <p className="text-xs text-slate-500">Students</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4 text-center">
              <Layers className="mx-auto mb-1 h-5 w-5 text-amber-600" />
              <p className={`text-lg font-bold ${section.available_seats < 0 ? "text-red-600" : "text-slate-800"}`}>
                {section.available_seats}
              </p>
              <p className="text-xs text-slate-500">Available</p>
            </div>
          </div>

          <div className="mb-6 space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
              <BookOpen size={16} className="text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Class</p>
                <p className="text-sm font-medium text-slate-700">{section.class_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
              <Calendar size={16} className="text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Created</p>
                <p className="text-sm font-medium text-slate-700">{formatDate(section.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
              <Calendar size={16} className="text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Last Updated</p>
                <p className="text-sm font-medium text-slate-700">{formatDate(section.updated_at)}</p>
              </div>
            </div>
          </div>

          {teachers.length > 0 && (
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Users size={16} className="text-amber-600" />
                Assigned Teachers
              </h4>
              <div className="space-y-2">
                {teachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
                        {teacher.full_name?.charAt(0) || "T"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">{teacher.full_name}</p>
                        {teacher.subject && (
                          <p className="text-xs text-slate-500">{teacher.subject}</p>
                        )}
                      </div>
                    </div>
                    {teacher.is_class_teacher && (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        Class Teacher
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
          <button
            onClick={onToggleStatus}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              section.is_active
                ? "text-red-600 hover:bg-red-50"
                : "text-emerald-600 hover:bg-emerald-50"
            }`}
          >
            {section.is_active ? (
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
              Edit Section
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
