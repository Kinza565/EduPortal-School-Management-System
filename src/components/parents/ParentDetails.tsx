"use client";

import { X, Phone, Briefcase, Link, UserCheck, UserX, GraduationCap } from "lucide-react";

interface ParentDetailsProps {
  parent: {
    id: string;
    full_name: string;
    relationship: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    occupation: string | null;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
    students: {
      id: string;
      full_name: string;
      student_id: string;
      roll_number: string | null;
      class_name: string | null;
      section_name: string | null;
      status: string;
    }[];
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

export function ParentDetails({ parent, onClose, onEdit, onToggleStatus }: ParentDetailsProps) {
  const students = parent.students || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">Parent Details</h2>
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
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
              {parent.full_name?.charAt(0) || "P"}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-800">{parent.full_name}</h3>
              <p className="text-sm capitalize text-slate-500">{parent.relationship}</p>
              <span
                className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                  parent.is_active
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {parent.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="space-y-6">
            {/* Contact Info */}
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Phone size={16} className="text-emerald-600" />
                Contact Information
              </h4>
              <div className="grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Phone</p>
                  <p className="text-sm font-medium text-slate-700">{parent.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="text-sm font-medium text-slate-700">{parent.email || "—"}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-500">Address</p>
                  <p className="text-sm font-medium text-slate-700">{parent.address || "—"}</p>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            {parent.occupation && (
              <div>
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Briefcase size={16} className="text-amber-600" />
                  Occupation
                </h4>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-700">{parent.occupation}</p>
                </div>
              </div>
            )}

            {/* Linked Students */}
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Link size={16} className="text-purple-600" />
                Linked Students ({students.length})
              </h4>
              {students.length > 0 ? (
                <div className="rounded-lg bg-slate-50">
                  <div className="divide-y divide-slate-100">
                    {students.map((student) => (
                      <div key={student.id} className="flex items-center gap-3 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                          {student.full_name?.charAt(0) || "S"}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{student.full_name}</p>
                          <p className="text-xs text-slate-500">
                            {student.student_id} {student.roll_number && `• Roll #${student.roll_number}`}
                          </p>
                        </div>
                        <div className="text-right">
                          {student.class_name && (
                            <p className="text-xs text-slate-600">
                              {student.class_name} - {student.section_name}
                            </p>
                          )}
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              student.status === "active"
                                ? "bg-emerald-50 text-emerald-700"
                                : student.status === "inactive"
                                ? "bg-red-50 text-red-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {student.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-slate-50 p-4 text-center">
                  <p className="text-sm text-slate-500">No students linked to this parent</p>
                </div>
              )}
            </div>

            {/* Dates */}
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <GraduationCap size={16} className="text-blue-600" />
                Timeline
              </h4>
              <div className="grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Added</p>
                  <p className="text-sm font-medium text-slate-700">{formatDate(parent.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Last Updated</p>
                  <p className="text-sm font-medium text-slate-700">{formatDate(parent.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
          <button
            onClick={onToggleStatus}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              parent.is_active
                ? "text-red-600 hover:bg-red-50"
                : "text-emerald-600 hover:bg-emerald-50"
            }`}
          >
            {parent.is_active ? (
              <>
                <UserX size={16} />
                Deactivate
              </>
            ) : (
              <>
                <UserCheck size={16} />
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
              Edit Parent
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
