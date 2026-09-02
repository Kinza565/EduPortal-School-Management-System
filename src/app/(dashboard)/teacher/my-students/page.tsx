"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loader2, Search, GraduationCap } from "lucide-react";
import Link from "next/link";

interface Student {
  id: string;
  student_id: string;
  roll_number: string | null;
  full_name: string;
  class_name: string;
  section_name: string;
  status: string;
}

export default function MyStudentsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [sections, setSections] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!profile?.id) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const teacherId = profile.id;

        const { data: assignments } = await supabase
          .from("teacher_assignments")
          .select("class_id, section_id")
          .eq("teacher_id", teacherId);

        const classIds = [...new Set(assignments?.map((a) => a.class_id) || [])];
        const sectionIds = [...new Set(assignments?.map((a) => a.section_id) || [])];

        if (classIds.length === 0) {
          if (!cancelled) {
            setStudents([]);
            setLoading(false);
          }
          return;
        }

        const [studentsRes, classesRes, sectionsRes] = await Promise.all([
          supabase
            .from("students")
            .select("id, student_id, roll_number, full_name, status, class_id, section_id")
            .in("class_id", classIds)
            .in("section_id", sectionIds)
            .order("full_name"),
          supabase.from("classes").select("id, name").in("id", classIds),
          supabase.from("sections").select("id, name").in("id", sectionIds),
        ]);

        const classMap = new Map(classesRes.data?.map((c) => [c.id, c.name]) || []);
        const sectionMap = new Map(sectionsRes.data?.map((s) => [s.id, s.name]) || []);

        const mappedStudents: Student[] = (studentsRes.data || []).map((s) => ({
          id: s.id,
          student_id: s.student_id,
          roll_number: s.roll_number,
          full_name: s.full_name,
          class_name: classMap.get(s.class_id) || "Unknown",
          section_name: sectionMap.get(s.section_id) || "Unknown",
          status: s.status,
        }));

        if (!cancelled) {
          setStudents(mappedStudents);
          const uniqueClasses = [...new Set(mappedStudents.map((s) => s.class_name))];
          const uniqueSections = [...new Set(mappedStudents.map((s) => s.section_name))];
          setClasses(uniqueClasses.map((name, i) => ({ id: String(i), name })));
          setSections(uniqueSections.map((name, i) => ({ id: String(i), name })));
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
  }, [profile?.id]);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !student.full_name.toLowerCase().includes(query) &&
          !student.student_id.toLowerCase().includes(query) &&
          !(student.roll_number?.toLowerCase().includes(query))
        ) {
          return false;
        }
      }
      if (classFilter !== "all" && student.class_name !== classFilter) return false;
      if (sectionFilter !== "all" && student.section_name !== sectionFilter) return false;
      if (statusFilter !== "all" && student.status !== statusFilter) return false;
      return true;
    });
  }, [students, searchQuery, classFilter, sectionFilter, statusFilter]);

  return (
    <DashboardLayout allowedRoles={["teacher"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Students</h1>
          <p className="mt-1 text-sm text-slate-500">
            Students in your assigned classes and sections.
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
            <span className="ml-3 text-slate-600">Loading students...</span>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, ID, or roll number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="flex gap-3">
                <select
                  value={classFilter}
                  onChange={(e) => { setClassFilter(e.target.value); setSectionFilter("all"); }}
                  className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="all">All Classes</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.name}>{cls.name}</option>
                  ))}
                </select>
                <select
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                  className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="all">All Sections</option>
                  {sections.map((sec) => (
                    <option key={sec.id} value={sec.name}>{sec.name}</option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="graduated">Graduated</option>
                </select>
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <GraduationCap size={48} className="mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-700">No Students Found</h3>
                <p className="mt-1 text-sm text-slate-500">
                  No students match your search criteria.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Roll No.
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Student ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Class
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Section
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Status
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.map((student) => (
                        <tr key={student.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {student.roll_number || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-800">
                            {student.student_id}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">
                            {student.full_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {student.class_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {student.section_name}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                                student.status === "active"
                                  ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                                  : student.status === "inactive"
                                  ? "bg-amber-50 text-amber-700 ring-amber-600/20"
                                  : "bg-slate-50 text-slate-700 ring-slate-600/20"
                              }`}
                            >
                              {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/teacher/students/${student.id}`}
                              className="text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
