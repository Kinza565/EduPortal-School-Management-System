"use client";

import { Eye, Edit, MoreVertical } from "lucide-react";
import { useState } from "react";

interface Section {
  id: string;
  name: string;
  class_name: string;
  capacity: number;
  student_count: number;
  available_seats: number;
  is_active: boolean;
  created_at: string;
  is_over_capacity: boolean;
}

interface SectionTableProps {
  sections: Section[];
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

export function SectionTable({ sections, onView, onEdit, onToggleStatus }: SectionTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  if (sections.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <Eye className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700">No sections found</h3>
        <p className="mt-1 text-sm text-slate-500">
          Try adjusting your search or filters, or add a new section.
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
                <th className="px-6 py-4 text-left font-medium text-slate-500">Section</th>
                <th className="px-6 py-4 text-left font-medium text-slate-500">Class</th>
                <th className="px-6 py-4 text-left font-medium text-slate-500">Capacity</th>
                <th className="px-6 py-4 text-left font-medium text-slate-500">Students</th>
                <th className="px-6 py-4 text-left font-medium text-slate-500">Available</th>
                <th className="px-6 py-4 text-left font-medium text-slate-500">Status</th>
                <th className="px-6 py-4 text-left font-medium text-slate-500">Created</th>
                <th className="px-6 py-4 text-right font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sections.map((section) => (
                <tr
                  key={section.id}
                  className="border-b border-slate-100 transition-colors hover:bg-slate-50/50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-sm font-semibold text-purple-700">
                        {section.name?.charAt(0) || "S"}
                      </div>
                      <span className="font-medium text-slate-800">Section {section.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{section.class_name}</td>
                  <td className="px-6 py-4 text-slate-600">{section.capacity}</td>
                  <td className="px-6 py-4">
                    <span className={section.is_over_capacity ? "font-medium text-red-600" : "text-slate-600"}>
                      {section.student_count}
                    </span>
                    {section.is_over_capacity && (
                      <span className="ml-1 text-xs text-red-600">(Over)</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={section.available_seats <= 0 ? "font-medium text-amber-600" : "text-slate-600"}>
                      {section.available_seats}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        section.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {section.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{formatDate(section.created_at)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onView(section.id)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-blue-600"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => onEdit(section.id)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-amber-600"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => onToggleStatus(section.id)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                          section.is_active
                            ? "text-red-600 hover:bg-red-50"
                            : "text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        {section.is_active ? "Deactivate" : "Activate"}
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
          {sections.map((section) => (
            <div key={section.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-sm font-semibold text-purple-700">
                    {section.name?.charAt(0) || "S"}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Section {section.name}</p>
                    <p className="text-xs text-slate-500">{section.class_name}</p>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === section.id ? null : section.id)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {openMenuId === section.id && (
                    <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                      <button
                        onClick={() => { onView(section.id); setOpenMenuId(null); }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                      >
                        <Eye size={14} /> View
                      </button>
                      <button
                        onClick={() => { onEdit(section.id); setOpenMenuId(null); }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                      >
                        <Edit size={14} /> Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                <span>{section.student_count}/{section.capacity} students</span>
                <span>{section.available_seats} seats</span>
                <span
                  className={`rounded-full px-2 py-0.5 font-medium ${
                    section.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                  }`}
                >
                  {section.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
