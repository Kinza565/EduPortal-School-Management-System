"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loader2, AlertCircle, User, Calendar, Award, DollarSign, CalendarCheck } from "lucide-react";

interface StudentDetail {
  id: string;
  full_name: string;
  student_id: string;
  roll_number: string | null;
  father_name: string | null;
  guardian_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
  admission_date: string;
  class_name: string;
  section_name: string;
  status: string;
  photo_url: string | null;
  phone: string | null;
  address: string | null;
}

interface QuickStats {
  attendance_percentage: number;
  total_assignments: number;
  latest_result_percentage: number | null;
  outstanding_fees: number;
}

export default function ChildProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = useAuth();
  const [studentId, setStudentId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [stats, setStats] = useState<QuickStats>({
    attendance_percentage: 0,
    total_assignments: 0,
    latest_result_percentage: null,
    outstanding_fees: 0,
  });

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
        const parentId = profile.id;

        // Verify parent has access to this student
        const { data: parentData } = await supabase
          .from("parents")
          .select("id")
          .eq("profile_id", parentId)
          .single();

        if (!parentData) {
          if (!cancelled) {
            setUnauthorized(true);
            setLoading(false);
          }
          return;
        }

        const { data: parentStudentLink } = await supabase
          .from("parent_student")
          .select("id")
          .eq("parent_id", parentData.id)
          .eq("student_id", studentId)
          .single();

        if (!parentStudentLink) {
          if (!cancelled) {
            setUnauthorized(true);
            setLoading(false);
          }
          return;
        }

        // Get student details
        const { data: studentData } = await supabase
          .from("students")
          .select("*")
          .eq("id", studentId)
          .single();

        if (!studentData) {
          if (!cancelled) {
            setError("Student not found");
            setLoading(false);
          }
          return;
        }

        const [classRes, sectionRes, attendanceRes, assignmentsRes, resultsRes, feesRes] = await Promise.all([
          supabase.from("classes").select("name").eq("id", studentData.class_id).single(),
          supabase.from("sections").select("name").eq("id", studentData.section_id).single(),
          supabase.from("attendance_records").select("status").eq("student_id", studentId).eq("school_id", profile.school_id),
          supabase
            .from("academic_assignments")
            .select("id", { count: "exact", head: true })
            .eq("class_id", studentData.class_id)
            .eq("section_id", studentData.section_id)
            .eq("status", "active")
            .eq("school_id", profile.school_id),
          supabase
            .from("results")
            .select("percentage")
            .eq("student_id", studentId)
            .eq("school_id", profile.school_id)
            .order("created_at", { ascending: false })
            .limit(1),
          supabase
            .from("student_fees")
            .select("amount")
            .eq("student_id", studentId)
            .eq("school_id", profile.school_id)
            .in("status", ["pending", "overdue", "partial"]),
        ]);

        if (cancelled) return;

        const attendance = attendanceRes.data || [];
        const present = attendance.filter((a) => a.status === "present" || a.status === "late").length;
        const total = attendance.length;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

        const outstandingFees = feesRes.data?.reduce((sum, f) => sum + f.amount, 0) || 0;

        setStudent({
          id: studentData.id,
          full_name: studentData.full_name,
          student_id: studentData.student_id,
          roll_number: studentData.roll_number,
          father_name: studentData.father_name,
          guardian_name: studentData.guardian_name,
          date_of_birth: studentData.date_of_birth,
          gender: studentData.gender,
          admission_date: studentData.admission_date,
          class_name: classRes.data?.name || "Unknown",
          section_name: sectionRes.data?.name || "Unknown",
          status: studentData.status,
          photo_url: studentData.photo_url,
          phone: studentData.phone,
          address: studentData.address,
        });

        setStats({
          attendance_percentage: percentage,
          total_assignments: assignmentsRes.count || 0,
          latest_result_percentage: resultsRes.data?.[0]?.percentage || null,
          outstanding_fees: outstandingFees,
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load student profile");
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
      <DashboardLayout allowedRoles={["parent"]}>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle size={32} className="mx-auto mb-3 text-red-500" />
          <h3 className="text-lg font-semibold text-red-700">Access Denied</h3>
          <p className="mt-1 text-sm text-red-600">
            You are not authorized to view this student&apos;s profile.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout allowedRoles={["parent"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Child Profile</h1>
          <p className="mt-1 text-sm text-slate-500">
            View your child&apos;s information and academic summary.
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
            <span className="ml-3 text-slate-600">Loading profile...</span>
          </div>
        ) : student ? (
          <div className="space-y-6">
            {/* Student Info Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                {student.photo_url ? (
                  <img
                    src={student.photo_url}
                    alt={student.full_name}
                    className="h-24 w-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-4xl font-bold text-blue-700">
                    {student.full_name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-2xl font-bold text-slate-800">{student.full_name}</h2>
                  <p className="text-slate-500">Student ID: {student.student_id}</p>
                  {student.roll_number && (
                    <p className="text-slate-500">Roll Number: {student.roll_number}</p>
                  )}
                  <span
                    className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset ${
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

            {/* Quick Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-50 p-2">
                    <CalendarCheck size={20} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Attendance</p>
                    <p className="text-xl font-bold text-slate-800">{stats.attendance_percentage}%</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-amber-50 p-2">
                    <Calendar size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Pending Tasks</p>
                    <p className="text-xl font-bold text-slate-800">{stats.total_assignments}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-indigo-50 p-2">
                    <Award size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Latest Result</p>
                    <p className="text-xl font-bold text-slate-800">
                      {stats.latest_result_percentage !== null ? `${stats.latest_result_percentage}%` : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-rose-50 p-2">
                    <DollarSign size={20} className="text-rose-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Outstanding Fees</p>
                    <p className="text-xl font-bold text-slate-800">${stats.outstanding_fees.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Information */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
                <User size={18} className="text-blue-600" />
                Personal Information
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
                  <p className="text-xs text-slate-500">Father&apos;s Name</p>
                  <p className="text-sm font-medium text-slate-800">{student.father_name || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Guardian Name</p>
                  <p className="text-sm font-medium text-slate-800">{student.guardian_name || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Date of Birth</p>
                  <p className="text-sm font-medium text-slate-800">
                    {student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Gender</p>
                  <p className="text-sm font-medium text-slate-800 capitalize">{student.gender || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Admission Date</p>
                  <p className="text-sm font-medium text-slate-800">
                    {new Date(student.admission_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Class</p>
                  <p className="text-sm font-medium text-slate-800">{student.class_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Section</p>
                  <p className="text-sm font-medium text-slate-800">{student.section_name}</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
