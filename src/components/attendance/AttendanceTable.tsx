"use client";

import { Check, X, Clock, AlertCircle } from "lucide-react";

type AttendanceStatus = "present" | "absent" | "late" | "excused";

interface StudentAttendance {
  student_id: string;
  student_name: string;
  student_code: string;
  roll_number: string | null;
  status: AttendanceStatus | null;
  remarks: string | null;
}

interface AttendanceStatusSelectorProps {
  student: StudentAttendance;
  onStatusChange: (studentId: string, status: AttendanceStatus) => void;
  disabled?: boolean;
}

const statusConfig: Record<AttendanceStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  present: {
    label: "Present",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
    icon: <Check size={16} />,
  },
  absent: {
    label: "Absent",
    color: "text-red-700",
    bgColor: "bg-red-50 border-red-200 hover:bg-red-100",
    icon: <X size={16} />,
  },
  late: {
    label: "Late",
    color: "text-amber-700",
    bgColor: "bg-amber-50 border-amber-200 hover:bg-amber-100",
    icon: <Clock size={16} />,
  },
  excused: {
    label: "Excused",
    color: "text-blue-700",
    bgColor: "bg-blue-50 border-blue-200 hover:bg-blue-100",
    icon: <AlertCircle size={16} />,
  },
};

export function AttendanceStatusSelector({ student, onStatusChange, disabled = false }: AttendanceStatusSelectorProps) {
  const currentStatus = student.status;

  return (
    <div className="flex items-center gap-2">
      {(Object.keys(statusConfig) as AttendanceStatus[]).map((status) => {
        const config = statusConfig[status];
        const isSelected = currentStatus === status;

        return (
          <button
            key={status}
            type="button"
            onClick={() => onStatusChange(student.student_id, status)}
            disabled={disabled}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
              isSelected
                ? `${config.bgColor} ${config.color} ring-2 ring-offset-1 ${status === "present" ? "ring-emerald-300" : status === "absent" ? "ring-red-300" : status === "late" ? "ring-amber-300" : "ring-blue-300"}`
                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            }`}
            title={config.label}
          >
            {config.icon}
            <span className="hidden sm:inline">{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}

interface AttendanceTableProps {
  students: StudentAttendance[];
  onStatusChange: (studentId: string, status: AttendanceStatus) => void;
  isLoading?: boolean;
}

export function AttendanceTable({ students, onStatusChange, isLoading = false }: AttendanceTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700">Loading students...</h3>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <Check className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700">No students found</h3>
        <p className="mt-1 text-sm text-slate-500">
          Select a class and section to view students, or adjust your filters.
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
                <th className="px-6 py-4 text-left font-medium text-slate-500">Student</th>
                <th className="px-6 py-4 text-left font-medium text-slate-500">Roll No.</th>
                <th className="px-6 py-4 text-left font-medium text-slate-500">Status</th>
                <th className="px-6 py-4 text-left font-medium text-slate-500">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr
                  key={student.student_id}
                  className={`border-b border-slate-100 transition-colors hover:bg-slate-50/50 ${
                    student.status === "present"
                      ? "bg-emerald-50/30"
                      : student.status === "absent"
                      ? "bg-red-50/30"
                      : student.status === "late"
                      ? "bg-amber-50/30"
                      : ""
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                        {student.student_name?.charAt(0) || "S"}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{student.student_name}</p>
                        <p className="text-xs text-slate-400">{student.student_code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600">
                      {student.roll_number || "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <AttendanceStatusSelector
                      student={student}
                      onStatusChange={onStatusChange}
                    />
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {student.remarks || "—"}
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
          {students.map((student) => (
            <div
              key={student.student_id}
              className={`p-4 ${
                student.status === "present"
                  ? "bg-emerald-50/30"
                  : student.status === "absent"
                  ? "bg-red-50/30"
                  : student.status === "late"
                  ? "bg-amber-50/30"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                    {student.student_name?.charAt(0) || "S"}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{student.student_name}</p>
                    <p className="text-xs text-slate-500">
                      {student.roll_number ? `Roll #${student.roll_number}` : student.student_code}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(statusConfig) as AttendanceStatus[]).map((status) => {
                    const config = statusConfig[status];
                    const isSelected = student.status === status;

                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => onStatusChange(student.student_id, status)}
                        className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                          isSelected
                            ? `${config.bgColor} ${config.color}`
                            : "border-slate-200 bg-white text-slate-500"
                        }`}
                      >
                        {config.icon}
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
