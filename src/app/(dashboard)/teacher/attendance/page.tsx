"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loader2, CalendarCheck, CheckCircle2, XCircle, Clock, FileQuestion } from "lucide-react";
import type { AttendanceStatus } from "@/types/database";

interface Assignment {
  class_id: string;
  class_name: string;
  section_id: string;
  section_name: string;
}

interface StudentAttendance {
  student_id: string;
  student_name: string;
  roll_number: string | null;
  status: AttendanceStatus;
  remarks: string;
}

export default function AttendancePage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [students, setStudents] = useState<StudentAttendance[]>([]);

  useEffect(() => {
    if (!profile?.id) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const teacherId = profile.id;

        const { data: teacherAssignments } = await supabase
          .from("teacher_assignments")
          .select("class_id, section_id")
          .eq("teacher_id", teacherId);

        const classIds = [...new Set(teacherAssignments?.map((a) => a.class_id) || [])];
        const sectionIds = [...new Set(teacherAssignments?.map((a) => a.section_id) || [])];

        const [classesRes, sectionsRes] = await Promise.all([
          supabase.from("classes").select("id, name").in("id", classIds),
          supabase.from("sections").select("id, name").in("id", sectionIds),
        ]);

        const classMap = new Map(classesRes.data?.map((c) => [c.id, c.name]) || []);
        const sectionMap = new Map(sectionsRes.data?.map((s) => [s.id, s.name]) || []);

        if (!cancelled && teacherAssignments) {
          const uniqueAssignments = teacherAssignments.reduce((acc, a) => {
            const key = `${a.class_id}-${a.section_id}`;
            if (!acc.find((x) => `${x.class_id}-${x.section_id}` === key)) {
              acc.push({
                class_id: a.class_id,
                class_name: classMap.get(a.class_id) || "Unknown",
                section_id: a.section_id,
                section_name: sectionMap.get(a.section_id) || "Unknown",
              });
            }
            return acc;
          }, [] as Assignment[]);
          setAssignments(uniqueAssignments);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load assignments");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profile?.id]);

  useEffect(() => {
    if (!selectedClass || !selectedSection || !selectedDate || !profile?.school_id) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        const { data: studentsData } = await supabase
          .from("students")
          .select("id, full_name, roll_number")
          .eq("class_id", selectedClass)
          .eq("section_id", selectedSection)
          .eq("status", "active")
          .eq("school_id", profile.school_id)
          .order("roll_number");

        const { data: attendanceData } = await supabase
          .from("attendance_records")
          .select("student_id, status, remarks")
          .eq("class_id", selectedClass)
          .eq("section_id", selectedSection)
          .eq("attendance_date", selectedDate)
          .eq("school_id", profile.school_id);

        const attendanceMap: Record<string, { status: AttendanceStatus; remarks: string }> = {};
        attendanceData?.forEach((a) => {
          attendanceMap[a.student_id] = { status: a.status, remarks: a.remarks || "" };
        });

        if (!cancelled) {
          setStudents(
            (studentsData || []).map((s) => ({
              student_id: s.id,
              student_name: s.full_name,
              roll_number: s.roll_number,
              status: attendanceMap[s.id]?.status || "present",
              remarks: attendanceMap[s.id]?.remarks || "",
            }))
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load students");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedClass, selectedSection, selectedDate, profile?.school_id]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStudents((prev) =>
      prev.map((s) => (s.student_id === studentId ? { ...s, status } : s))
    );
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.student_id === studentId ? { ...s, remarks } : s))
    );
  };

  const markAllPresent = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, status: "present" as AttendanceStatus })));
  };

  const handleSave = async () => {
    if (!profile?.id || !profile?.school_id) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();

      const records = students.map((s) => ({
        school_id: profile.school_id,
        student_id: s.student_id,
        class_id: selectedClass,
        section_id: selectedSection,
        attendance_date: selectedDate,
        status: s.status,
        marked_by: profile.id,
        remarks: s.remarks || null,
      }));

      const { error: upsertError } = await supabase
        .from("attendance_records")
        .upsert(records, {
          onConflict: "school_id,student_id,attendance_date",
        });

      if (upsertError) throw upsertError;

      setSuccess("Attendance saved successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const filteredSections = useMemo(() => {
    return assignments.filter((a) => a.class_id === selectedClass);
  }, [assignments, selectedClass]);

  const statusCounts = useMemo(() => {
    return {
      present: students.filter((s) => s.status === "present").length,
      absent: students.filter((s) => s.status === "absent").length,
      late: students.filter((s) => s.status === "late").length,
      excused: students.filter((s) => s.status === "excused").length,
    };
  }, [students]);

  const StatusButton = ({
    studentId,
    status,
    icon: Icon,
    label,
    color,
  }: {
    studentId: string;
    status: AttendanceStatus;
    icon: React.ElementType;
    label: string;
    color: string;
  }) => (
    <button
      type="button"
      onClick={() => handleStatusChange(studentId, status)}
      className={`rounded-lg p-2 transition-all ${
        students.find((s) => s.student_id === studentId)?.status === status
          ? color
          : "bg-slate-100 text-slate-400 hover:bg-slate-200"
      }`}
      title={label}
    >
      <Icon size={16} />
    </button>
  );

  return (
    <DashboardLayout allowedRoles={["teacher"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mark Attendance</h1>
          <p className="mt-1 text-sm text-slate-500">
            Mark attendance for your assigned classes and sections.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {/* Selection Controls */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedSection("");
                }}
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select Class</option>
                {[...new Map(assignments.map((a) => [a.class_id, a])).values()].map((a) => (
                  <option key={a.class_id} value={a.class_id}>
                    {a.class_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Section</label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                disabled={!selectedClass}
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select Section</option>
                {filteredSections.map((a) => (
                  <option key={a.section_id} value={a.section_id}>
                    {a.section_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <span className="ml-3 text-slate-600">Loading...</span>
          </div>
        ) : selectedClass && selectedSection ? (
          <>
            {/* Summary & Actions */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700">Present: {statusCounts.present}</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-1.5">
                  <XCircle size={16} className="text-red-600" />
                  <span className="text-sm font-medium text-red-700">Absent: {statusCounts.absent}</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5">
                  <Clock size={16} className="text-amber-600" />
                  <span className="text-sm font-medium text-amber-700">Late: {statusCounts.late}</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5">
                  <FileQuestion size={16} className="text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Excused: {statusCounts.excused}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={markAllPresent}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  Mark All Present
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || students.length === 0}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Attendance"}
                </button>
              </div>
            </div>

            {/* Students List */}
            {students.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <CalendarCheck size={48} className="mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-700">No Students Found</h3>
                <p className="mt-1 text-sm text-slate-500">
                  No active students found in this class and section.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Roll No.
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Student Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Remarks
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students.map((student) => (
                        <tr key={student.student_id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {student.roll_number || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-800">
                            {student.student_name}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <StatusButton
                                studentId={student.student_id}
                                status="present"
                                icon={CheckCircle2}
                                label="Present"
                                color="bg-emerald-100 text-emerald-700"
                              />
                              <StatusButton
                                studentId={student.student_id}
                                status="absent"
                                icon={XCircle}
                                label="Absent"
                                color="bg-red-100 text-red-700"
                              />
                              <StatusButton
                                studentId={student.student_id}
                                status="late"
                                icon={Clock}
                                label="Late"
                                color="bg-amber-100 text-amber-700"
                              />
                              <StatusButton
                                studentId={student.student_id}
                                status="excused"
                                icon={FileQuestion}
                                label="Excused"
                                color="bg-blue-100 text-blue-700"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={student.remarks}
                              onChange={(e) => handleRemarksChange(student.student_id, e.target.value)}
                              placeholder="Add remark..."
                              className="h-8 w-full max-w-[200px] rounded border border-slate-200 px-2 text-sm focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-100"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          !loading && (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <CalendarCheck size={48} className="mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-semibold text-slate-700">Select Class and Section</h3>
              <p className="mt-1 text-sm text-slate-500">
                Please select a class, section, and date to mark attendance.
              </p>
            </div>
          )
        )}
      </div>
    </DashboardLayout>
  );
}
