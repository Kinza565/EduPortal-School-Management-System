import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  ArrowLeft,
  Layers,
  BookOpen,
  Users,
  Hash,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import type { Section, Class, Student, TeacherAssignment, Profile, Subject } from "@/types/database";

async function getSectionData(supabase: Awaited<ReturnType<typeof createClient>>, sectionId: string, schoolId: string) {
  const { data: sectionData, error: sectionError } = await supabase
    .from("sections")
    .select("*, classes(*)")
    .eq("id", sectionId)
    .eq("school_id", schoolId)
    .single();

  if (sectionError || !sectionData) {
    return null;
  }

  const { data: students } = await supabase
    .from("students")
    .select("*")
    .eq("section_id", sectionId)
    .eq("status", "active");

  const { data: assignments } = await supabase
    .from("teacher_assignments")
    .select("*, profiles(full_name), subjects(name)")
    .eq("section_id", sectionId)
    .eq("school_id", schoolId);

  return {
    section: sectionData as Section & { classes: Class },
    students: (students || []) as Student[],
    assignments: (assignments || []) as (TeacherAssignment & { profiles: Profile; subjects: Subject })[],
  };
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function AdminSectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: sectionId } = await params;
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

  const data = await getSectionData(supabase, sectionId, profile.school_id);

  if (!data) {
    notFound();
  }

  const { section, students, assignments } = data;
  const studentCount = students.length;
  const availableSeats = section.capacity - studentCount;
  const isOverCapacity = studentCount > section.capacity;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/sections"
            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 lg:text-3xl">Section {section.name}</h1>
            <p className="text-slate-500">{section.classes?.name || "Unknown Class"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/sections/${sectionId}/edit`}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            Edit Section
          </Link>
        </div>
      </div>

      {/* Capacity Warning */}
      {isOverCapacity && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-700">Over Capacity</p>
              <p className="text-xs text-red-600">
                This section has {studentCount} students but capacity is only {section.capacity}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Capacity</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">{section.capacity}</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3">
              <Hash className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Students</p>
              <p className={`mt-1 text-2xl font-bold ${isOverCapacity ? "text-red-600" : "text-slate-800"}`}>
                {studentCount}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3">
              <Users className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Available Seats</p>
              <p className={`mt-1 text-2xl font-bold ${availableSeats < 0 ? "text-red-600" : "text-slate-800"}`}>
                {availableSeats}
              </p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3">
              <Layers className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Status</p>
              <span
                className={`mt-1 inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                  section.is_active
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {section.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <div className={`rounded-xl p-3 ${section.is_active ? "bg-emerald-50" : "bg-red-50"}`}>
              {section.is_active ? (
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
          <BookOpen size={18} className="text-blue-600" />
          Section Information
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
            <BookOpen size={16} className="text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Class</p>
              <p className="text-sm font-medium text-slate-700">{section.classes?.name || "Unknown"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
            <Layers size={16} className="text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Section Name</p>
              <p className="text-sm font-medium text-slate-700">{section.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
            <Calendar size={16} className="text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Created</p>
              <p className="text-sm font-medium text-slate-700">{formatDate(section.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
            <Calendar size={16} className="text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Last Updated</p>
              <p className="text-sm font-medium text-slate-700">{formatDate(section.updated_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Assigned Teachers */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
          <Users size={18} className="text-amber-600" />
          Assigned Teachers
        </h3>
        {assignments.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">
            No teachers assigned to this section yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Teacher</th>
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
                      {assignment.profiles?.full_name || "Unknown"}
                    </td>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
