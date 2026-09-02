"use client";

import { X, User, BookOpen, Briefcase, UserCheck, UserX } from "lucide-react";

interface TeacherDetailsProps {
  teacher: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
    is_active: boolean;
    created_at: string;
    employee_id?: string | null;
    joining_date?: string | null;
    qualification?: string | null;
    specialization?: string | null;
    date_of_birth?: string | null;
    gender?: string | null;
    address?: string | null;
    assignments?: {
      classes: { name: string } | null;
      sections: { name: string } | null;
      subjects: { name: string } | null;
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

export function TeacherDetails({ teacher, onClose, onEdit, onToggleStatus }: TeacherDetailsProps) {
  const assignments = teacher.assignments || [];
  const uniqueSubjects = [...new Set(assignments.map((a) => a.subjects?.name).filter(Boolean))];
  const uniqueClasses = [...new Set(assignments.map((a) => `${a.classes?.name || ""} ${a.sections?.name || ""}`).filter(Boolean))];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">Teacher Details</h2>
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
              {teacher.full_name?.charAt(0) || "T"}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-800">{teacher.full_name}</h3>
              <p className="text-sm text-slate-500">{teacher.email}</p>
              <span
                className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                  teacher.is_active
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {teacher.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="space-y-6">
            {/* Personal Info */}
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <User size={16} className="text-blue-600" />
                Personal Information
              </h4>
              <div className="grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Full Name</p>
                  <p className="text-sm font-medium text-slate-700">{teacher.full_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Gender</p>
                  <p className="text-sm font-medium text-slate-700 capitalize">{teacher.gender || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Date of Birth</p>
                  <p className="text-sm font-medium text-slate-700">{formatDate(teacher.date_of_birth)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Phone</p>
                  <p className="text-sm font-medium text-slate-700">{teacher.phone || "—"}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-500">Address</p>
                  <p className="text-sm font-medium text-slate-700">{teacher.address || "—"}</p>
                </div>
              </div>
            </div>

            {/* Professional Info */}
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Briefcase size={16} className="text-amber-600" />
                Professional Information
              </h4>
              <div className="grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Employee ID</p>
                  <p className="text-sm font-medium text-slate-700">{teacher.employee_id || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Joining Date</p>
                  <p className="text-sm font-medium text-slate-700">{formatDate(teacher.joining_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Qualification</p>
                  <p className="text-sm font-medium text-slate-700">{teacher.qualification || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Specialization</p>
                  <p className="text-sm font-medium text-slate-700">{teacher.specialization || "—"}</p>
                </div>
              </div>
            </div>

            {/* Assignments */}
            {assignments.length > 0 && (
              <div>
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <BookOpen size={16} className="text-emerald-600" />
                  Assignments
                </h4>
                <div className="rounded-lg bg-slate-50 p-4">
                  <div className="mb-3">
                    <p className="text-xs text-slate-500">Subjects</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {uniqueSubjects.map((subject, idx) => (
                        <span
                          key={idx}
                          className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Classes</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {uniqueClasses.map((cls, idx) => (
                        <span
                          key={idx}
                          className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700"
                        >
                          {cls}
                        </span>
                      ))}
                    </div>
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
              teacher.is_active
                ? "text-red-600 hover:bg-red-50"
                : "text-emerald-600 hover:bg-emerald-50"
            }`}
          >
            {teacher.is_active ? (
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
              Edit Teacher
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
