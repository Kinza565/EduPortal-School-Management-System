"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loader2, FileText, Search } from "lucide-react";

interface Exam {
  id: string;
  name: string;
  exam_type: string;
  class_name: string;
  section_name: string | null;
  start_date: string;
  end_date: string;
  status: string;
  subjects: { name: string; exam_date: string; total_marks: number }[];
}

export default function ExamsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

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
          .select("class_id")
          .eq("teacher_id", teacherId);

        const classIds = [...new Set(assignments?.map((a) => a.class_id) || [])];

        if (classIds.length === 0) {
          if (!cancelled) {
            setExams([]);
            setLoading(false);
          }
          return;
        }

        const { data: examsData, error: examsError } = await supabase
          .from("exams")
          .select("id, name, exam_type, start_date, end_date, status, class_id, section_id")
          .in("class_id", classIds)
          .order("start_date", { ascending: false });

        if (examsError) throw examsError;

        const examIds = (examsData || []).map((e) => e.id);
        const classIdsFromExams = [...new Set((examsData || []).map((e) => e.class_id))];
        const sectionIdsFromExams = [...new Set((examsData || []).map((e) => e.section_id).filter(Boolean))];

        const [classesRes, sectionsRes, examSubjectsRes] = await Promise.all([
          supabase.from("classes").select("id, name").in("id", classIdsFromExams),
          supabase.from("sections").select("id, name").in("id", sectionIdsFromExams),
          supabase
            .from("exam_subjects")
            .select("exam_id, exam_date, total_marks, subject_id")
            .in("exam_id", examIds),
        ]);

        const classMap = new Map(classesRes.data?.map((c) => [c.id, c.name]) || []);
        const sectionMap = new Map(sectionsRes.data?.map((s) => [s.id, s.name]) || []);

        const subjectIds = [...new Set(examSubjectsRes.data?.map((es) => es.subject_id) || [])];
        const subjectsRes = await supabase.from("subjects").select("id, name").in("id", subjectIds);
        const subjectMap = new Map(subjectsRes.data?.map((s) => [s.id, s.name]) || []);

        const examSubjectsMap = new Map<string, { name: string; exam_date: string; total_marks: number }[]>();
        examSubjectsRes.data?.forEach((es) => {
          const subjectName = subjectMap.get(es.subject_id) || "Unknown";
          const existing = examSubjectsMap.get(es.exam_id) || [];
          existing.push({ name: subjectName, exam_date: es.exam_date, total_marks: es.total_marks });
          examSubjectsMap.set(es.exam_id, existing);
        });

        const mappedExams: Exam[] = (examsData || []).map((e) => ({
          id: e.id,
          name: e.name,
          exam_type: e.exam_type,
          class_name: classMap.get(e.class_id) || "Unknown",
          section_name: e.section_id ? sectionMap.get(e.section_id) || null : null,
          start_date: e.start_date,
          end_date: e.end_date,
          status: e.status,
          subjects: examSubjectsMap.get(e.id) || [],
        }));

        if (!cancelled) {
          setExams(mappedExams);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load exams");
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

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !exam.name.toLowerCase().includes(query) &&
          !exam.class_name.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      if (statusFilter !== "all" && exam.status !== statusFilter) return false;
      if (typeFilter !== "all" && exam.exam_type !== typeFilter) return false;
      return true;
    });
  }, [exams, searchQuery, statusFilter, typeFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-50 text-blue-700 ring-blue-600/20";
      case "ongoing":
        return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
      case "completed":
        return "bg-slate-50 text-slate-700 ring-slate-600/20";
      case "cancelled":
        return "bg-red-50 text-red-700 ring-red-600/20";
      default:
        return "bg-slate-50 text-slate-700 ring-slate-600/20";
    }
  };

  const uniqueTypes = useMemo(() => {
    return [...new Set(exams.map((e) => e.exam_type))];
  }, [exams]);

  return (
    <DashboardLayout allowedRoles={["teacher"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Exams</h1>
          <p className="mt-1 text-sm text-slate-500">
            View exams relevant to your assigned classes.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search exams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All Types</option>
              {uniqueTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <span className="ml-3 text-slate-600">Loading exams...</span>
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <FileText size={48} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-700">No Exams Found</h3>
            <p className="mt-1 text-sm text-slate-500">
              No exams match your search criteria.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredExams.map((exam) => (
              <div
                key={exam.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-800">{exam.name}</h3>
                    <p className="text-sm text-slate-500">
                      {exam.class_name} {exam.section_name && `- ${exam.section_name}`}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${getStatusColor(exam.status)}`}
                  >
                    {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                  </span>
                </div>

                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Type:</span>
                    <span className="font-medium text-slate-700">
                      {exam.exam_type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Start Date:</span>
                    <span className="font-medium text-slate-700">
                      {new Date(exam.start_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">End Date:</span>
                    <span className="font-medium text-slate-700">
                      {new Date(exam.end_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {exam.subjects.length > 0 && (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Subjects
                    </p>
                    <div className="space-y-1">
                      {exam.subjects.map((subject, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">{subject.name}</span>
                          <span className="text-xs text-slate-500">
                            {new Date(subject.exam_date).toLocaleDateString()} • {subject.total_marks} marks
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
