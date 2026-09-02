"use client";

import { useState, useMemo } from "react";
import { X, BookOpen, Hash, FileText } from "lucide-react";

interface Subject {
  id?: string;
  name?: string;
  code?: string;
  description?: string | null;
  is_active?: boolean;
}

interface SubjectFormProps {
  subject?: Subject | null;
  onSubmit: (data: SubjectFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface SubjectFormData {
  name: string;
  code: string;
  description: string;
}

const initialFormData: SubjectFormData = {
  name: "",
  code: "",
  description: "",
};

function buildInitialFormData(subject?: Subject | null): SubjectFormData {
  if (!subject) return initialFormData;
  return {
    name: subject.name || "",
    code: subject.code || "",
    description: subject.description || "",
  };
}

export function SubjectForm({
  subject,
  onSubmit,
  onCancel,
  isLoading = false,
}: SubjectFormProps) {
  const [formData, setFormData] = useState<SubjectFormData>(() => buildInitialFormData(subject));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!subject?.id;

  const subjectInitialData = useMemo(() => {
    if (!subject) return null;
    return {
      name: subject.name || "",
      code: subject.code || "",
      description: subject.description || "",
    };
  }, [subject]);

  if (isEditing && subjectInitialData) {
    setFormData(subjectInitialData);
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Subject name is required";
    }
    if (!formData.code.trim()) {
      newErrors.code = "Subject code is required";
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

  const handleChange = (field: keyof SubjectFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              {isEditing ? "Edit Subject" : "Add New Subject"}
            </h2>
            <p className="text-sm text-slate-500">
              {isEditing ? "Update subject information" : "Fill in the details to add a new subject"}
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
            {/* Subject Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600">
                Subject Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <BookOpen
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className={`h-10 w-full rounded-lg border pl-10 pr-3 text-sm focus:outline-none focus:ring-2 ${
                    errors.name
                      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border-slate-200 focus:border-blue-300 focus:ring-blue-100"
                  }`}
                  placeholder="e.g., Mathematics"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Subject Code */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600">
                Subject Code <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Hash
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleChange("code", e.target.value)}
                  className={`h-10 w-full rounded-lg border pl-10 pr-3 text-sm focus:outline-none focus:ring-2 ${
                    errors.code
                      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border-slate-200 focus:border-blue-300 focus:ring-blue-100"
                  }`}
                  placeholder="e.g., MATH101"
                />
              </div>
              {errors.code && (
                <p className="mt-1 text-xs text-red-500">{errors.code}</p>
              )}
              <p className="mt-1 text-xs text-slate-400">
                Must be unique within your school
              </p>
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
                  placeholder="Optional description of the subject"
                />
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
                ? "Update Subject"
                : "Add Subject"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
