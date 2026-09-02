import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  BookOpen,
  Briefcase,
  User,
  ClipboardList,
  Award,
} from "lucide-react";
import type { Profile, TeacherDetail, TeacherAssignment, Class, Section, Subject } from "@/types/database";

async function getTeacherData(supabase: Awaited<ReturnType<typeof createClient>>, teacherId: string, schoolId: string) {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", teacherId)
    .eq("school_id", schoolId)
    .eq("role", "teacher")
    .single();

  if (profileError || !profile) {
    return null;
  }

  const { data: details } = await supabase
    .from("teacher_details")
    .select("*")
    .eq("profile_id", teacherId)
    .single();

  const { data: assignments } = await supabase
    .from("teacher_assignments")
    .select("*, classes(*), sections(*), subjects(*)")
    .eq("teacher_id", teacherId)
    .eq("school_id", schoolId);

  return {
    profile: profile as Profile,
    details: (details || null) as TeacherDetail | null,
    assignments: (assignments || []) as (TeacherAssignment & { classes: Class; sections: Section; subjects: Subject })[],
  };
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function AdminTeacherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: teacherId } = await params;
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

  const data = await getTeacherData(supabase, teacherId, profile.school_id);

  if (!data) {
    notFound();
  }

  const { profile: teacherProfile, details, assignments } = data;

  const uniqueSubjects = [...new Set(assignments.map((a) => a.subjects?.name).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/teachers"
            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 lg:text-3xl">{teacherProfile.full_name}</h1>
            <p className="text-slate-500">Teacher Profile</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/teachers/${teacherId}/edit`}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            Edit Profile
          </Link>
          <button
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
              teacherProfile.is_active
                ? "bg-red-600 hover:bg-red-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {teacherProfile.is_active ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-700">
            {teacherProfile.full_name?.charAt(0) || "T"}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <h2 className="text-xl font-semibold text-slate-800">{teacherProfile.full_name}</h2>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                  teacherProfile.is_active
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {teacherProfile.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="mt-1 text-slate-500">{teacherProfile.email}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm text-slate-600 sm:justify-start">
              {teacherProfile.phone && (
                <span className="flex items-center gap-1">
                  <Phone size={14} className="text-slate-400" />
                  {teacherProfile.phone}
                </span>
              )}
              {details?.joining_date && (
                <span className="flex items-center gap-1">
                  <Calendar size={14} className="text-slate-400" />
                  Joined {formatDate(details.joining_date)}
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
              <Mail size={16} className="mt-0.5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="text-sm font-medium text-slate-700">{teacherProfile.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone size={16} className="mt-0.5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Phone</p>
                <p className="text-sm font-medium text-slate-700">{teacherProfile.phone || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar size={16} className="mt-0.5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Joined</p>
                <p className="text-sm font-medium text-slate-700">{formatDate(teacherProfile.created_at)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Details */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
            <Briefcase size={18} className="text-amber-600" />
            Professional Details
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Award size={16} className="mt-0.5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Employee ID</p>
                <p className="text-sm font-medium text-slate-700">{details?.employee_id || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar size={16} className="mt-0.5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Joining Date</p>
                <p className="text-sm font-medium text-slate-700">{formatDate(details?.joining_date)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <GraduationCap size={16} className="mt-0.5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Qualification</p>
                <p className="text-sm font-medium text-slate-700">{details?.qualification || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <BookOpen size={16} className="mt-0.5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Specialization</p>
                <p className="text-sm font-medium text-slate-700">{details?.specialization || "—"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subjects */}
      {uniqueSubjects.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
            <BookOpen size={18} className="text-emerald-600" />
            Subjects
          </h3>
          <div className="flex flex-wrap gap-2">
            {uniqueSubjects.map((subject, idx) => (
              <span
                key={idx}
                className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700"
              >
                {subject}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Teaching Assignments */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
          <ClipboardList size={18} className="text-purple-600" />
          Teaching Assignments
        </h3>
        {assignments.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">
            No assignments found for this teacher.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Class</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Section</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Subject</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Role</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => (
                  <tr
                    key={assignment.id}
                    className="border-b border-slate-100 transition-colors hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-700">
                      {assignment.classes?.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {assignment.sections?.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {assignment.subjects?.name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {assignment.is_class_teacher ? (
                        <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                          Class Teacher
                        </span>
                      ) : (
                        <span className="text-slate-500">Subject Teacher</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
