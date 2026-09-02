"use client";

import { useState, useMemo } from "react";
import { X, Users, BookOpen, Layers, Hash, Award } from "lucide-react";

interface Teacher {
  id: string;
  full_name: string;
}

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

interface TeacherAssignmentFormProps {
  assignment?: {
    id?: string;
    teacher_id?: string;
    subject_id?: string;
    class_id?: string;
    section_id?: string;
    is_class_teacher?: boolean;
  } | null;
  teachers: Teacher[];
  subjects: Subject[];
  classes: Class[];
  sections: Section[];
  onSubmit: (data: AssignmentFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface AssignmentFormData {
  teacher_id: string;
  subject_id: string;
  class_id: string;
  section_id: string;
  is_class_teacher: boolean;
}

const initialFormData: AssignmentFormData = {
  teacher_id: "",
  subject_id: "",
  class_id: "",
  section_id: "",
  is_class_teacher: false,
};

function buildInitialFormData(assignment?: TeacherAssignmentFormProps["assignment"]): AssignmentFormData {
  if (!assignment) return initialFormData;
  return {
    teacher_id: assignment.teacher_id || "",
    subject_id: assignment.subject_id || "",
    class_id: assignment.class_id || "",
    section_id: assignment.section_id || "",
    is_class_teacher: assignment.is_class_teacher || false,
  };
}

export function TeacherAssignmentForm({
  assignment,
  teachers,
  subjects,
  classes,
  sections,
  onSubmit,
  onCancel,
  isLoading = false,
}: TeacherAssignmentFormProps) {
  const [formData, setFormData] = useState<AssignmentFormData>(() => buildInitialFormData(assignment));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classTeacherConflict, setClassTeacherConflict] = useState<string | null>(null);

  const isEditing = !!assignment?.id;

  // Filter sections based on selected class
  const filteredSections = useMemo(() => {
    if (!formData.class_id) return [];
    return sections.filter((s) => s.class_id === formData.class_id);
  }, [formData.class_id, sections]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.teacher_id) {
      newErrors.teacher_id = "Please select a teacher";
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
    setClassTeacherConflict(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error: unknown) {
      console.error("Form submission error:", error);
      if (error && typeof error === "object" && "message" in error) {
        const errorMessage = (error as { message: string }).message;
        if (errorMessage.includes("class teacher")) {
          setClassTeacherConflict(errorMessage);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof AssignmentFormData, value: string | boolean) => {
    if (field === "class_id") {
      // Reset section when class changes
      setFormData((prev) => ({ ...prev, class_id: value as string, section_id: "" }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    if (classTeacherConflict) {
      setClassTeacherConflict(null);
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
              {isEditing ? "Update assignment details" : "Assign a teacher to a subject, class, and section"}
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
            {/* Class Teacher Conflict Warning */}
            {classTeacherConflict && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-700">{classTeacherConflict}</p>
              </div>
            )}

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

            {/* Class Teacher Toggle */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Award size={20} className="text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">Assign as Class Teacher</p>
                    <p className="text-xs text-slate-500">
                      Class teachers have additional responsibilities for the section
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_class_teacher}
                    onChange={(e) => handleChange("is_class_teacher", e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-100"></div>
                </label>
              </div>
            </div>
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
