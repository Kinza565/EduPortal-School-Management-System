"use client";

import { Eye, Edit, MoreVertical } from "lucide-react";
import { useState } from "react";

interface ClassItem {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  sections_count?: number;
  students_count?: number;
  teachers_count?: number;
}

interface ClassTableProps {
  classes: ClassItem[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ClassTable({ classes, onView, onEdit, onToggleStatus }: ClassTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  if (classes.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <Eye className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700">No classes found</h3>
        <p className="mt-1 text-sm text-slate-500">
          Try adjusting your search or filters, or add a new class.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Desktop Table */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-left font-medium text-slate-500">Class Name</th>
                <th className="px-6 py-4 text-left font-medium text-slate-500">Description</th>
                <th className="px-6 py-4 text-left font-medium text-slate-500">Sections</th>
                <th className="px-6 py-4 text-left font-medium text-slate-500">Students</th>
                <th className="px-6 py-4 text-left font-medium text-slate-500">Status</th>
                <th className="px-6 py-4 text-left font-medium text-slate-500">Created</th>
                <th className="px-6 py-4 text-right font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((cls) => (
                <tr
                  key={cls.id}
                  className="border-b border-slate-100 transition-colors hover:bg-slate-50/50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-sm font-semibold text-blue-700">
                        {cls.name?.charAt(0) || "C"}
                      </div>
                      <span className="font-medium text-slate-800">{cls.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {cls.description ? (
                      <span className="line-clamp-1 max-w-[200px]">{cls.description}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {cls.sections_count !== undefined ? cls.sections_count : "—"}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {cls.students_count !== undefined ? cls.students_count : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        cls.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {cls.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{formatDate(cls.created_at)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onView(cls.id)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-blue-600"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => onEdit(cls.id)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-amber-600"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => onToggleStatus(cls.id)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                          cls.is_active
                            ? "text-red-600 hover:bg-red-50"
                            : "text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        {cls.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden">
        <div className="divide-y divide-slate-100">
          {classes.map((cls) => (
            <div key={cls.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-sm font-semibold text-blue-700">
                    {cls.name?.charAt(0) || "C"}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{cls.name}</p>
                    {cls.description && (
                      <p className="text-xs text-slate-500 line-clamp-1">{cls.description}</p>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === cls.id ? null : cls.id)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {openMenuId === cls.id && (
                    <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                      <button
                        onClick={() => { onView(cls.id); setOpenMenuId(null); }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                      >
                        <Eye size={14} /> View
                      </button>
                      <button
                        onClick={() => { onEdit(cls.id); setOpenMenuId(null); }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                      >
                        <Edit size={14} /> Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                <span>{cls.sections_count || 0} sections</span>
                <span>{cls.students_count || 0} students</span>
                <span
                  className={`rounded-full px-2 py-0.5 font-medium ${
                    cls.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                  }`}
                >
                  {cls.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
