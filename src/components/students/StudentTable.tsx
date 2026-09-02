"use client";

import { Eye, Edit, MoreVertical, GraduationCap } from "lucide-react";
import { useState } from "react";

interface Student {
  id: string;
  student_id: string;
  full_name: string;
  class_name: string;
  section_name: string;
  roll_number: string | null;
  status: string;
  admission_date: string;
}

interface StudentTableProps {
  students: Student[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  isLoading?: boolean;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
    inactive: "bg-red-50 text-red-700 ring-1 ring-red-600/20",
    graduated: "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20",
  };
  return styles[status] || "bg-slate-50 text-slate-700 ring-1 ring-slate-600/20";
}

export function StudentTable({ students, onView, onEdit, isLoading = false }: StudentTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  if (students.length === 0 && !isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm animate-fade-in">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-indigo-100">
          <GraduationCap className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700">No students found</h3>
        <p className="mt-1 text-sm text-slate-500">
          Try adjusting your search or filters, or add a new student.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      {/* Desktop Table */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-50/50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Student ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Section</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Roll No.</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Admission</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr
                  key={student.id}
                  className="border-b border-slate-100/80 transition-all duration-200 hover:bg-blue-50/30 group"
                  style={{ animationDelay: `${index * 20}ms` }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-sm group-hover:scale-105 transition-transform duration-200">
                        {student.full_name?.charAt(0) || "S"}
                      </div>
                      <button
                        onClick={() => onEdit(student.id)}
                        className="font-medium text-slate-800 hover:text-blue-700 transition-colors duration-200 text-left"
                      >
                        {student.full_name}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-600">{student.student_id}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                      {student.class_name || "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{student.section_name || "—"}</td>
                  <td className="px-6 py-4 text-slate-600">{student.roll_number || "—"}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getStatusBadge(student.status)}`}
                    >
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{formatDate(student.admission_date)}</td>
                   <td className="px-6 py-4">
                     <div className="flex items-center justify-end gap-2">
                       <button
                         onClick={() => onView(student.id)}
                         className="rounded-lg px-3 py-1.5 text-slate-500 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 text-xs font-medium"
                         title="View"
                       >
                         <Eye size={14} className="inline mr-1" />
                         View
                       </button>
                       <button
                         onClick={() => onEdit(student.id)}
                         className="rounded-lg px-3 py-1.5 text-slate-500 transition-all duration-200 hover:bg-amber-50 hover:text-amber-600 text-xs font-medium"
                         title="Edit"
                       >
                         <Edit size={14} className="inline mr-1" />
                         Edit
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
          {students.map((student, index) => (
            <div key={student.id} className="p-4 transition-colors duration-200 hover:bg-slate-50" style={{ animationDelay: `${index * 30}ms` }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-sm">
                    {student.full_name?.charAt(0) || "S"}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{student.full_name}</p>
                    <p className="text-xs text-slate-500">{student.student_id}</p>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === student.id ? null : student.id)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 transition-colors duration-200"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {openMenuId === student.id && (
                    <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-xl border border-slate-200 bg-white py-1 shadow-xl dropdown-enter">
                      <button
                        onClick={() => { onView(student.id); setOpenMenuId(null); }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors duration-200"
                      >
                        <Eye size={14} /> View
                      </button>
                      <button
                        onClick={() => { onEdit(student.id); setOpenMenuId(null); }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors duration-200"
                      >
                        <Edit size={14} /> Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                <span className="rounded-md bg-slate-100 px-2 py-1">{student.class_name || "No class"}</span>
                <span>{student.section_name || "No section"}</span>
                <span
                  className={`rounded-full px-2 py-0.5 font-medium capitalize ${getStatusBadge(student.status)}`}
                >
                  {student.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
