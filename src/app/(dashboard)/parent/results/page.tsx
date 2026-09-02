"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loader2, AlertCircle, Award, Search } from "lucide-react";
import { getGradeColor, getStatusColor } from "@/utils/gradeCalculator";

interface Child {
  id: string;
  full_name: string;
  class_name: string;
  section_name: string;
}

interface Result {
  id: string;
  exam_name: string;
  exam_type: string;
  subject_name: string;
  total_marks: number;
  obtained_marks: number;
  percentage: number;
  grade: string;
  status: string;
  remarks: string | null;
}

interface ResultSummary {
  total: number;
  average: number;
  passed: number;
  failed: number;
  highest: number | null;
}

export default function ParentResultsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [results, setResults] = useState<Result[]>([]);
  const [examFilter, setExamFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [exams, setExams] = useState<{ id: string; name: string }[]>([]);

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
          .select("id, full_name, class_id, section_id")
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
          class_name: classMap.get(s.class_id) || "Unknown",
          section_name: sectionMap.get(s.section_id) || "Unknown",
        })) || [];

        if (!cancelled) {
          setChildren(childrenData);
          if (childrenData.length > 0) {
            setSelectedChild(childrenData[0].id);
          }
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

  useEffect(() => {
    if (!selectedChild || !profile?.id) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        let query = supabase
          .from("results")
          .select("id, exam_id, obtained_marks, total_marks, percentage, grade, status, remarks, exam_subject_id")
          .eq("student_id", selectedChild)
          .eq("school_id", profile.school_id)
          .order("created_at", { ascending: false });

        if (statusFilter === "pass") query = query.eq("status", "pass");
        else if (statusFilter === "fail") query = query.eq("status", "fail");

        const { data: resultsData, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        if (cancelled) return;

        const examIds = [...new Set(resultsData?.map((r) => r.exam_id) || [])];
        const examSubjectIds = [...new Set(resultsData?.map((r) => r.exam_subject_id) || [])];

        const [examsRes, examSubjectsRes] = await Promise.all([
          supabase.from("exams").select("id, name, exam_type").in("id", examIds),
          supabase
            .from("exam_subjects")
            .select("id, subject_id")
            .in("id", examSubjectIds),
        ]);

        const examMap = new Map(examsRes.data?.map((e) => [e.id, e]) || []);
        const examSubjectMap = new Map(examSubjectsRes.data?.map((es) => [es.id, es.subject_id]) || []);

        const subjectIds = [...new Set(examSubjectsRes.data?.map((es) => es.subject_id) || [])];
        const subjectsRes = await supabase.from("subjects").select("id, name").in("id", subjectIds);
        const subjectMap = new Map(subjectsRes.data?.map((s) => [s.id, s.name]) || []);

        const examList = examsRes.data?.map((e) => ({ id: e.id, name: e.name })) || [];
        setExams(examList);

        const mappedResults: Result[] = resultsData?.map((r) => {
          const exam = examMap.get(r.exam_id);
          const subjectId = examSubjectMap.get(r.exam_subject_id);
          const subjectName = subjectId ? subjectMap.get(subjectId) || "Unknown" : "Unknown";

          return {
            id: r.id,
            exam_name: exam?.name || "Unknown",
            exam_type: exam?.exam_type || "",
            subject_name: subjectName,
            total_marks: r.total_marks,
            obtained_marks: r.obtained_marks,
            percentage: r.percentage,
            grade: r.grade,
            status: r.status,
            remarks: r.remarks,
          };
        }) || [];

        if (!cancelled) {
          setResults(mappedResults);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load results");
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
  }, [selectedChild, statusFilter]);

  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      if (examFilter !== "all" && r.exam_name !== examFilter) return false;
      if (subjectFilter !== "all" && r.subject_name !== subjectFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !r.subject_name.toLowerCase().includes(query) &&
          !r.exam_name.toLowerCase().includes(query) &&
          !r.grade.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [results, examFilter, subjectFilter, searchQuery]);

  const summary: ResultSummary = useMemo(() => {
    const total = filteredResults.length;
    const passed = filteredResults.filter((r) => r.status === "pass").length;
    const failed = total - passed;
    const percentages = filteredResults.map((r) => r.percentage);
    const average = total > 0 ? Math.round(percentages.reduce((a, b) => a + b, 0) / total) : 0;
    const highest = total > 0 ? Math.max(...percentages) : null;

    return { total, average, passed, failed, highest };
  }, [filteredResults]);

  const uniqueSubjects = useMemo(() => {
    return [...new Set(results.map((r) => r.subject_name))];
  }, [results]);

  return (
    <DashboardLayout allowedRoles={["parent"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Results</h1>
          <p className="mt-1 text-sm text-slate-500">
            View academic results for your children.
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
            <Award size={48} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-700">No Children Linked</h3>
            <p className="mt-1 text-sm text-slate-500">
              No children are currently linked to your account.
            </p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                <p className="text-sm text-slate-500">Total Results</p>
                <p className="mt-1 text-2xl font-bold text-slate-800">{summary.total}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                <p className="text-sm text-slate-500">Average</p>
                <p className="mt-1 text-2xl font-bold text-blue-600">{summary.average}%</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                <p className="text-sm text-slate-500">Passed</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">{summary.passed}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                <p className="text-sm text-slate-500">Failed</p>
                <p className="mt-1 text-2xl font-bold text-red-600">{summary.failed}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                <p className="text-sm text-slate-500">Highest</p>
                <p className="mt-1 text-2xl font-bold text-purple-600">
                  {summary.highest !== null ? `${summary.highest}%` : "N/A"}
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Select Child</label>
                <select
                  value={selectedChild}
                  onChange={(e) => setSelectedChild(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.full_name} - {child.class_name} {child.section_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Exam</label>
                <select
                  value={examFilter}
                  onChange={(e) => setExamFilter(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="all">All Exams</option>
                  {exams.map((exam) => (
                    <option key={exam.id} value={exam.name}>{exam.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Subject</label>
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="all">All Subjects</option>
                  {uniqueSubjects.map((subject) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="all">All</option>
                  <option value="pass">Pass</option>
                  <option value="fail">Fail</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Search</label>
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>

            {/* Results Table */}
            {filteredResults.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <Award size={48} className="mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-700">No Results Found</h3>
                <p className="mt-1 text-sm text-slate-500">
                  No results match your search criteria.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Exam
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Subject
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Marks
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Percentage
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Grade
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredResults.map((result) => (
                        <tr key={result.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-slate-800">{result.exam_name}</p>
                              <p className="text-xs text-slate-500">
                                {result.exam_type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{result.subject_name}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {result.obtained_marks}/{result.total_marks}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-700">{result.percentage}%</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${getGradeColor(result.grade as "A+" | "A" | "B" | "C" | "D" | "F")}`}
                            >
                              {result.grade}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${getStatusColor(result.status as "pass" | "fail")}`}
                            >
                              {result.status === "pass" ? "Pass" : "Fail"}
                            </span>
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
