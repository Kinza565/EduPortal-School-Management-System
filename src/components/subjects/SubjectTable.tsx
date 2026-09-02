"use client";

import { Eye, Edit, MoreVertical, Power, PowerOff } from "lucide-react";
import { useState } from "react";

interface Subject {
  id: string;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  classes_count?: number;
  teachers_count?: number;
}

interface SubjectTableProps {
  subjects: Subject[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDeactivate: (id: string) => void;
  onActivate: (id: string) => void;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function SubjectTable({ subjects, onView, onEdit, onDeactivate, onActivate }: SubjectTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  if (subjects.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <Eye className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700">No subjects found</h3>
        <p className="mt-1 text-sm text-slate-500">
          Try adjusting your search or filters, or add a new subject.
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
                <th className="px-6 py-4 text-left font-medium text-slate-500">Subject</th>
                <th className="px-6 py-4 text-left font-medium text-slate-500">Code</th>
                <th className="px-6 py-4 text-left font-medium text-slate-500">Classes</th>
                <th className="px-6 py-4 text-left font-medium text-slate-500">Teachers</th>
                <th className="px-6 py-4 text-left font-medium text-slate-500">Status</th>
                <th className="px-6 py-4 text-left font-medium text-slate-500">Created</th>
                <th className="px-6 py-4 text-right font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject) => (
                <tr
                  key={subject.id}
                  className="border-b border-slate-100 transition-colors hover:bg-slate-50/50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-sm font-semibold text-purple-700">
                        {subject.name?.charAt(0) || "S"}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{subject.name}</p>
                        {subject.description && (
                          <p className="max-w-xs truncate text-xs text-slate-400">{subject.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600">
                      {subject.code}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {subject.classes_count !== undefined && subject.classes_count > 0
                      ? `${subject.classes_count} class${subject.classes_count !== 1 ? "es" : ""}`
                      : "—"}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {subject.teachers_count !== undefined && subject.teachers_count > 0
                      ? `${subject.teachers_count} teacher${subject.teachers_count !== 1 ? "s" : ""}`
                      : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        subject.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {subject.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {formatDate(subject.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onView(subject.id)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-blue-600"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => onEdit(subject.id)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-amber-600"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => subject.is_active ? onDeactivate(subject.id) : onActivate(subject.id)}
                        className={`rounded-lg p-2 transition-colors ${
                          subject.is_active
                            ? "text-slate-400 hover:bg-red-50 hover:text-red-600"
                            : "text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                        }`}
                        title={subject.is_active ? "Deactivate" : "Activate"}
                      >
                        {subject.is_active ? <PowerOff size={16} /> : <Power size={16} />}
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
          {subjects.map((subject) => (
            <div key={subject.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-sm font-semibold text-purple-700">
                    {subject.name?.charAt(0) || "S"}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{subject.name}</p>
                    <p className="text-xs text-slate-500">{subject.code}</p>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === subject.id ? null : subject.id)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {openMenuId === subject.id && (
                    <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                      <button
                        onClick={() => { onView(subject.id); setOpenMenuId(null); }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                      >
                        <Eye size={14} /> View
                      </button>
                      <button
                        onClick={() => { onEdit(subject.id); setOpenMenuId(null); }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                      >
                        <Edit size={14} /> Edit
                      </button>
                      <button
                        onClick={() => {
                          if (subject.is_active) {
                            onDeactivate(subject.id);
                          } else {
                            onActivate(subject.id);
                          }
                          setOpenMenuId(null);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                      >
                        {subject.is_active ? (
                          <><PowerOff size={14} /> Deactivate</>
                        ) : (
                          <><Power size={14} /> Activate</>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                {subject.classes_count !== undefined && subject.classes_count > 0 && (
                  <span>{subject.classes_count} classes</span>
                )}
                {subject.teachers_count !== undefined && subject.teachers_count > 0 && (
                  <span>{subject.teachers_count} teachers</span>
                )}
                <span
                  className={`rounded-full px-2 py-0.5 font-medium ${
                    subject.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                  }`}
                >
                  {subject.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
