"use client";

import { Eye, Edit, MoreVertical, Users, UserCheck, UserX } from "lucide-react";
import { useState } from "react";

interface Parent {
  id: string;
  full_name: string;
  relationship: string;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  student_count: number;
  created_at: string;
}

interface ParentTableProps {
  parents: Parent[];
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

function getRelationshipBadge(relationship: string) {
  const styles: Record<string, string> = {
    father: "bg-blue-50 text-blue-700",
    mother: "bg-pink-50 text-pink-700",
    guardian: "bg-purple-50 text-purple-700",
    other: "bg-slate-100 text-slate-600",
  };
  return styles[relationship] || "bg-slate-100 text-slate-600";
}

export function ParentTable({ parents, onView, onEdit, onToggleStatus }: ParentTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  if (parents.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <Users className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700">No parents found</h3>
        <p className="mt-1 text-sm text-slate-500">
          Try adjusting your search or filters, or add a new parent.
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
                <th className="px-6 py-4 text-left font-medium text-slate-500">Parent</th>
                <th className="px-6 py-4 text-left font-medium text-slate-500">Relationship</th>
                <th className="px-6 py-4 text-left font-medium text-slate-500">Contact</th>
                <th className="px-6 py-4 text-left font-medium text-slate-500">Students</th>
                <th className="px-6 py-4 text-left font-medium text-slate-500">Status</th>
                <th className="px-6 py-4 text-left font-medium text-slate-500">Added</th>
                <th className="px-6 py-4 text-right font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {parents.map((parent) => (
                <tr
                  key={parent.id}
                  className="border-b border-slate-100 transition-colors hover:bg-slate-50/50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                        {parent.full_name?.charAt(0) || "P"}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{parent.full_name}</p>
                        {parent.email && (
                          <p className="text-xs text-slate-400">{parent.email}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getRelationshipBadge(parent.relationship)}`}>
                      {parent.relationship}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {parent.phone || "—"}
                  </td>
                  <td className="px-6 py-4">
                    {parent.student_count > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        <Users size={12} />
                        {parent.student_count}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        parent.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {parent.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {formatDate(parent.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onView(parent.id)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-blue-600"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => onEdit(parent.id)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-amber-600"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => onToggleStatus(parent.id)}
                        className={`rounded-lg p-2 transition-colors ${
                          parent.is_active
                            ? "text-slate-400 hover:bg-red-50 hover:text-red-600"
                            : "text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                        }`}
                        title={parent.is_active ? "Deactivate" : "Activate"}
                      >
                        {parent.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
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
          {parents.map((parent) => (
            <div key={parent.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                    {parent.full_name?.charAt(0) || "P"}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{parent.full_name}</p>
                    <p className="text-xs text-slate-500 capitalize">{parent.relationship}</p>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === parent.id ? null : parent.id)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {openMenuId === parent.id && (
                    <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                      <button
                        onClick={() => { onView(parent.id); setOpenMenuId(null); }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                      >
                        <Eye size={14} /> View
                      </button>
                      <button
                        onClick={() => { onEdit(parent.id); setOpenMenuId(null); }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                      >
                        <Edit size={14} /> Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span>{parent.phone || "No phone"}</span>
                {parent.student_count > 0 && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                    {parent.student_count} students
                  </span>
                )}
                <span
                  className={`rounded-full px-2 py-0.5 font-medium ${
                    parent.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                  }`}
                >
                  {parent.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
