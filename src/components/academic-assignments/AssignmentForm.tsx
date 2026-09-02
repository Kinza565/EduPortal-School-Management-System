"use client";

import { useState, useMemo } from "react";
import { X, BookOpen, Layers, Hash, Users, Calendar, FileText, Type } from "lucide-react";

interface Subject {
  id: string;
  name: string;
  code: string;
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

interface Teacher {
  id: string;
  full_name: string;
}

interface AssignmentFormProps {
  assignment?: {
    id?: string;
    title?: string;
    description?: string | null;
    subject_id?: string;
    class_id?: string;
    section_id?: string;
    teacher_id?: string;
    assigned_date?: string;
    due_date?: string;
    status?: string;
  } | null;
  subjects: Subject[];
  classes: Class[];
  sections: Section[];
  teachers: Teacher[];
  onSubmit: (data: AssignmentFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface AssignmentFormData {
  title: string;
  description: string;
  subject_id: string;
  class_id: string;
  section_id: string;
  teacher_id: string;
  assigned_date: string;
  due_date: string;
  status: string;
}

const today = new Date().toISOString().split("T")[0];

const initialFormData: AssignmentFormData = {
  title: "",
  description: "",
  subject_id: "",
  class_id: "",
  section_id: "",
  teacher_id: "",
  assigned_date: today,
  due_date: "",
  status: "active",
};

function buildInitialFormData(assignment?: AssignmentFormProps["assignment"]): AssignmentFormData {
  if (!assignment) return initialFormData;
  return {
    title: assignment.title || "",
    description: assignment.description || "",
    subject_id: assignment.subject_id || "",
    class_id: assignment.class_id || "",
    section_id: assignment.section_id || "",
    teacher_id: assignment.teacher_id || "",
    assigned_date: assignment.assigned_date || today,
    due_date: assignment.due_date || "",
    status: assignment.status || "active",
  };
}

export function AssignmentForm({
  assignment,
  subjects,
  classes,
  sections,
  teachers,
  onSubmit,
  onCancel,
  isLoading = false,
}: AssignmentFormProps) {
  const [formData, setFormData] = useState<AssignmentFormData>(() => buildInitialFormData(assignment));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!assignment?.id;

  // Filter sections based on selected class
  const filteredSections = useMemo(() => {
    if (!formData.class_id) return [];
    return sections.filter((s) => s.class_id === formData.class_id);
  }, [formData.class_id, sections]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Assignment title is required";
    }
    if (!formData.subject_id) {
      newErrors.subject_id = "Please select a subject";
    }
    if (!formData.class_id) {
      newErrors.class_id = "Please select a class";
    }
    if (!formData.section_id) {
      newErrors.section_id = "Please select a section";
    }
    if (!formData.teacher_id) {
      newErrors.teacher_id = "Please select a teacher";
    }
    if (!formData.assigned_date) {
      newErrors.assigned_date = "Assigned date is required";
    }
    if (!formData.due_date) {
      newErrors.due_date = "Due date is required";
    }
    if (formData.assigned_date && formData.due_date && formData.due_date < formData.assigned_date) {
      newErrors.due_date = "Due date cannot be before assigned date";
    }

    // Validate section belongs to class
    if (formData.section_id && formData.class_id) {
      const section = sections.find((s) => s.id === formData.section_id);
      if (section && section.class_id !== formData.class_id) {
        newErrors.section_id = "Selected section does not belong to the selected class";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof AssignmentFormData, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Reset section when class changes
      if (field === "class_id") {
        updated.section_id = "";
      }
      return updated;
    });
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              {isEditing ? "Edit Assignment" : "Create New Assignment"}
            </h2>
            <p className="text-sm text-slate-500">
              {isEditing ? "Update assignment details" : "Create homework or academic assignment"}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600">
                Title <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Type
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  className={`h-10 w-full rounded-lg border pl-10 pr-3 text-sm focus:outline-none focus:ring-2 ${
                    errors.title
                      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border-slate-200 focus:border-blue-300 focus:ring-blue-100"
                  }`}
                  placeholder="Enter assignment title"
                />
              </div>
              {errors.title && (
                <p className="mt-1 text-xs text-red-500">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600">
                Description
              </label>
              <div className="relative">
                <FileText
                  size={16}
                  className="absolute left-3 top-3 text-slate-400"
                />
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 pl-10 pr-3 py-2 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter assignment description"
                />
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600">
                Subject <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <BookOpen
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <select
                  value={formData.subject_id}
                  onChange={(e) => handleChange("subject_id", e.target.value)}
                  className={`h-10 w-full rounded-lg border pl-10 pr-3 text-sm focus:outline-none focus:ring-2 ${
                    errors.subject_id
                      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border-slate-200 focus:border-blue-300 focus:ring-blue-100"
                  }`}
                >
                  <option value="">Select subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </option>
                  ))}
                </select>
              </div>
              {errors.subject_id && (
                <p className="mt-1 text-xs text-red-500">{errors.subject_id}</p>
              )}
            </div>

            {/* Class */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600">
                Class <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Layers
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <select
                  value={formData.class_id}
                  onChange={(e) => handleChange("class_id", e.target.value)}
                  className={`h-10 w-full rounded-lg border pl-10 pr-3 text-sm focus:outline-none focus:ring-2 ${
                    errors.class_id
                      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border-slate-200 focus:border-blue-300 focus:ring-blue-100"
                  }`}
                >
                  <option value="">Select class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
              {errors.class_id && (
                <p className="mt-1 text-xs text-red-500">{errors.class_id}</p>
              )}
            </div>

            {/* Section */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600">
                Section <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Hash
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <select
                  value={formData.section_id}
                  onChange={(e) => handleChange("section_id", e.target.value)}
                  disabled={!formData.class_id}
                  className={`h-10 w-full rounded-lg border pl-10 pr-3 text-sm focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                    errors.section_id
                      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border-slate-200 focus:border-blue-300 focus:ring-blue-100"
                  }`}
                >
                  <option value="">
                    {formData.class_id ? "Select section" : "Select a class first"}
                  </option>
                  {filteredSections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
              </div>
              {errors.section_id && (
                <p className="mt-1 text-xs text-red-500">{errors.section_id}</p>
              )}
            </div>

            {/* Teacher */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600">
                Teacher <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Users
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <select
                  value={formData.teacher_id}
                  onChange={(e) => handleChange("teacher_id", e.target.value)}
                  className={`h-10 w-full rounded-lg border pl-10 pr-3 text-sm focus:outline-none focus:ring-2 ${
                    errors.teacher_id
                      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border-slate-200 focus:border-blue-300 focus:ring-blue-100"
                  }`}
                >
                  <option value="">Select teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.full_name}
                    </option>
                  ))}
                </select>
              </div>
              {errors.teacher_id && (
                <p className="mt-1 text-xs text-red-500">{errors.teacher_id}</p>
              )}
            </div>

            {/* Dates */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600">
                  Assigned Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="date"
                    value={formData.assigned_date}
                    onChange={(e) => handleChange("assigned_date", e.target.value)}
                    className={`h-10 w-full rounded-lg border pl-10 pr-3 text-sm focus:outline-none focus:ring-2 ${
                      errors.assigned_date
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-slate-200 focus:border-blue-300 focus:ring-blue-100"
                    }`}
                  />
                </div>
                {errors.assigned_date && (
                  <p className="mt-1 text-xs text-red-500">{errors.assigned_date}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => handleChange("due_date", e.target.value)}
                    className={`h-10 w-full rounded-lg border pl-10 pr-3 text-sm focus:outline-none focus:ring-2 ${
                      errors.due_date
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-slate-200 focus:border-blue-300 focus:ring-blue-100"
                    }`}
                  />
                </div>
                {errors.due_date && (
                  <p className="mt-1 text-xs text-red-500">{errors.due_date}</p>
                )}
              </div>
            </div>

            {/* Status (only for editing) */}
            {isEditing && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? "Saving..."
                : isEditing
                ? "Update Assignment"
                : "Create Assignment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
