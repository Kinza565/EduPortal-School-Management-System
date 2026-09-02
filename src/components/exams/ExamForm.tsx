"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, AlertCircle } from "lucide-react";
import type { Class, Section, Exam, ExamType, ExamStatus } from "@/types/database";

interface ExamFormProps {
  exam?: Exam | null;
  onClose: () => void;
  onSuccess: () => void;
}

const EXAM_TYPES: { value: ExamType; label: string }[] = [
  { value: "unit_test", label: "Unit Test" },
  { value: "quarterly", label: "Quarterly" },
  { value: "half_yearly", label: "Half Yearly" },
  { value: "mid_term", label: "Mid Term" },
  { value: "final", label: "Final" },
  { value: "annual", label: "Annual" },
  { value: "other", label: "Other" },
];

const emptyFormData = {
  name: "",
  exam_type: "mid_term" as ExamType,
  class_id: "",
  section_id: "",
  start_date: "",
  end_date: "",
  description: "",
  status: "upcoming" as ExamStatus,
};

export function ExamForm({ exam, onClose, onSuccess }: ExamFormProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState(() => {
    if (exam) {
      return {
        name: exam.name,
        exam_type: exam.exam_type,
        class_id: exam.class_id,
        section_id: exam.section_id || "",
        start_date: exam.start_date,
        end_date: exam.end_date,
        description: exam.description || "",
        status: exam.status,
      };
    }
    return emptyFormData;
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const supabase = createClient();
        const { data: classesData, error: classesError } = await supabase
          .from("classes")
          .select("*")
          .eq("is_active", true)
          .order("name");

        if (cancelled) return;
        if (classesError) throw classesError;
        setClasses(classesData || []);

        if (exam?.class_id) {
          const { data: sectionsData, error: sectionsError } = await supabase
            .from("sections")
            .select("*")
            .eq("class_id", exam.class_id)
            .eq("is_active", true)
            .order("name");

          if (cancelled) return;
          if (sectionsError) throw sectionsError;
          setSections(sectionsData || []);
        }
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
  }, [exam?.class_id]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!formData.class_id) {
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("sections")
          .select("*")
          .eq("class_id", formData.class_id)
          .eq("is_active", true)
          .order("name");

        if (cancelled) return;
        if (error) throw error;
        setSections(data || []);
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch sections:", err);
          setSections([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [formData.class_id]);

  const selectedClassSections = useMemo(() => {
    if (!formData.class_id) return [];
    return sections.filter((s) => s.class_id === formData.class_id);
  }, [sections, formData.class_id]);

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Exam name is required";
    }

    if (!formData.exam_type) {
      errors.exam_type = "Exam type is required";
    }

    if (!formData.class_id) {
      errors.class_id = "Class is required";
    }

    if (!formData.start_date) {
      errors.start_date = "Start date is required";
    }

    if (!formData.end_date) {
      errors.end_date = "End date is required";
    }

    if (formData.start_date && formData.end_date) {
      if (new Date(formData.end_date) < new Date(formData.start_date)) {
        errors.end_date = "End date cannot be before start date";
      }
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
        throw new Error("You must be logged in to create an exam");
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
        throw new Error("Only admins can create exams");
      }

      const examData = {
        school_id: profileData.school_id,
        name: formData.name.trim(),
        exam_type: formData.exam_type,
        class_id: formData.class_id,
        section_id: formData.section_id || null,
        start_date: formData.start_date,
        end_date: formData.end_date,
        description: formData.description.trim() || null,
        status: formData.status,
      };

      if (exam) {
        const { error: updateError } = await supabase
          .from("exams")
          .update(examData)
          .eq("id", exam.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("exams").insert(examData);

        if (insertError) throw insertError;
      }

      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save exam";
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
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-20">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              {exam ? "Edit Exam" : "Create New Exam"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {exam ? "Update exam details" : "Set up a new examination"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 flex items-start gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            {/* Exam Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Exam Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., First Term Examination 2026"
                className={`h-11 w-full rounded-lg border bg-white px-4 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                  validationErrors.name ? "border-red-300" : "border-slate-200"
                }`}
              />
              {validationErrors.name && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.name}</p>
              )}
            </div>

            {/* Exam Type & Class */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Exam Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.exam_type}
                  onChange={(e) =>
                    setFormData({ ...formData, exam_type: e.target.value as ExamType })
                  }
                  className={`h-11 w-full rounded-lg border bg-white px-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                    validationErrors.exam_type ? "border-red-300" : "border-slate-200"
                  }`}
                >
                  {EXAM_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {validationErrors.exam_type && (
                  <p className="mt-1 text-xs text-red-600">{validationErrors.exam_type}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Class <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.class_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      class_id: e.target.value,
                      section_id: "",
                    })
                  }
                  className={`h-11 w-full rounded-lg border bg-white px-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                    validationErrors.class_id ? "border-red-300" : "border-slate-200"
                  }`}
                >
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
                {validationErrors.class_id && (
                  <p className="mt-1 text-xs text-red-600">{validationErrors.class_id}</p>
                )}
              </div>
            </div>

            {/* Section */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Section <span className="text-xs text-slate-400">(Optional)</span>
              </label>
              <select
                value={formData.section_id}
                onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                disabled={!formData.class_id}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">All Sections</option>
                {selectedClassSections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </select>
              {!formData.class_id && (
                <p className="mt-1 text-xs text-slate-400">
                  Select a class first to see available sections
                </p>
              )}
            </div>

            {/* Start & End Date */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className={`h-11 w-full rounded-lg border bg-white px-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                    validationErrors.start_date ? "border-red-300" : "border-slate-200"
                  }`}
                />
                {validationErrors.start_date && (
                  <p className="mt-1 text-xs text-red-600">{validationErrors.start_date}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className={`h-11 w-full rounded-lg border bg-white px-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                    validationErrors.end_date ? "border-red-300" : "border-slate-200"
                  }`}
                />
                {validationErrors.end_date && (
                  <p className="mt-1 text-xs text-red-600">{validationErrors.end_date}</p>
                )}
              </div>
            </div>

            {/* Status (only for edit) */}
            {exam && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as ExamStatus })
                  }
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Description <span className="text-xs text-slate-400">(Optional)</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add any additional notes about this exam..."
                rows={3}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
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
              {loading ? "Saving..." : exam ? "Update Exam" : "Create Exam"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
