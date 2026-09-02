"use client";

import { X, BookOpen, Calendar, Power, PowerOff, Users, Layers, Hash } from "lucide-react";

interface SubjectDetailsProps {
  subject: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
    classes?: { id: string; name: string }[];
    sections?: { id: string; name: string; class_name: string }[];
    teachers?: { id: string; full_name: string }[];
  };
  onClose: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function SubjectDetails({ subject, onClose, onEdit, onToggleStatus }: SubjectDetailsProps) {
  const classes = subject.classes || [];
  const sections = subject.sections || [];
  const teachers = subject.teachers || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">Subject Details</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Profile Header */}
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-2xl font-bold text-purple-700">
              {subject.name?.charAt(0) || "S"}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-800">{subject.name}</h3>
              <p className="text-sm text-slate-500">{subject.code}</p>
              <span
                className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                  subject.is_active
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {subject.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <BookOpen size={16} className="text-purple-600" />
                Subject Information
              </h4>
              <div className="grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Subject Name</p>
                  <p className="text-sm font-medium text-slate-700">{subject.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Subject Code</p>
                  <p className="text-sm font-medium text-slate-700">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs">
                      {subject.code}
                    </span>
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-500">Description</p>
                  <p className="text-sm font-medium text-slate-700">{subject.description || "—"}</p>
                </div>
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
                  <p className="text-xs text-slate-500">Created</p>
                  <p className="text-sm font-medium text-slate-700">{formatDate(subject.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Last Updated</p>
                  <p className="text-sm font-medium text-slate-700">{formatDate(subject.updated_at)}</p>
                </div>
              </div>
            </div>

            {/* Teachers */}
            {teachers.length > 0 && (
              <div>
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Users size={16} className="text-emerald-600" />
                  Assigned Teachers ({teachers.length})
                </h4>
                <div className="rounded-lg bg-slate-50 p-4">
                  <div className="flex flex-wrap gap-2">
                    {teachers.map((teacher) => (
                      <span
                        key={teacher.id}
                        className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                      >
                        {teacher.full_name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Classes */}
            {classes.length > 0 && (
              <div>
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Layers size={16} className="text-amber-600" />
                  Classes ({classes.length})
                </h4>
                <div className="rounded-lg bg-slate-50 p-4">
                  <div className="flex flex-wrap gap-2">
                    {classes.map((cls) => (
                      <span
                        key={cls.id}
                        className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"
                      >
                        {cls.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Sections */}
            {sections.length > 0 && (
              <div>
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Hash size={16} className="text-blue-600" />
                  Sections ({sections.length})
                </h4>
                <div className="rounded-lg bg-slate-50 p-4">
                  <div className="flex flex-wrap gap-2">
                    {sections.map((section) => (
                      <span
                        key={section.id}
                        className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                      >
                        {section.class_name} - {section.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
          <button
            onClick={onToggleStatus}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              subject.is_active
                ? "text-red-600 hover:bg-red-50"
                : "text-emerald-600 hover:bg-emerald-50"
            }`}
          >
            {subject.is_active ? (
              <>
                <PowerOff size={16} />
                Deactivate
              </>
            ) : (
              <>
                <Power size={16} />
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
              Edit Subject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
