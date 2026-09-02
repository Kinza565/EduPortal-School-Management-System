"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, AlertCircle, Plus, Trash2 } from "lucide-react";
import type { Subject, Profile } from "@/types/database";

interface ExamSubjectFormProps {
  examId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface SubjectEntry {
  id?: string;
  subject_id: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  total_marks: number;
  passing_marks: number;
  room_number: string;
  invigilator_id: string;
}

export function ExamSubjectForm({ examId, onClose, onSuccess }: ExamSubjectFormProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [examStartDate, setExamStartDate] = useState<string>("");
  const [examEndDate, setExamEndDate] = useState<string>("");

  const [entries, setEntries] = useState<SubjectEntry[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const supabase = createClient();

        // Get exam details
        const { data: examData, error: examError } = await supabase
          .from("exams")
          .select("start_date, end_date")
          .eq("id", examId)
          .single();

        if (cancelled) return;
        if (examError) throw examError;
        setExamStartDate(examData.start_date);
        setExamEndDate(examData.end_date);

        // Get existing exam subjects
        const { data: existingSubjects, error: existingError } = await supabase
          .from("exam_subjects")
          .select("*")
          .eq("exam_id", examId);

        if (cancelled) return;
        if (existingError) throw existingError;

        if (existingSubjects && existingSubjects.length > 0) {
          setEntries(
            existingSubjects.map((es) => ({
              id: es.id,
              subject_id: es.subject_id,
              exam_date: es.exam_date,
              start_time: es.start_time || "",
              end_time: es.end_time || "",
              total_marks: es.total_marks,
              passing_marks: es.passing_marks,
              room_number: es.room_number || "",
              invigilator_id: es.invigilator_id || "",
            }))
          );
        }

        // Get subjects
        const { data: subjectsData, error: subjectsError } = await supabase
          .from("subjects")
          .select("*")
          .eq("is_active", true)
          .order("name");

        if (cancelled) return;
        if (subjectsError) throw subjectsError;
        setSubjects(subjectsData || []);

        // Get teachers
        const { data: teachersData, error: teachersError } = await supabase
          .from("profiles")
          .select("*")
          .eq("role", "teacher")
          .eq("is_active", true)
          .order("full_name");

        if (cancelled) return;
        if (teachersError) throw teachersError;
        setTeachers(teachersData || []);
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Failed to load data";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setFetchingData(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [examId]);

  function addEntry() {
    setEntries([
      ...entries,
      {
        subject_id: "",
        exam_date: examStartDate,
        start_time: "09:00",
        end_time: "12:00",
        total_marks: 100,
        passing_marks: 35,
        room_number: "",
        invigilator_id: "",
      },
    ]);
  }

  function removeEntry(index: number) {
    setEntries(entries.filter((_, i) => i !== index));
  }

  function updateEntry(index: number, field: keyof SubjectEntry, value: string | number) {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: value };
    setEntries(updated);
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (entries.length === 0) {
      errors.general = "At least one subject is required";
    }

    entries.forEach((entry, index) => {
      if (!entry.subject_id) {
        errors[`${index}_subject`] = "Subject is required";
      }
      if (!entry.exam_date) {
        errors[`${index}_date`] = "Date is required";
      }
      if (entry.exam_date && (entry.exam_date < examStartDate || entry.exam_date > examEndDate)) {
        errors[`${index}_date`] = "Date must be within exam dates";
      }
      if (entry.start_time && entry.end_time && entry.start_time >= entry.end_time) {
        errors[`${index}_time`] = "End time must be after start time";
      }
      if (entry.total_marks <= 0) {
        errors[`${index}_total`] = "Must be greater than 0";
      }
      if (entry.passing_marks < 0) {
        errors[`${index}_passing`] = "Cannot be negative";
      }
      if (entry.passing_marks > entry.total_marks) {
        errors[`${index}_passing`] = "Cannot exceed total marks";
      }
    });

    // Check for duplicate subjects
    const subjectIds = entries.map((e) => e.subject_id).filter(Boolean);
    const duplicates = subjectIds.filter((id, i) => subjectIds.indexOf(id) !== i);
    if (duplicates.length > 0) {
      errors.duplicate = "Duplicate subjects are not allowed";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    setLoading(true);

    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId) {
        throw new Error("You must be logged in");
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("school_id, role")
        .eq("id", userId)
        .single();

      if (profileError || !profileData) {
        throw new Error("Failed to verify your profile");
      }

      if (profileData.role !== "admin") {
        throw new Error("Only admins can manage exam subjects");
      }

      // Delete existing subjects that are not in the new list
      const existingIds = entries.filter((e) => e.id).map((e) => e.id);
      if (existingIds.length > 0) {
        await supabase
          .from("exam_subjects")
          .delete()
          .eq("exam_id", examId)
          .not("id", "in", `(${existingIds.join(",")})`);
      } else {
        await supabase.from("exam_subjects").delete().eq("exam_id", examId);
      }

      // Upsert entries
      for (const entry of entries) {
        const subjectData = {
          school_id: profileData.school_id,
          exam_id: examId,
          subject_id: entry.subject_id,
          exam_date: entry.exam_date,
          start_time: entry.start_time || null,
          end_time: entry.end_time || null,
          total_marks: entry.total_marks,
          passing_marks: entry.passing_marks,
          room_number: entry.room_number || null,
          invigilator_id: entry.invigilator_id || null,
        };

        if (entry.id) {
          await supabase.from("exam_subjects").update(subjectData).eq("id", entry.id);
        } else {
          await supabase.from("exam_subjects").insert(subjectData);
        }
      }

      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save exam subjects";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (fetchingData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="flex items-center gap-3 rounded-xl bg-white p-6 shadow-xl">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span className="text-slate-600">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-10">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Manage Exam Subjects</h2>
            <p className="mt-1 text-sm text-slate-500">Add subjects and configure their schedules</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error Alert */}
        {(error || validationErrors.general || validationErrors.duplicate) && (
          <div className="mx-6 mt-4 flex items-start gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p>{error || validationErrors.general || validationErrors.duplicate}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {entries.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center">
                <p className="text-sm text-slate-500">
                  No subjects added yet. Click the button below to add subjects.
                </p>
              </div>
            ) : (
              entries.map((entry, index) => (
                <div key={index} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-700">Subject {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => removeEntry(index)}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Subject */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Subject <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={entry.subject_id}
                        onChange={(e) => updateEntry(index, "subject_id", e.target.value)}
                        className={`h-9 w-full rounded-lg border bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                          validationErrors[`${index}_subject`] ? "border-red-300" : "border-slate-200"
                        }`}
                      >
                        <option value="">Select Subject</option>
                        {subjects
                          .filter(
                            (s) => !entries.some((e, i) => i !== index && e.subject_id === s.id)
                          )
                          .map((subject) => (
                            <option key={subject.id} value={subject.id}>
                              {subject.name} ({subject.code})
                            </option>
                          ))}
                      </select>
                      {validationErrors[`${index}_subject`] && (
                        <p className="mt-1 text-xs text-red-600">
                          {validationErrors[`${index}_subject`]}
                        </p>
                      )}
                    </div>

                    {/* Exam Date */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Exam Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={entry.exam_date}
                        min={examStartDate}
                        max={examEndDate}
                        onChange={(e) => updateEntry(index, "exam_date", e.target.value)}
                        className={`h-9 w-full rounded-lg border bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                          validationErrors[`${index}_date`] ? "border-red-300" : "border-slate-200"
                        }`}
                      />
                      {validationErrors[`${index}_date`] && (
                        <p className="mt-1 text-xs text-red-600">
                          {validationErrors[`${index}_date`]}
                        </p>
                      )}
                    </div>

                    {/* Start Time */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={entry.start_time}
                        onChange={(e) => updateEntry(index, "start_time", e.target.value)}
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    {/* End Time */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={entry.end_time}
                        onChange={(e) => updateEntry(index, "end_time", e.target.value)}
                        className={`h-9 w-full rounded-lg border bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                          validationErrors[`${index}_time`] ? "border-red-300" : "border-slate-200"
                        }`}
                      />
                      {validationErrors[`${index}_time`] && (
                        <p className="mt-1 text-xs text-red-600">
                          {validationErrors[`${index}_time`]}
                        </p>
                      )}
                    </div>

                    {/* Total Marks */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Total Marks <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={entry.total_marks}
                        onChange={(e) => updateEntry(index, "total_marks", Number(e.target.value))}
                        min={1}
                        className={`h-9 w-full rounded-lg border bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                          validationErrors[`${index}_total`] ? "border-red-300" : "border-slate-200"
                        }`}
                      />
                      {validationErrors[`${index}_total`] && (
                        <p className="mt-1 text-xs text-red-600">
                          {validationErrors[`${index}_total`]}
                        </p>
                      )}
                    </div>

                    {/* Passing Marks */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Passing Marks <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={entry.passing_marks}
                        onChange={(e) =>
                          updateEntry(index, "passing_marks", Number(e.target.value))
                        }
                        min={0}
                        max={entry.total_marks}
                        className={`h-9 w-full rounded-lg border bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                          validationErrors[`${index}_passing`] ? "border-red-300" : "border-slate-200"
                        }`}
                      />
                      {validationErrors[`${index}_passing`] && (
                        <p className="mt-1 text-xs text-red-600">
                          {validationErrors[`${index}_passing`]}
                        </p>
                      )}
                    </div>

                    {/* Room Number */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Room Number
                      </label>
                      <input
                        type="text"
                        value={entry.room_number}
                        onChange={(e) => updateEntry(index, "room_number", e.target.value)}
                        placeholder="e.g., Room 101"
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    {/* Invigilator */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Invigilator
                      </label>
                      <select
                        value={entry.invigilator_id}
                        onChange={(e) => updateEntry(index, "invigilator_id", e.target.value)}
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="">Select Teacher</option>
                        {teachers.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Add Subject Button */}
            <button
              type="button"
              onClick={addEntry}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-4 text-sm font-medium text-slate-500 transition-colors hover:border-blue-300 hover:text-blue-600"
            >
              <Plus size={18} />
              Add Subject
            </button>
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-lg border border-slate-200 px-5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-10 rounded-lg bg-blue-600 px-5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Subjects"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
