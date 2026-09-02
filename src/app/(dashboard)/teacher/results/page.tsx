"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loader2, Save, Award } from "lucide-react";
import { calculateResult, getGradeColor, getStatusColor } from "@/utils/gradeCalculator";

interface Exam {
  id: string;
  name: string;
  exam_type: string;
}

interface ExamSubject {
  id: string;
  subject_id: string;
  subject_name: string;
  total_marks: number;
  passing_marks: number;
}

interface TeacherAssignment {
  class_id: string;
  class_name: string;
  section_id: string;
  section_name: string;
  subject_id: string;
  subject_name: string;
}

interface StudentMark {
  student_id: string;
  student_name: string;
  student_id_code: string;
  roll_number: string | null;
  obtained_marks: number;
  total_marks: number;
  passing_marks: number;
  percentage: number;
  grade: string;
  status: string;
  result_id?: string;
}

export default function ResultsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [examSubjects, setExamSubjects] = useState<ExamSubject[]>([]);
  const [students, setStudents] = useState<StudentMark[]>([]);

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedExam, setSelectedExam] = useState("");

  useEffect(() => {
    if (!profile?.id) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const teacherId = profile.id;

        const { data: teacherAssigns } = await supabase
          .from("teacher_assignments")
          .select("class_id, section_id, subject_id")
          .eq("teacher_id", teacherId);

        const classIds = [...new Set(teacherAssigns?.map((a) => a.class_id) || [])];
        const sectionIds = [...new Set(teacherAssigns?.map((a) => a.section_id) || [])];
        const subjectIds = [...new Set(teacherAssigns?.map((a) => a.subject_id) || [])];

        const [classesRes, sectionsRes, subjectsRes, examsRes] = await Promise.all([
          supabase.from("classes").select("id, name").in("id", classIds),
          supabase.from("sections").select("id, name").in("id", sectionIds),
          supabase.from("subjects").select("id, name").in("id", subjectIds),
          supabase
            .from("exams")
            .select("id, name, exam_type")
            .in("class_id", classIds)
            .in("status", ["ongoing", "completed"])
            .order("start_date", { ascending: false }),
        ]);

        const classMap = new Map(classesRes.data?.map((c) => [c.id, c.name]) || []);
        const sectionMap = new Map(sectionsRes.data?.map((s) => [s.id, s.name]) || []);
        const subjectMap = new Map(subjectsRes.data?.map((s) => [s.id, s.name]) || []);

        if (!cancelled) {
          setTeacherAssignments(
            (teacherAssigns || []).map((a) => ({
              class_id: a.class_id,
              class_name: classMap.get(a.class_id) || "Unknown",
              section_id: a.section_id,
              section_name: sectionMap.get(a.section_id) || "Unknown",
              subject_id: a.subject_id,
              subject_name: subjectMap.get(a.subject_id) || "Unknown",
            }))
          );
          setExams(examsRes.data || []);
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
  }, [profile?.id]);

  useEffect(() => {
    if (!selectedExam || !selectedSubject) return;

    let cancelled = false;

    (async () => {
      try {
        const supabase = createClient();

        const { data: examSubjData } = await supabase
          .from("exam_subjects")
          .select("id, total_marks, passing_marks, subject_id")
          .eq("exam_id", selectedExam)
          .eq("subject_id", selectedSubject)
          .single();

        if (!cancelled && examSubjData) {
          setExamSubjects([
            {
              id: examSubjData.id,
              subject_id: selectedSubject,
              subject_name: teacherAssignments.find((a) => a.subject_id === selectedSubject)?.subject_name || "Unknown",
              total_marks: examSubjData.total_marks,
              passing_marks: examSubjData.passing_marks,
            },
          ]);
        }
      } catch {
        if (!cancelled) {
          setExamSubjects([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedExam, selectedSubject, teacherAssignments]);

  const isSelectionComplete = !!(selectedClass && selectedSection && selectedExam && selectedSubject && examSubjects.length > 0);

  useEffect(() => {
    if (!isSelectionComplete || !profile?.id) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const examSubject = examSubjects[0];

        const { data: studentsData } = await supabase
          .from("students")
          .select("id, full_name, student_id, roll_number")
          .eq("class_id", selectedClass)
          .eq("section_id", selectedSection)
          .eq("status", "active")
          .eq("school_id", profile.school_id)
          .order("roll_number");

        const { data: resultsData } = await supabase
          .from("results")
          .select("id, student_id, obtained_marks, percentage, grade, status")
          .eq("exam_id", selectedExam)
          .eq("exam_subject_id", examSubject.id)
          .eq("school_id", profile.school_id);

        const resultsMap = new Map(resultsData?.map((r) => [r.student_id, r]) || []);

        if (!cancelled && studentsData) {
          setStudents(
            studentsData.map((s) => {
              const existing = resultsMap.get(s.id);
              return {
                student_id: s.id,
                student_name: s.full_name,
                student_id_code: s.student_id,
                roll_number: s.roll_number,
                obtained_marks: existing?.obtained_marks ?? 0,
                total_marks: examSubject.total_marks,
                passing_marks: examSubject.passing_marks,
                percentage: existing?.percentage ?? 0,
                grade: existing?.grade ?? "F",
                status: existing?.status ?? "fail",
                result_id: existing?.id,
              };
            })
          );
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
  }, [isSelectionComplete, selectedClass, selectedSection, selectedExam, selectedSubject, examSubjects]);

  const handleMarksChange = (studentId: string, marks: number) => {
    const examSubject = examSubjects[0];
    if (!examSubject) return;

    const clampedMarks = Math.min(Math.max(0, marks), examSubject.total_marks);
    const { percentage, grade, status } = calculateResult(clampedMarks, examSubject.total_marks, examSubject.passing_marks);

    setStudents((prev) =>
      prev.map((s) =>
        s.student_id === studentId
          ? { ...s, obtained_marks: clampedMarks, percentage, grade, status }
          : s
      )
    );
  };

  const handleSave = async () => {
    if (!profile?.id || !profile?.school_id || examSubjects.length === 0) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();
      const examSubject = examSubjects[0];

      const records = students.map((s) => ({
        id: s.result_id,
        school_id: profile.school_id,
        exam_id: selectedExam,
        exam_subject_id: examSubject.id,
        student_id: s.student_id,
        class_id: selectedClass,
        section_id: selectedSection,
        obtained_marks: s.obtained_marks,
        total_marks: s.total_marks,
        passing_marks: s.passing_marks,
        percentage: s.percentage,
        grade: s.grade,
        status: s.status,
      }));

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const toInsert = records.filter((r) => !r.id).map(({ id, ...rest }) => rest);
      const toUpdate = records.filter((r) => r.id);

      if (toInsert.length > 0) {
        const { error: insertError } = await supabase.from("results").insert(toInsert);
        if (insertError) throw insertError;
      }

      for (const record of toUpdate) {
        const { id, ...rest } = record;
        const { error: updateError } = await supabase
          .from("results")
          .update(rest)
          .eq("id", id);
        if (updateError) throw updateError;
      }

      setSuccess("Results saved successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save results");
    } finally {
      setSaving(false);
    }
  };

  const filteredSections = useMemo(() => {
    return teacherAssignments.filter((a) => a.class_id === selectedClass);
  }, [teacherAssignments, selectedClass]);

  const filteredSubjects = useMemo(() => {
    return filteredSections.filter((a) => a.section_id === selectedSection);
  }, [filteredSections, selectedSection]);

  return (
    <DashboardLayout allowedRoles={["teacher"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Results / Marks</h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter and update marks for your assigned classes and subjects.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {/* Selection Controls */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedSection("");
                  setSelectedSubject("");
                }}
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select Class</option>
                {[...new Map(teacherAssignments.map((a) => [a.class_id, a])).values()].map((a) => (
                  <option key={a.class_id} value={a.class_id}>{a.class_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Section</label>
              <select
                value={selectedSection}
                onChange={(e) => {
                  setSelectedSection(e.target.value);
                  setSelectedSubject("");
                }}
                disabled={!selectedClass}
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select Section</option>
                {filteredSections.map((a) => (
                  <option key={a.section_id} value={a.section_id}>{a.section_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                disabled={!selectedSection}
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select Subject</option>
                {filteredSubjects.map((a) => (
                  <option key={a.subject_id} value={a.subject_id}>{a.subject_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Exam</label>
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                disabled={!selectedSubject}
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select Exam</option>
                {exams.map((e) => (
                  <option key={e.id} value={e.id}>{e.name} ({e.exam_type})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <span className="ml-3 text-slate-600">Loading...</span>
          </div>
        ) : students.length > 0 ? (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Total Marks: <span className="font-medium text-slate-700">{examSubjects[0]?.total_marks}</span> | 
                Passing Marks: <span className="font-medium text-slate-700">{examSubjects[0]?.passing_marks}</span>
              </p>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? "Saving..." : "Save Marks"}
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Roll No.
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Student ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Student Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Obtained Marks
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
                    {students.map((student) => (
                      <tr key={student.student_id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {student.roll_number || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-800">
                          {student.student_id_code}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {student.student_name}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min={0}
                            max={student.total_marks}
                            value={student.obtained_marks}
                            onChange={(e) => handleMarksChange(student.student_id, Number(e.target.value))}
                            className="h-9 w-24 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {student.percentage}%
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${getGradeColor(student.grade as "A+" | "A" | "B" | "C" | "D" | "F")}`}
                          >
                            {student.grade}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${getStatusColor(student.status as "pass" | "fail")}`}
                          >
                            {student.status === "pass" ? "Pass" : "Fail"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          selectedClass && selectedSection && selectedSubject && selectedExam && !loading && (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <Award size={48} className="mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-semibold text-slate-700">No Students Found</h3>
              <p className="mt-1 text-sm text-slate-500">
                No active students found for this selection.
              </p>
            </div>
          )
        )}

        {!selectedClass && !loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <Award size={48} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-700">Select Options</h3>
            <p className="mt-1 text-sm text-slate-500">
              Please select class, section, subject, and exam to enter marks.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
