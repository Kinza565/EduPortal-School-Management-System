"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loader2, Users, GraduationCap, CalendarCheck, ClipboardList, FileText, Award, DollarSign } from "lucide-react";
import Link from "next/link";

interface Child {
  id: string;
  full_name: string;
  student_id: string;
  roll_number: string | null;
  class_name: string;
  section_name: string;
  status: string;
  photo_url: string | null;
}

export default function MyChildrenPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [children, setChildren] = useState<Child[]>([]);

  useEffect(() => {
    if (!profile?.id) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const parentId = profile.id;

        const { data: parentData } = await supabase
          .from("parents")
          .select("id")
          .eq("profile_id", parentId)
          .single();

        if (!parentData) {
          if (!cancelled) {
            setChildren([]);
            setLoading(false);
          }
          return;
        }

        const { data: parentStudents } = await supabase
          .from("parent_student")
          .select("student_id")
          .eq("parent_id", parentData.id);

        if (!parentStudents || parentStudents.length === 0) {
          if (!cancelled) {
            setChildren([]);
            setLoading(false);
          }
          return;
        }

        const studentIds = parentStudents.map((ps) => ps.student_id);

        const { data: studentsData } = await supabase
          .from("students")
          .select("id, full_name, student_id, roll_number, status, photo_url, class_id, section_id")
          .in("id", studentIds)
          .order("full_name");

        if (cancelled) return;

        const classIds = [...new Set(studentsData?.map((s) => s.class_id) || [])];
        const sectionIds = [...new Set(studentsData?.map((s) => s.section_id) || [])];

        const [classesRes, sectionsRes] = await Promise.all([
          supabase.from("classes").select("id, name").in("id", classIds),
          supabase.from("sections").select("id, name").in("id", sectionIds),
        ]);

        const classMap = new Map(classesRes.data?.map((c) => [c.id, c.name]) || []);
        const sectionMap = new Map(sectionsRes.data?.map((s) => [s.id, s.name]) || []);

        const childrenData: Child[] = studentsData?.map((s) => ({
          id: s.id,
          full_name: s.full_name,
          student_id: s.student_id,
          roll_number: s.roll_number,
          class_name: classMap.get(s.class_id) || "Unknown",
          section_name: sectionMap.get(s.section_id) || "Unknown",
          status: s.status,
          photo_url: s.photo_url,
        })) || [];

        if (!cancelled) {
          setChildren(childrenData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load children");
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

  return (
    <DashboardLayout allowedRoles={["parent"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Children</h1>
          <p className="mt-1 text-sm text-slate-500">
            View your linked children and their academic information.
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
            <span className="ml-3 text-slate-600">Loading children...</span>
          </div>
        ) : children.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <Users size={48} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-700">No Children Linked</h3>
            <p className="mt-1 text-sm text-slate-500">
              No children are currently linked to your account. Please contact the school administration.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {children.map((child) => (
              <div
                key={child.id}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  {child.photo_url ? (
                    <img
                      src={child.photo_url}
                      alt={child.full_name}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
                      {child.full_name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">{child.full_name}</h3>
                    <p className="text-sm text-slate-500">ID: {child.student_id}</p>
                    {child.roll_number && (
                      <p className="text-sm text-slate-500">Roll: {child.roll_number}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4">
                  <div>
                    <p className="text-xs text-slate-500">Class</p>
                    <p className="font-medium text-slate-700">{child.class_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Section</p>
                    <p className="font-medium text-slate-700">{child.section_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Status</p>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        child.status === "active"
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                          : "bg-amber-50 text-amber-700 ring-amber-600/20"
                      }`}
                    >
                      {child.status.charAt(0).toUpperCase() + child.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <Link
                    href={`/parent/children/${child.id}`}
                    className="flex flex-col items-center gap-1 rounded-lg bg-blue-50 p-3 text-blue-700 transition-colors hover:bg-blue-100"
                  >
                    <GraduationCap size={20} />
                    <span className="text-xs font-medium">Profile</span>
                  </Link>
                  <Link
                    href={`/parent/attendance?student=${child.id}`}
                    className="flex flex-col items-center gap-1 rounded-lg bg-emerald-50 p-3 text-emerald-700 transition-colors hover:bg-emerald-100"
                  >
                    <CalendarCheck size={20} />
                    <span className="text-xs font-medium">Attendance</span>
                  </Link>
                  <Link
                    href={`/parent/assignments?student=${child.id}`}
                    className="flex flex-col items-center gap-1 rounded-lg bg-amber-50 p-3 text-amber-700 transition-colors hover:bg-amber-100"
                  >
                    <ClipboardList size={20} />
                    <span className="text-xs font-medium">Assignments</span>
                  </Link>
                  <Link
                    href={`/parent/exams?student=${child.id}`}
                    className="flex flex-col items-center gap-1 rounded-lg bg-purple-50 p-3 text-purple-700 transition-colors hover:bg-purple-100"
                  >
                    <FileText size={20} />
                    <span className="text-xs font-medium">Exams</span>
                  </Link>
                  <Link
                    href={`/parent/results?student=${child.id}`}
                    className="flex flex-col items-center gap-1 rounded-lg bg-indigo-50 p-3 text-indigo-700 transition-colors hover:bg-indigo-100"
                  >
                    <Award size={20} />
                    <span className="text-xs font-medium">Results</span>
                  </Link>
                  <Link
                    href={`/parent/fees?student=${child.id}`}
                    className="flex flex-col items-center gap-1 rounded-lg bg-rose-50 p-3 text-rose-700 transition-colors hover:bg-rose-100"
                  >
                    <DollarSign size={20} />
                    <span className="text-xs font-medium">Fees</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
