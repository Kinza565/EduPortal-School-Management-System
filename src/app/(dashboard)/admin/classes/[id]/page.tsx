import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Layers,
  Users,
  UserCheck,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type { Class, Section, TeacherAssignment, Profile, Subject, Student } from "@/types/database";

async function getClassData(supabase: Awaited<ReturnType<typeof createClient>>, classId: string, schoolId: string) {
  const { data: classData, error: classError } = await supabase
    .from("classes")
    .select("*")
    .eq("id", classId)
    .eq("school_id", schoolId)
    .single();

  if (classError || !classData) {
    return null;
  }

  const { data: sections } = await supabase
    .from("sections")
    .select("*")
    .eq("class_id", classId)
    .order("name");

  const { data: students } = await supabase
    .from("students")
    .select("*")
    .eq("class_id", classId)
    .eq("status", "active");

  const { data: assignments } = await supabase
    .from("teacher_assignments")
    .select("*, profiles(full_name), subjects(name)")
    .eq("class_id", classId);

  return {
    class: classData as Class,
    sections: (sections || []) as Section[],
    students: (students || []) as Student[],
    assignments: (assignments || []) as (TeacherAssignment & { profiles: Profile; subjects: Subject })[],
  };
}

export default async function AdminClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: classId } = await params;
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

  const data = await getClassData(supabase, classId, profile.school_id);

  if (!data) {
    notFound();
  }

  const { class: classInfo, sections, students, assignments } = data;

  const sectionStudentCounts: Record<string, number> = {};
  students.forEach((s) => {
    if (s.section_id) {
      sectionStudentCounts[s.section_id] = (sectionStudentCounts[s.section_id] || 0) + 1;
    }
  });

  const uniqueTeachers = new Set(assignments.map((a) => a.teacher_id)).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/classes"
            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 lg:text-3xl">{classInfo.name}</h1>
            <p className="text-slate-500">Class Details</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/classes/${classId}/edit`}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            Edit Class
          </Link>
          <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700">
            <Plus size={18} />
            Add Section
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Sections</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">{sections.length}</p>
            </div>
            <div className="rounded-xl bg-purple-50 p-3">
              <Layers className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Students</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">{students.length}</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Teachers</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">{uniqueTeachers}</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3">
              <UserCheck className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Status</p>
              <span
                className={`mt-1 inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                  classInfo.is_active
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {classInfo.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <div className={`rounded-xl p-3 ${classInfo.is_active ? "bg-emerald-50" : "bg-red-50"}`}>
              {classInfo.is_active ? (
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {classInfo.description && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-2 text-base font-semibold text-slate-800">Description</h3>
          <p className="text-slate-600">{classInfo.description}</p>
        </div>
      )}

      {/* Sections */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800">
            <Layers size={18} className="text-purple-600" />
            Sections
          </h3>
        </div>
        {sections.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">
            No sections found. Add a section to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Section</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Capacity</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Students</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((section) => {
                  const studentCount = sectionStudentCounts[section.id] || 0;
                  const isFull = studentCount >= section.capacity;
                  return (
                    <tr
                      key={section.id}
                      className="border-b border-slate-100 transition-colors hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 font-medium text-slate-700">{section.name}</td>
                      <td className="px-4 py-3 text-slate-600">{section.capacity}</td>
                      <td className="px-4 py-3">
                        <span className={isFull ? "font-medium text-amber-600" : "text-slate-600"}>
                          {studentCount}
                        </span>
                        {isFull && (
                          <span className="ml-2 text-xs text-amber-600">(Full)</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            section.is_active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {section.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/classes/${classId}/sections/${section.id}/edit`}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assigned Teachers */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
          <UserCheck size={18} className="text-amber-600" />
          Assigned Teachers
        </h3>
        {assignments.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">
            No teachers assigned to this class yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Teacher</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Section</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Subject</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Role</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => {
                  const section = sections.find((s) => s.id === assignment.section_id);
                  return (
                    <tr
                      key={assignment.id}
                      className="border-b border-slate-100 transition-colors hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {assignment.profiles?.full_name || "Unknown"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{section?.name || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{assignment.subjects?.name || "—"}</td>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
