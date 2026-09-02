"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loader2, AlertCircle, User, Calendar, Award } from "lucide-react";

interface StudentDetail {
  id: string;
  student_id: string;
  roll_number: string | null;
  full_name: string;
  class_name: string;
  section_name: string;
  status: string;
  father_name: string | null;
  gender: string | null;
  admission_date: string;
  phone: string | null;
  address: string | null;
}

interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  percentage: number;
}

interface ResultSummary {
  total: number;
  average: number;
  pass_rate: number;
}

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = useAuth();
  const [studentId, setStudentId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [attendance, setAttendance] = useState<AttendanceSummary>({ total: 0, present: 0, absent: 0, late: 0, excused: 0, percentage: 0 });
  const [results, setResults] = useState<ResultSummary>({ total: 0, average: 0, pass_rate: 0 });

  useEffect(() => {
    (async () => {
      const { id } = await params;
      setStudentId(id);
    })();
  }, [params]);

  useEffect(() => {
    if (!studentId || !profile?.id) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      setUnauthorized(false);

      try {
        const supabase = createClient();
        const teacherId = profile.id;

        const { data: assignments } = await supabase
          .from("teacher_assignments")
          .select("class_id, section_id")
          .eq("teacher_id", teacherId);

        const classIds = [...new Set(assignments?.map((a) => a.class_id) || [])];
        const sectionIds = [...new Set(assignments?.map((a) => a.section_id) || [])];

        const { data: studentData, error: studentError } = await supabase
          .from("students")
          .select("id, student_id, roll_number, full_name, status, father_name, gender, admission_date, phone, address, class_id, section_id")
          .eq("id", studentId)
          .single();

        if (studentError) throw studentError;

        if (!classIds.includes(studentData.class_id) || !sectionIds.includes(studentData.section_id)) {
          if (!cancelled) {
            setUnauthorized(true);
            setLoading(false);
          }
          return;
        }

        const [classesRes, sectionsRes, attendanceData, resultsData] = await Promise.all([
          supabase.from("classes").select("id, name").eq("id", studentData.class_id).single(),
          supabase.from("sections").select("id, name").eq("id", studentData.section_id).single(),
          supabase.from("attendance_records").select("status").eq("student_id", studentId).eq("school_id", profile.school_id),
          supabase.from("results").select("percentage, status").eq("student_id", studentId).eq("school_id", profile.school_id),
        ]);

        const present = attendanceData.data?.filter((a) => a.status === "present").length || 0;
        const late = attendanceData.data?.filter((a) => a.status === "late").length || 0;
        const absent = attendanceData.data?.filter((a) => a.status === "absent").length || 0;
        const excused = attendanceData.data?.filter((a) => a.status === "excused").length || 0;
        const total = attendanceData.data?.length || 0;
        const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

        const totalResults = resultsData.data?.length || 0;
        const avgPercentage = totalResults > 0 ? Math.round(resultsData.data!.reduce((sum, r) => sum + r.percentage, 0) / totalResults) : 0;
        const passCount = resultsData.data?.filter((r) => r.status === "pass").length || 0;
        const passRate = totalResults > 0 ? Math.round((passCount / totalResults) * 100) : 0;

        if (!cancelled) {
          setStudent({
            id: studentData.id,
            student_id: studentData.student_id,
            roll_number: studentData.roll_number,
            full_name: studentData.full_name,
            class_name: classesRes.data?.name || "Unknown",
            section_name: sectionsRes.data?.name || "Unknown",
            status: studentData.status,
            father_name: studentData.father_name,
            gender: studentData.gender,
            admission_date: studentData.admission_date,
            phone: studentData.phone,
            address: studentData.address,
          });
          setAttendance({ total, present, absent, late, excused, percentage });
          setResults({ total: totalResults, average: avgPercentage, pass_rate: passRate });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load student");
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
  }, [studentId, profile?.id]);

  if (unauthorized) {
    return (
      <DashboardLayout allowedRoles={["teacher"]}>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle size={32} className="mx-auto mb-3 text-red-500" />
          <h3 className="text-lg font-semibold text-red-700">Access Denied</h3>
          <p className="mt-1 text-sm text-red-600">
            You are not authorized to view this student&apos;s details.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout allowedRoles={["teacher"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Student Details</h1>
          <p className="mt-1 text-sm text-slate-500">
            View student information and academic summary.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <span className="ml-3 text-slate-600">Loading student...</span>
          </div>
        ) : student ? (
          <div className="space-y-6">
            {/* Student Info */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
                <User size={18} className="text-blue-600" />
                Student Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-xs text-slate-500">Full Name</p>
                  <p className="text-sm font-medium text-slate-800">{student.full_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Student ID</p>
                  <p className="text-sm font-medium text-slate-800">{student.student_id}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Roll Number</p>
                  <p className="text-sm font-medium text-slate-800">{student.roll_number || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Class</p>
                  <p className="text-sm font-medium text-slate-800">{student.class_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Section</p>
                  <p className="text-sm font-medium text-slate-800">{student.section_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                      student.status === "active"
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                        : "bg-amber-50 text-amber-700 ring-amber-600/20"
                    }`}
                  >
                    {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Attendance Summary */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
                <Calendar size={18} className="text-emerald-600" />
                Attendance Summary
              </h3>
              {attendance.total > 0 ? (
                <div className="grid gap-4 sm:grid-cols-5">
                  <div className="rounded-lg bg-emerald-50 p-4 text-center">
                    <p className="text-xs text-slate-500">Present</p>
                    <p className="mt-1 text-xl font-bold text-emerald-600">{attendance.present}</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-4 text-center">
                    <p className="text-xs text-slate-500">Late</p>
                    <p className="mt-1 text-xl font-bold text-blue-600">{attendance.late}</p>
                  </div>
                  <div className="rounded-lg bg-red-50 p-4 text-center">
                    <p className="text-xs text-slate-500">Absent</p>
                    <p className="mt-1 text-xl font-bold text-red-600">{attendance.absent}</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-4 text-center">
                    <p className="text-xs text-slate-500">Excused</p>
                    <p className="mt-1 text-xl font-bold text-amber-600">{attendance.excused}</p>
                  </div>
                  <div className="rounded-lg bg-purple-50 p-4 text-center">
                    <p className="text-xs text-slate-500">Attendance %</p>
                    <p className="mt-1 text-xl font-bold text-purple-600">{attendance.percentage}%</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No attendance records found.</p>
              )}
            </div>

            {/* Results Summary */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
                <Award size={18} className="text-amber-600" />
                Academic Summary
              </h3>
              {results.total > 0 ? (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg bg-blue-50 p-4 text-center">
                    <p className="text-xs text-slate-500">Total Results</p>
                    <p className="mt-1 text-xl font-bold text-slate-800">{results.total}</p>
                  </div>
                  <div className="rounded-lg bg-purple-50 p-4 text-center">
                    <p className="text-xs text-slate-500">Average</p>
                    <p className="mt-1 text-xl font-bold text-purple-600">{results.average}%</p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-4 text-center">
                    <p className="text-xs text-slate-500">Pass Rate</p>
                    <p className="mt-1 text-xl font-bold text-emerald-600">{results.pass_rate}%</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No results found.</p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
