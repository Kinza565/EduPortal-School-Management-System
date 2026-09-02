"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loader2, Search, FileText, Eye } from "lucide-react";
import Link from "next/link";

interface Exam {
  id: string;
  name: string;
  exam_type: string;
  class_id: string;
  section_id: string | null;
}

interface Class {
  id: string;
  name: string;
}

interface Section {
  id: string;
  name: string;
  class_id: string;
}

interface StudentResult {
  student_id: string;
  student_name: string;
  student_code: string;
  roll_number: string | null;
  class_name: string;
  section_name: string;
  total_marks: number;
  obtained_marks: number;
  percentage: number;
  grade: string;
  status: string;
  result_count: number;
}

export default function ReportCardsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [results, setResults] = useState<StudentResult[]>([]);

  const [selectedExam, setSelectedExam] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingResults, setLoadingResults] = useState(false);

  useEffect(() => {
    if (!profile?.school_id) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        const [examsRes, classesRes, sectionsRes] = await Promise.all([
          supabase
            .from("exams")
            .select("id, name, exam_type, class_id, section_id")
            .eq("school_id", profile.school_id)
            .order("start_date", { ascending: false }),
          supabase
            .from("classes")
            .select("id, name")
            .eq("school_id", profile.school_id)
            .order("name"),
          supabase
            .from("sections")
            .select("id, name, class_id")
            .eq("school_id", profile.school_id)
            .order("name"),
        ]);

        if (examsRes.error) throw examsRes.error;
        if (classesRes.error) throw classesRes.error;
        if (sectionsRes.error) throw sectionsRes.error;

        if (!cancelled) {
          setExams(examsRes.data || []);
          setClasses(classesRes.data || []);
          setSections(sectionsRes.data || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load data");
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
  }, [profile?.school_id]);

  const filteredSections = useMemo(() => {
    return sections.filter((s) => s.class_id === selectedClass);
  }, [sections, selectedClass]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!(selectedClass && selectedSection && selectedExam)) {
        setResults([]);
        return;
      }

      setLoadingResults(true);
      setError(null);

      try {
        const supabase = createClient();

        const { data: resultsData, error: resultsError } = await supabase
          .from("results")
          .select("student_id, total_marks, obtained_marks, percentage, grade, status")
          .eq("exam_id", selectedExam)
          .eq("class_id", selectedClass)
          .eq("section_id", selectedSection);

        if (cancelled) return;
        if (resultsError) throw resultsError;

        if (!resultsData || resultsData.length === 0) {
          setResults([]);
          setLoadingResults(false);
          return;
        }

        const studentIds = [...new Set(resultsData.map((r) => r.student_id))];

        const [studentsRes, classesRes, sectionsRes] = await Promise.all([
          supabase.from("students").select("id, full_name, student_id, roll_number, class_id, section_id").in("id", studentIds),
          supabase.from("classes").select("id, name").eq("school_id", profile?.school_id),
          supabase.from("sections").select("id, name").eq("school_id", profile?.school_id),
        ]);

        if (cancelled) return;

        const studentInfoMap = new Map(studentsRes.data?.map((s) => [s.id, s]) || []);
        const classNameMap = new Map(classesRes.data?.map((c) => [c.id, c.name]) || []);
        const sectionNameMap = new Map(sectionsRes.data?.map((s) => [s.id, s.name]) || []);

        const aggregated: StudentResult[] = [];

        for (const studentId of studentIds) {
          const studentResults = resultsData.filter((r) => r.student_id === studentId);
          const studentInfo = studentInfoMap.get(studentId);

          if (!studentInfo) continue;

          const totalMarks = studentResults.reduce((sum, r) => sum + Number(r.total_marks), 0);
          const obtainedMarks = studentResults.reduce((sum, r) => sum + Number(r.obtained_marks), 0);
          const percentage = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 10000) / 100 : 0;

          let overallGrade = "A+";
          if (percentage >= 90) overallGrade = "A+";
          else if (percentage >= 80) overallGrade = "A";
          else if (percentage >= 70) overallGrade = "B";
          else if (percentage >= 60) overallGrade = "C";
          else if (percentage >= 50) overallGrade = "D";
          else overallGrade = "F";

          const allPassed = studentResults.every((r) => r.status === "pass");

          aggregated.push({
            student_id: studentId,
            student_name: studentInfo.full_name,
            student_code: studentInfo.student_id,
            roll_number: studentInfo.roll_number,
            class_name: classNameMap.get(studentInfo.class_id) || "Unknown",
            section_name: sectionNameMap.get(studentInfo.section_id) || "Unknown",
            total_marks: totalMarks,
            obtained_marks: obtainedMarks,
            percentage: percentage,
            grade: overallGrade,
            status: allPassed ? "pass" : "fail",
            result_count: studentResults.length,
          });
        }

        setResults(aggregated);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load results");
        }
      } finally {
        if (!cancelled) {
          setLoadingResults(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedClass, selectedSection, selectedExam, profile?.school_id]);

  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          r.student_name.toLowerCase().includes(query) ||
          r.student_code.toLowerCase().includes(query) ||
          (r.roll_number?.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [results, searchQuery]);

  return (
    <DashboardLayout allowedRoles={["admin"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Report Cards</h1>
          <p className="mt-1 text-sm text-slate-500">
            Generate, view, print, and download student academic reports.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Exam</label>
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select Exam</option>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.name} ({exam.exam_type.replace("_", " ")})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedSection("");
                }}
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Section</label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                disabled={!selectedClass}
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select Section</option>
                {filteredSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Search Student</label>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Name, ID, or roll..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <span className="ml-3 text-slate-600">Loading...</span>
          </div>
        ) : loadingResults ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <span className="ml-3 text-slate-600">Loading results...</span>
          </div>
        ) : results.length === 0 && selectedExam && selectedClass && selectedSection ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <FileText size={48} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-700">No Results Found</h3>
            <p className="mt-1 text-sm text-slate-500">
              No results found for the selected exam, class, and section.
            </p>
          </div>
        ) : results.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Student
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Roll No.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Class
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Total Marks
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Obtained
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Percentage
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Grade
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredResults.map((result) => (
                    <tr key={result.student_id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{result.student_name}</p>
                          <p className="text-xs text-slate-500">{result.student_code}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {result.roll_number || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {result.class_name} - {result.section_name}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600">
                        {result.total_marks}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-slate-800">
                        {result.obtained_marks}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-slate-800">
                        {result.percentage}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                          {result.grade}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                            result.status === "pass"
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                              : "bg-red-50 text-red-700 ring-red-600/20"
                          }`}
                        >
                          {result.status === "pass" ? "PASS" : "FAIL"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Link
                            href={`/admin/report-cards/${result.student_id}?exam=${selectedExam}`}
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                            title="View Report"
                          >
                            <Eye size={16} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <FileText size={48} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-700">Select Filters</h3>
            <p className="mt-1 text-sm text-slate-500">
              Please select an exam, class, and section to view report cards.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
