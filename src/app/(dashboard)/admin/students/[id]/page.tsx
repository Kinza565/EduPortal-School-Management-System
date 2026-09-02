import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  User,
  Calendar,
  MapPin,
  Phone,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  Hash,
  Users,
} from "lucide-react";
import type { StudentWithClassSection, AttendanceRecord } from "@/types/database";

async function getStudent(supabase: Awaited<ReturnType<typeof createClient>>, studentId: string, schoolId: string) {
  const { data, error } = await supabase
    .from("students")
    .select("*, classes(*), sections(*)")
    .eq("id", studentId)
    .eq("school_id", schoolId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as StudentWithClassSection;
}

async function getAttendanceStats(supabase: Awaited<ReturnType<typeof createClient>>, studentId: string, schoolId: string) {
  const { data, error } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("student_id", studentId)
    .eq("school_id", schoolId);

  if (error || !data) {
    return null;
  }

  const records = data as AttendanceRecord[];
  const present = records.filter((r) => r.status === "present").length;
  const absent = records.filter((r) => r.status === "absent").length;
  const late = records.filter((r) => r.status === "late").length;
  const excused = records.filter((r) => r.status === "excused").length;
  const totalDays = present + absent + late;
  const percentage = totalDays > 0 ? Math.round((present / totalDays) * 100 * 10) / 10 : 0;

  return {
    present,
    absent,
    late,
    excused,
    totalDays,
    percentage,
  };
}

function formatDate(dateString: string | null) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700",
    inactive: "bg-red-50 text-red-700",
    graduated: "bg-blue-50 text-blue-700",
  };
  return styles[status] || "bg-slate-50 text-slate-700";
}

export default async function AdminStudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: studentId } = await params;
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    notFound();
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, school_id")
    .eq("id", session.user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    notFound();
  }

  const student = await getStudent(supabase, studentId, profile.school_id);

  if (!student) {
    notFound();
  }

  const attendanceStats = await getAttendanceStats(supabase, studentId, profile.school_id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/students"
            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 lg:text-3xl">{student.full_name}</h1>
            <p className="text-slate-500">Student Profile</p>
          </div>
        </div>
        <Link
          href={`/admin/students/${student.id}/edit`}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <Edit size={16} />
          Edit Student
        </Link>
      </div>

      {/* Profile Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-700">
            {student.full_name?.charAt(0) || "S"}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <h2 className="text-xl font-semibold text-slate-800">{student.full_name}</h2>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${getStatusBadge(student.status)}`}
              >
                {student.status}
              </span>
            </div>
            <p className="mt-1 text-slate-500">{student.student_id}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm text-slate-600 sm:justify-start">
              {student.classes && (
                <span className="flex items-center gap-1">
                  <BookOpen size={14} className="text-slate-400" />
                  {student.classes.name}
                </span>
              )}
              {student.sections && (
                <span className="flex items-center gap-1">
                  <Users size={14} className="text-slate-400" />
                  Section {student.sections.name}
                </span>
              )}
              {student.roll_number && (
                <span className="flex items-center gap-1">
                  <Hash size={14} className="text-slate-400" />
                  Roll #{student.roll_number}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Information */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
            <User size={18} className="text-blue-600" />
            Personal Information
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <User size={16} className="mt-0.5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Full Name</p>
                <p className="text-sm font-medium text-slate-700">{student.full_name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Hash size={16} className="mt-0.5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Student ID</p>
                <p className="text-sm font-medium text-slate-700">{student.student_id}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User size={16} className="mt-0.5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Father&apos;s Name</p>
                <p className="text-sm font-medium text-slate-700">{student.father_name || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User size={16} className="mt-0.5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Guardian&apos;s Name</p>
                <p className="text-sm font-medium text-slate-700">{student.guardian_name || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar size={16} className="mt-0.5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Date of Birth</p>
                <p className="text-sm font-medium text-slate-700">{formatDate(student.date_of_birth)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User size={16} className="mt-0.5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Gender</p>
                <p className="text-sm font-medium capitalize text-slate-700">{student.gender || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone size={16} className="mt-0.5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Phone</p>
                <p className="text-sm font-medium text-slate-700">{student.phone || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={16} className="mt-0.5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Address</p>
                <p className="text-sm font-medium text-slate-700">{student.address || "—"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
              <GraduationCap size={18} className="text-emerald-600" />
              Academic Information
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <BookOpen size={16} className="mt-0.5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Class</p>
                  <p className="text-sm font-medium text-slate-700">{student.classes?.name || "Not assigned"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users size={16} className="mt-0.5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Section</p>
                  <p className="text-sm font-medium text-slate-700">{student.sections?.name || "Not assigned"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Hash size={16} className="mt-0.5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Roll Number</p>
                  <p className="text-sm font-medium text-slate-700">{student.roll_number || "Not assigned"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar size={16} className="mt-0.5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Admission Date</p>
                  <p className="text-sm font-medium text-slate-700">{formatDate(student.admission_date)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Summary */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
              <CalendarCheck size={18} className="text-purple-600" />
              Attendance Summary
            </h3>
            {attendanceStats && attendanceStats.totalDays > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg bg-emerald-50 p-3 text-center">
                    <p className="text-xs text-emerald-600">Present</p>
                    <p className="text-lg font-bold text-emerald-700">{attendanceStats.present}</p>
                  </div>
                  <div className="rounded-lg bg-red-50 p-3 text-center">
                    <p className="text-xs text-red-600">Absent</p>
                    <p className="text-lg font-bold text-red-700">{attendanceStats.absent}</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-3 text-center">
                    <p className="text-xs text-amber-600">Late</p>
                    <p className="text-lg font-bold text-amber-700">{attendanceStats.late}</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-3 text-center">
                    <p className="text-xs text-blue-600">Excused</p>
                    <p className="text-lg font-bold text-blue-700">{attendanceStats.excused}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Attendance Rate</p>
                    <p className="text-xs text-slate-500">Present / (Present + Absent + Late) x 100</p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-4 py-2 text-lg font-bold ${
                      attendanceStats.percentage >= 75
                        ? "bg-emerald-50 text-emerald-700"
                        : attendanceStats.percentage >= 50
                        ? "bg-amber-50 text-amber-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {attendanceStats.percentage}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-slate-400">
                No attendance records found for this student.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
