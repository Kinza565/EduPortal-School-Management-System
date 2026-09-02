"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Save, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import type { Exam, ExamSubject, Student, Result } from "@/types/database";
import { calculateResult } from "@/utils/gradeCalculator";
import { ResultStats } from "./ResultStats";
import { ResultFilters } from "./ResultFilters";

interface StudentWithResult extends Student {
  result?: Result;
  obtainedMarksInput: string;
  remarksInput: string;
}

export function ResultEntry() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Data states
  const [exams, setExams] = useState<Exam[]>([]);
  const [examSubjects, setExamSubjects] = useState<(ExamSubject & { subjects: { name: string; code: string } })[]>([]);
  const [students, setStudents] = useState<StudentWithResult[]>([]);

  // Selection states
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");

  const hasActiveFilters = searchQuery !== "" || statusFilter !== "all" || gradeFilter !== "all";

  const selectedSubject = examSubjects.find((s) => s.id === selectedSubjectId);
  const totalMarks = selectedSubject?.total_marks ?? 100;
  const passingMarks = selectedSubject?.passing_marks ?? 35;

  // Load exams on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("exams")
          .select("*")
          .order("start_date", { ascending: false });
        if (cancelled) return;
        if (error) throw error;
        setExams(data || []);
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load exams:", err);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load exam subjects when exam changes
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!selectedExamId) {
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("exam_subjects")
          .select("*, subjects(name, code)")
          .eq("exam_id", selectedExamId)
          .order("exam_date");
        if (cancelled) return;
        if (error) throw error;
        setExamSubjects(data || []);

        // Set class/section from exam if available
        const exam = exams.find((e) => e.id === selectedExamId);
        if (exam) {
          setSelectedClassId(exam.class_id);
          setSelectedSectionId(exam.section_id || "");
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load exam subjects:", err);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedExamId, exams]);

  // Handle exam selection change
  const handleExamChange = useCallback((examId: string) => {
    setSelectedExamId(examId);
    setSelectedSubjectId("");
    setExamSubjects([]);
  }, []);

  // Handle subject selection change
  const handleSubjectChange = useCallback((subjectId: string) => {
    setSelectedSubjectId(subjectId);
  }, []);

  // Load students and existing results when class/section/subject changes
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!selectedClassId || !selectedSubjectId) {
        return;
      }

      setLoading(true);
      try {
        const supabase = createClient();

        // Build student query
        let studentQuery = supabase
          .from("students")
          .select("*")
          .eq("class_id", selectedClassId)
          .eq("status", "active")
          .order("roll_number");

        if (selectedSectionId) {
          studentQuery = studentQuery.eq("section_id", selectedSectionId);
        }

        const { data: studentsData, error: studentsError } = await studentQuery;
        if (cancelled) return;
        if (studentsError) throw studentsError;

        const studentIds = (studentsData || []).map((s) => s.id);
        let resultsData: Result[] = [];

        if (studentIds.length > 0) {
          const { data: results, error: resultsError } = await supabase
            .from("results")
            .select("*")
            .eq("exam_subject_id", selectedSubjectId)
            .in("student_id", studentIds);
          if (cancelled) return;
          if (resultsError) throw resultsError;
          resultsData = results || [];
        }

        const studentsWithResults: StudentWithResult[] = (studentsData || []).map((student) => {
          const existingResult = resultsData.find((r) => r.student_id === student.id);
          return {
            ...student,
            result: existingResult,
            obtainedMarksInput: existingResult ? String(existingResult.obtained_marks) : "",
            remarksInput: existingResult?.remarks || "",
          };
        });

        setStudents(studentsWithResults);
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Failed to load data";
          setError(message);
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
  }, [selectedClassId, selectedSectionId, selectedSubjectId]);

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = student.full_name.toLowerCase().includes(query);
        const matchesId = student.student_id.toLowerCase().includes(query);
        const matchesRoll = student.roll_number?.toLowerCase().includes(query);
        if (!matchesName && !matchesId && !matchesRoll) return false;
      }

      if (statusFilter !== "all") {
        const marks = student.obtainedMarksInput;
        const hasResult = marks !== "" && marks !== undefined;
        if (statusFilter === "pending" && hasResult) return false;
        if (statusFilter === "pass" && (!hasResult || (hasResult && Number(marks) < passingMarks)))
          return false;
        if (statusFilter === "fail" && (!hasResult || (hasResult && Number(marks) >= passingMarks)))
          return false;
      }

      if (gradeFilter !== "all" && student.result && student.result.grade !== gradeFilter) {
        return false;
      }

      return true;
    });
  }, [students, searchQuery, statusFilter, gradeFilter, passingMarks]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalStudents = students.length;
    const resultsEntered = students.filter((s) => s.obtainedMarksInput !== "").length;
    const pendingResults = students.filter((s) => s.obtainedMarksInput === "").length;
    const passed = students.filter((s) => {
      const marks = Number(s.obtainedMarksInput);
      return !isNaN(marks) && marks >= passingMarks;
    }).length;
    const failed = students.filter((s) => {
      const marks = Number(s.obtainedMarksInput);
      return !isNaN(marks) && marks < passingMarks && s.obtainedMarksInput !== "";
    }).length;
    const averagePercentage = (() => {
      const enteredResults = students.filter((s) => s.obtainedMarksInput !== "");
      if (enteredResults.length === 0) return 0;
      const total = enteredResults.reduce((sum, s) => {
        const marks = Number(s.obtainedMarksInput);
        return sum + (marks / totalMarks) * 100;
      }, 0);
      return Math.round((total / enteredResults.length) * 100) / 100;
    })();

    return { totalStudents, resultsEntered, pendingResults, passed, failed, averagePercentage };
  }, [students, totalMarks, passingMarks]);

  // Update marks for a student
  const updateMarks = useCallback((studentId: string, value: string) => {
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, obtainedMarksInput: value } : s)));
  }, []);

  // Update remarks for a student
  const updateRemarks = useCallback((studentId: string, value: string) => {
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, remarksInput: value } : s)));
  }, []);

  // Validate marks
  const validateMarks = (marks: string): string | null => {
    if (marks === "") return null;
    const num = Number(marks);
    if (isNaN(num)) return "Invalid number";
    if (num < 0) return "Cannot be negative";
    if (num > totalMarks) return `Cannot exceed ${totalMarks}`;
    return null;
  };

  // Save results
  const handleSave = async () => {
    if (!selectedSubjectId) {
      setError("Please select a subject first");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) throw new Error("You must be logged in");

      const { data: profileData } = await supabase
        .from("profiles")
        .select("school_id, role")
        .eq("id", userId)
        .single();

      if (!profileData || profileData.role !== "admin") {
        throw new Error("Only admins can save results");
      }

      const schoolId = profileData.school_id;
      const resultsToSave = filteredStudents
        .filter((s) => s.obtainedMarksInput !== "")
        .map((s) => {
          const obtained = Number(s.obtainedMarksInput);
          const { percentage, grade, status } = calculateResult(obtained, totalMarks, passingMarks);
          return {
            id: s.result?.id,
            school_id: schoolId,
            exam_id: selectedExamId,
            exam_subject_id: selectedSubjectId,
            student_id: s.id,
            class_id: selectedClassId,
            section_id: selectedSectionId || null,
            obtained_marks: obtained,
            total_marks: totalMarks,
            passing_marks: passingMarks,
            percentage,
            grade,
            status,
            remarks: s.remarksInput || null,
          };
        });

      if (resultsToSave.length === 0) {
        setError("No marks to save");
        return;
      }

      // Validate all marks
      for (const result of resultsToSave) {
        if (result.obtained_marks < 0 || result.obtained_marks > totalMarks) {
          setError(`Invalid marks for student. Must be between 0 and ${totalMarks}`);
          return;
        }
      }

      // Upsert results
      const { error: upsertError } = await supabase.from("results").upsert(resultsToSave, {
        onConflict: "school_id,exam_subject_id,student_id",
        ignoreDuplicates: false,
      });

      if (upsertError) throw upsertError;

      setSuccess(`Successfully saved ${resultsToSave.length} result(s)`);

      // Reload to get updated data
      const studentIds = filteredStudents.map((s) => s.id);
      const { data: updatedResults } = await supabase
        .from("results")
        .select("*")
        .eq("exam_subject_id", selectedSubjectId)
        .in("student_id", studentIds);

      if (updatedResults) {
        setStudents((prev) =>
          prev.map((s) => {
            const updated = updatedResults.find((r) => r.student_id === s.id);
            return updated
              ? {
                  ...s,
                  result: updated,
                  obtainedMarksInput: String(updated.obtained_marks),
                  remarksInput: updated.remarks || "",
                }
              : s;
          })
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save results";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setGradeFilter("all");
  };

  return (
    <div className="space-y-6">
      {/* Selection Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Exam Selection */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Select Exam <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedExamId}
            onChange={(e) => handleExamChange(e.target.value)}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Choose Exam</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.name} ({exam.exam_type.replace("_", " ")})
              </option>
            ))}
          </select>
        </div>

        {/* Subject Selection */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Select Subject <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedSubjectId}
            onChange={(e) => handleSubjectChange(e.target.value)}
            disabled={!selectedExamId}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
          >
            <option value="">Choose Subject</option>
            {examSubjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.subjects.code} - {subject.subjects.name}
              </option>
            ))}
          </select>
        </div>

        {/* Total Marks Display */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Total Marks</label>
          <div className="flex h-11 items-center rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700">
            {selectedSubject ? totalMarks : "-"}
          </div>
        </div>

        {/* Passing Marks Display */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Passing Marks</label>
          <div className="flex h-11 items-center rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700">
            {selectedSubject ? passingMarks : "-"}
          </div>
        </div>
      </div>

      {/* Stats */}
      {selectedSubjectId && <ResultStats {...stats} />}

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-3 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle size={18} className="mt-0.5 shrink-0" />
          <p>{success}</p>
        </div>
      )}

      {/* Filters */}
      {selectedSubjectId && (
        <ResultFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          gradeFilter={gradeFilter}
          onGradeChange={setGradeFilter}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      )}

      {/* Student Table */}
      {selectedSubjectId && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-blue-600" />
              <span className="ml-3 text-slate-600">Loading students...</span>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-500">No students found for the selected criteria.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
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
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Remarks
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((student, index) => {
                      const marks = student.obtainedMarksInput;
                      const marksNum = Number(marks);
                      const percentage = marks ? Math.round((marksNum / totalMarks) * 100 * 100) / 100 : 0;
                      const grade = marks
                        ? marksNum >= 90
                          ? "A+"
                          : marksNum >= 80
                          ? "A"
                          : marksNum >= 70
                          ? "B"
                          : marksNum >= 60
                          ? "C"
                          : marksNum >= 50
                          ? "D"
                          : "F"
                        : "-";
                      const status = marks ? (marksNum >= passingMarks ? "pass" : "fail") : null;
                      const validationError = validateMarks(marks);

                      return (
                        <tr key={student.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {student.roll_number || index + 1}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-800">
                            {student.student_id}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">{student.full_name}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={0}
                                max={totalMarks}
                                step="0.5"
                                value={student.obtainedMarksInput}
                                onChange={(e) => updateMarks(student.id, e.target.value)}
                                placeholder="0"
                                className={`h-9 w-24 rounded-lg border bg-white px-3 text-sm text-right text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                                  validationError ? "border-red-300" : "border-slate-200"
                                }`}
                              />
                              <span className="text-sm text-slate-400">/ {totalMarks}</span>
                            </div>
                            {validationError && (
                              <p className="mt-1 text-xs text-red-600">{validationError}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {marks ? `${percentage}%` : "-"}
                          </td>
                          <td className="px-4 py-3">
                            {marks ? (
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                                  grade === "A+"
                                    ? "bg-emerald-100 text-emerald-800 ring-emerald-600/20"
                                    : grade === "A"
                                    ? "bg-green-100 text-green-800 ring-green-600/20"
                                    : grade === "B"
                                    ? "bg-blue-100 text-blue-800 ring-blue-600/20"
                                    : grade === "C"
                                    ? "bg-amber-100 text-amber-800 ring-amber-600/20"
                                    : grade === "D"
                                    ? "bg-orange-100 text-orange-800 ring-orange-600/20"
                                    : "bg-red-100 text-red-800 ring-red-600/20"
                                }`}
                              >
                                {grade}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {status ? (
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                                  status === "pass"
                                    ? "bg-emerald-100 text-emerald-800 ring-emerald-600/20"
                                    : "bg-red-100 text-red-800 ring-red-600/20"
                                }`}
                              >
                                {status === "pass" ? "Pass" : "Fail"}
                              </span>
                            ) : (
                              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={student.remarksInput}
                              onChange={(e) => updateRemarks(student.id, e.target.value)}
                              placeholder="Add remark..."
                              className="h-9 w-full max-w-[150px] rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-3">
                <p className="text-sm text-slate-500">
                  {stats.resultsEntered} of {stats.totalStudents} results entered
                </p>
                <button
                  onClick={handleSave}
                  disabled={saving || stats.resultsEntered === 0}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Results
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Empty State */}
      {!selectedSubjectId && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-slate-400"
            >
              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
              <path d="M14 2v4a2 2 0 0 0 2 2h4" />
              <path d="m9 15 2 2 4-4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-700">Select Exam & Subject</h3>
          <p className="mt-1 text-sm text-slate-500">
            Choose an exam and subject above to start entering student marks.
          </p>
        </div>
      )}
    </div>
  );
}
