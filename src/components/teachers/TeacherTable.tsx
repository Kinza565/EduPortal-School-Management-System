"use client";

import { Eye, Edit, MoreVertical } from "lucide-react";
import { useState } from "react";

interface Teacher {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  employee_id?: string | null;
  joining_date?: string | null;
  assignments_count?: number;
}

interface TeacherTableProps {
  teachers: Teacher[];
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

export function TeacherTable({ teachers, onView, onEdit, onDeactivate, onActivate }: TeacherTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  if (teachers.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <Eye className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700">No teachers found</h3>
        <p className="mt-1 text-sm text-slate-500">
          Try adjusting your search or filters, or add a new teacher.
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
                <th className="px-6 py-4 text-left font-medium text-slate-500">Teacher</th>
                <th className="px-6 py-4 text-left font-medium text-slate-500">Email</th>
                <th className="px-6 py-4 text-left font-medium text-slate-500">Phone</th>
                <th className="px-6 py-4 text-left font-medium text-slate-500">Subject</th>
                <th className="px-6 py-4 text-left font-medium text-slate-500">Status</th>
                <th className="px-6 py-4 text-left font-medium text-slate-500">Joined</th>
                <th className="px-6 py-4 text-right font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr
                  key={teacher.id}
                  className="border-b border-slate-100 transition-colors hover:bg-slate-50/50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                        {teacher.full_name?.charAt(0) || "T"}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{teacher.full_name}</p>
                        {teacher.employee_id && (
                          <p className="text-xs text-slate-400">{teacher.employee_id}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{teacher.email}</td>
                  <td className="px-6 py-4 text-slate-600">{teacher.phone || "—"}</td>
                  <td className="px-6 py-4 text-slate-600">
                    {teacher.assignments_count !== undefined && teacher.assignments_count > 0
                      ? `${teacher.assignments_count} classes`
                      : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        teacher.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {teacher.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {teacher.joining_date ? formatDate(teacher.joining_date) : formatDate(teacher.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onView(teacher.id)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-blue-600"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => onEdit(teacher.id)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-amber-600"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => teacher.is_active ? onDeactivate(teacher.id) : onActivate(teacher.id)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                          teacher.is_active
                            ? "text-red-600 hover:bg-red-50"
                            : "text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        {teacher.is_active ? "Deactivate" : "Activate"}
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
          {teachers.map((teacher) => (
            <div key={teacher.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                    {teacher.full_name?.charAt(0) || "T"}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{teacher.full_name}</p>
                    <p className="text-xs text-slate-500">{teacher.email}</p>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === teacher.id ? null : teacher.id)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {openMenuId === teacher.id && (
                    <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                      <button
                        onClick={() => { onView(teacher.id); setOpenMenuId(null); }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                      >
                        <Eye size={14} /> View
                      </button>
                      <button
                        onClick={() => { onEdit(teacher.id); setOpenMenuId(null); }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                      >
                        <Edit size={14} /> Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                <span>{teacher.phone || "No phone"}</span>
                <span
                  className={`rounded-full px-2 py-0.5 font-medium ${
                    teacher.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                  }`}
                >
                  {teacher.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
