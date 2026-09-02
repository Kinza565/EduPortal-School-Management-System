"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loader2, ClipboardList } from "lucide-react";

interface TeacherSubject {
  subject_id: string;
  subject_name: string;
  subject_code: string;
  class_id: string;
  class_name: string;
  section_id: string;
  section_name: string;
  is_class_teacher: boolean;
}

export default function MySubjectsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<TeacherSubject[]>([]);

  useEffect(() => {
    if (!profile?.id) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const teacherId = profile.id;

        const { data: assignments, error: assignError } = await supabase
          .from("teacher_assignments")
          .select("*")
          .eq("teacher_id", teacherId);

        if (assignError) throw assignError;

        const classIds = [...new Set(assignments?.map((a) => a.class_id) || [])];
        const sectionIds = [...new Set(assignments?.map((a) => a.section_id) || [])];
        const subjectIds = [...new Set(assignments?.map((a) => a.subject_id) || [])];

        const [classesRes, sectionsRes, subjectsRes] = await Promise.all([
          supabase.from("classes").select("id, name").in("id", classIds),
          supabase.from("sections").select("id, name").in("id", sectionIds),
          supabase.from("subjects").select("id, name, code").in("id", subjectIds),
        ]);

        const classMap = new Map(classesRes.data?.map((c) => [c.id, c.name]) || []);
        const sectionMap = new Map(sectionsRes.data?.map((s) => [s.id, s.name]) || []);
        const subjectMap = new Map(subjectsRes.data?.map((s) => [s.id, s]) || []);

        const subjectsData: TeacherSubject[] = (assignments || []).map((a) => {
          const subject = subjectMap.get(a.subject_id);
          return {
            subject_id: a.subject_id,
            subject_name: subject?.name || "Unknown",
            subject_code: subject?.code || "",
            class_id: a.class_id,
            class_name: classMap.get(a.class_id) || "Unknown",
            section_id: a.section_id,
            section_name: sectionMap.get(a.section_id) || "Unknown",
            is_class_teacher: a.is_class_teacher,
          };
        });

        if (!cancelled) {
          setSubjects(subjectsData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load subjects");
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
    <DashboardLayout allowedRoles={["teacher"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Subjects</h1>
          <p className="mt-1 text-sm text-slate-500">
            Subjects assigned to you across classes and sections.
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
            <span className="ml-3 text-slate-600">Loading subjects...</span>
          </div>
        ) : subjects.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <ClipboardList size={48} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-700">No Subjects Assigned</h3>
            <p className="mt-1 text-sm text-slate-500">
              You have not been assigned to any subjects yet.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Subject
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Class
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Section
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Role
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjects.map((subject, index) => (
                    <tr key={`${subject.class_id}-${subject.section_id}-${subject.subject_id}-${index}`} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-800">{subject.subject_name}</span>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                            {subject.subject_code}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {subject.class_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {subject.section_name}
                      </td>
                      <td className="px-4 py-3">
                        {subject.is_class_teacher ? (
                          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                            Class Teacher
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                            Subject Teacher
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
