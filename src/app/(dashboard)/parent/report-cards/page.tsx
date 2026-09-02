"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loader2, FileText, Eye } from "lucide-react";
import Link from "next/link";

interface Child {
  id: string;
  full_name: string;
  student_id: string;
  class_name: string;
  section_name: string;
  has_results: boolean;
}

export default function ParentReportCardsPage() {
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
          .select("id, full_name, student_id, class_id, section_id")
          .in("id", studentIds)
          .order("full_name");

        if (cancelled) return;

        const classIds = [...new Set(studentsData?.map((s) => s.class_id) || [])];
        const sectionIds = [...new Set(studentsData?.map((s) => s.section_id) || [])];

        const [classesRes, sectionsRes, resultsRes] = await Promise.all([
          supabase.from("classes").select("id, name").in("id", classIds),
          supabase.from("sections").select("id, name").in("id", sectionIds),
          supabase.from("results").select("student_id").in("student_id", studentIds),
        ]);

        const classMap = new Map(classesRes.data?.map((c) => [c.id, c.name]) || []);
        const sectionMap = new Map(sectionsRes.data?.map((s) => [s.id, s.name]) || []);
        const studentsWithResults = new Set(resultsRes.data?.map((r) => r.student_id) || []);

        const childrenData: Child[] = studentsData?.map((s) => ({
          id: s.id,
          full_name: s.full_name,
          student_id: s.student_id,
          class_name: classMap.get(s.class_id) || "Unknown",
          section_name: sectionMap.get(s.section_id) || "Unknown",
          has_results: studentsWithResults.has(s.id),
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
          <h1 className="text-2xl font-bold text-slate-800">Report Cards</h1>
          <p className="mt-1 text-sm text-slate-500">
            View academic report cards for your children.
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
            <span className="ml-3 text-slate-600">Loading...</span>
          </div>
        ) : children.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <FileText size={48} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-700">No Children Linked</h3>
            <p className="mt-1 text-sm text-slate-500">
              No children are currently linked to your account.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {children.map((child) => (
              <div
                key={child.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
                    {child.full_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{child.full_name}</h3>
                    <p className="text-sm text-slate-500">
                      {child.class_name} - {child.section_name}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  {child.has_results ? (
                    <Link
                      href={`/parent/report-cards/${child.id}`}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      <Eye size={18} />
                      View Report Cards
                    </Link>
                  ) : (
                    <div className="flex items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-500">
                      <FileText size={18} />
                      No results yet
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
