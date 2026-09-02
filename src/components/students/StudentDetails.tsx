"use client";

import { X, User, BookOpen, CheckCircle, XCircle, Mail, Phone, MapPin, Calendar, Hash } from "lucide-react";

interface StudentDetailsProps {
  student: {
    id: string;
    student_id: string;
    roll_number: string | null;
    full_name: string;
    father_name: string | null;
    guardian_name: string | null;
    date_of_birth: string | null;
    gender: string | null;
    phone: string | null;
    address: string | null;
    admission_date: string;
    class_name: string | null;
    section_name: string | null;
    status: string;
    photo_url: string | null;
    created_at: string;
    updated_at: string;
  };
  onClose: () => void;
  onEdit: () => void;
  onStatusChange: () => void;
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
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

export function StudentDetails({ student, onClose, onEdit, onStatusChange }: StudentDetailsProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm modal-backdrop">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl modal-content">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 backdrop-blur-sm px-6 py-4 rounded-t-2xl">
          <h2 className="text-lg font-semibold text-slate-800">Student Details</h2>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-600 hover:scale-105"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Profile Header */}
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-bold text-white shadow-lg shadow-blue-500/30">
              {student.full_name?.charAt(0) || "S"}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-800">{student.full_name}</h3>
              <p className="text-sm text-slate-500">{student.student_id}</p>
              <span
                className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getStatusBadge(student.status)}`}
              >
                {student.status}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Personal Information */}
            <div className="rounded-xl border border-slate-200/80 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-slate-50/50 px-4 py-3 border-b border-slate-100">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <User size={16} className="text-blue-600" />
                  Personal Information
                </h4>
              </div>
              <div className="grid gap-4 p-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-blue-50 p-2">
                    <User size={14} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Full Name</p>
                    <p className="text-sm font-medium text-slate-700">{student.full_name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-purple-50 p-2">
                    <User size={14} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Gender</p>
                    <p className="text-sm font-medium capitalize text-slate-700">{student.gender || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-amber-50 p-2">
                    <Calendar size={14} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Date of Birth</p>
                    <p className="text-sm font-medium text-slate-700">{formatDate(student.date_of_birth)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-emerald-50 p-2">
                    <Phone size={14} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Phone</p>
                    <p className="text-sm font-medium text-slate-700">{student.phone || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-rose-50 p-2">
                    <User size={14} className="text-rose-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Father&apos;s Name</p>
                    <p className="text-sm font-medium text-slate-700">{student.father_name || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-indigo-50 p-2">
                    <User size={14} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Guardian&apos;s Name</p>
                    <p className="text-sm font-medium text-slate-700">{student.guardian_name || "—"}</p>
                  </div>
                </div>
                <div className="sm:col-span-2 flex items-start gap-3">
                  <div className="rounded-lg bg-slate-100 p-2">
                    <MapPin size={14} className="text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Address</p>
                    <p className="text-sm font-medium text-slate-700">{student.address || "—"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="rounded-xl border border-slate-200/80 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-slate-50/50 px-4 py-3 border-b border-slate-100">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <BookOpen size={16} className="text-emerald-600" />
                  Academic Information
                </h4>
              </div>
              <div className="grid gap-4 p-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-blue-50 p-2">
                    <Hash size={14} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Student ID</p>
                    <p className="text-sm font-medium text-slate-700">{student.student_id}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-purple-50 p-2">
                    <Hash size={14} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Roll Number</p>
                    <p className="text-sm font-medium text-slate-700">{student.roll_number || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-amber-50 p-2">
                    <BookOpen size={14} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Class</p>
                    <p className="text-sm font-medium text-slate-700">{student.class_name || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-indigo-50 p-2">
                    <BookOpen size={14} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Section</p>
                    <p className="text-sm font-medium text-slate-700">{student.section_name || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-emerald-50 p-2">
                    <Calendar size={14} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Admission Date</p>
                    <p className="text-sm font-medium text-slate-700">{formatDate(student.admission_date)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-slate-100 p-2">
                    <CheckCircle size={14} className="text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Status</p>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getStatusBadge(student.status)}`}>
                      {student.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/50 rounded-b-2xl">
          <button
            onClick={onStatusChange}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-105 ${
              student.status === "active"
                ? "text-red-600 hover:bg-red-50"
                : "text-emerald-600 hover:bg-emerald-50"
            }`}
          >
            {student.status === "active" ? (
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
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:scale-105"
            >
              Close
            </button>
            <button
              onClick={onEdit}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:shadow-md hover:scale-105"
            >
              Edit Student
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
