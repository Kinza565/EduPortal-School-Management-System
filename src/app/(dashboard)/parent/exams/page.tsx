"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loader2, FileText, Search } from "lucide-react";

interface Child {
  id: string;
  full_name: string;
  class_name: string;
  section_name: string;
}

interface Exam {
  id: string;
  name: string;
  exam_type: string;
  class_name: string;
  section_name: string | null;
  start_date: string;
  end_date: string;
  status: string;
  description: string | null;
  subjects: {
    name: string;
    exam_date: string;
    start_time: string | null;
    end_time: string | null;
    total_marks: number;
    passing_marks: number;
    room_number: string | null;
    invigilator_name: string | null;
  }[];
}

export default function ParentExamsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [exams, setExams] = useState<Exam[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

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

        const { data: studentData } = await supabase
          .from("students")
          .select("class_id, section_id")
          .eq("id", selectedChild)
          .single();

        if (!studentData) {
          if (!cancelled) {
            setExams([]);
            setLoading(false);
          }
          return;
        }

        let query = supabase
          .from("exams")
          .select("id, name, exam_type, start_date, end_date, status, description, class_id, section_id")
          .eq("class_id", studentData.class_id)
          .eq("school_id", profile.school_id)
          .order("start_date", { ascending: false });

        if (statusFilter !== "all") query = query.eq("status", statusFilter);

        const { data: examsData, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        if (cancelled) return;

        const examIds = examsData?.map((e) => e.id) || [];
        const classIds = [...new Set(examsData?.map((e) => e.class_id) || [])];
        const sectionIds = [...new Set(examsData?.map((e) => e.section_id).filter(Boolean) || [])];

        const [classesRes, sectionsRes, examSubjectsRes] = await Promise.all([
          supabase.from("classes").select("id, name").in("id", classIds),
          supabase.from("sections").select("id, name").in("id", sectionIds),
          supabase
            .from("exam_subjects")
            .select("exam_id, exam_date, start_time, end_time, total_marks, passing_marks, room_number, invigilator_id, subject_id")
            .in("exam_id", examIds),
        ]);

        const classMap = new Map(classesRes.data?.map((c) => [c.id, c.name]) || []);
        const sectionMap = new Map(sectionsRes.data?.map((s) => [s.id, s.name]) || []);

        const subjectIds = [...new Set(examSubjectsRes.data?.map((es) => es.subject_id) || [])];
        const invigilatorIds = [...new Set(examSubjectsRes.data?.map((es) => es.invigilator_id).filter(Boolean) || [])];

        const [subjectsRes, invigilatorsRes] = await Promise.all([
          supabase.from("subjects").select("id, name").in("id", subjectIds),
          supabase.from("profiles").select("id, full_name").in("id", invigilatorIds),
        ]);

        const subjectMap = new Map(subjectsRes.data?.map((s) => [s.id, s.name]) || []);
        const invigilatorMap = new Map(invigilatorsRes.data?.map((i) => [i.id, i.full_name]) || []);

        const examSubjectsMap = new Map<string, Exam["subjects"]>();
        examSubjectsRes.data?.forEach((es) => {
          const subject = {
            name: subjectMap.get(es.subject_id) || "Unknown",
            exam_date: es.exam_date,
            start_time: es.start_time,
            end_time: es.end_time,
            total_marks: es.total_marks,
            passing_marks: es.passing_marks,
            room_number: es.room_number,
            invigilator_name: es.invigilator_id ? invigilatorMap.get(es.invigilator_id) || null : null,
          };
          const existing = examSubjectsMap.get(es.exam_id) || [];
          existing.push(subject);
          examSubjectsMap.set(es.exam_id, existing);
        });

        const mappedExams: Exam[] = examsData?.map((e) => ({
          id: e.id,
          name: e.name,
          exam_type: e.exam_type,
          class_name: classMap.get(e.class_id) || "Unknown",
          section_name: e.section_id ? sectionMap.get(e.section_id) || null : null,
          start_date: e.start_date,
          end_date: e.end_date,
          status: e.status,
          description: e.description,
          subjects: examSubjectsMap.get(e.id) || [],
        })) || [];

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
  }, [selectedChild, statusFilter]);

  const filteredExams = useMemo(() => {
    return exams.filter((e) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !e.name.toLowerCase().includes(query) &&
          !e.exam_type.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [exams, searchQuery]);

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

  return (
    <DashboardLayout allowedRoles={["parent"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Exams</h1>
          <p className="mt-1 text-sm text-slate-500">
            View exams for your children.
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
          <>
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
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="all">All Status</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Search</label>
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search exams..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>

            {/* Exams List */}
            {filteredExams.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <FileText size={48} className="mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-700">No Exams Found</h3>
                <p className="mt-1 text-sm text-slate-500">
                  No exams match your search criteria.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-slate-800">{exam.name}</h3>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${getStatusColor(exam.status)}`}
                          >
                            {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          {exam.exam_type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())} •{" "}
                          {exam.class_name} {exam.section_name && `- ${exam.section_name}`}
                        </p>
                        {exam.description && (
                          <p className="mt-2 text-sm text-slate-600">{exam.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Start Date</p>
                        <p className="text-sm font-medium text-slate-700">
                          {new Date(exam.start_date).toLocaleDateString()}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">End Date</p>
                        <p className="text-sm font-medium text-slate-700">
                          {new Date(exam.end_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {exam.subjects.length > 0 && (
                      <div className="mt-4 border-t border-slate-100 pt-4">
                        <p className="mb-3 text-sm font-semibold text-slate-700">Subjects</p>
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[600px]">
                            <thead>
                              <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                                <th className="pb-2">Subject</th>
                                <th className="pb-2">Date</th>
                                <th className="pb-2">Time</th>
                                <th className="pb-2">Marks</th>
                                <th className="pb-2">Room</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {exam.subjects.map((subject, index) => (
                                <tr key={index} className="text-sm">
                                  <td className="py-2 font-medium text-slate-700">{subject.name}</td>
                                  <td className="py-2 text-slate-600">
                                    {new Date(subject.exam_date).toLocaleDateString()}
                                  </td>
                                  <td className="py-2 text-slate-600">
                                    {subject.start_time && subject.end_time
                                      ? `${subject.start_time} - ${subject.end_time}`
                                      : "-"}
                                  </td>
                                  <td className="py-2 text-slate-600">
                                    {subject.passing_marks}/{subject.total_marks}
                                  </td>
                                  <td className="py-2 text-slate-600">{subject.room_number || "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
