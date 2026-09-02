"use client";

import { useState } from "react";
import { X, BookOpen, FileText } from "lucide-react";

interface ClassItem {
  id?: string;
  name?: string;
  description?: string | null;
  is_active?: boolean;
}

interface ClassFormProps {
  classItem?: ClassItem | null;
  onSubmit: (data: ClassFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface ClassFormData {
  name: string;
  description: string;
  is_active: boolean;
}

const initialFormData: ClassFormData = {
  name: "",
  description: "",
  is_active: true,
};

function buildInitialFormData(classItem?: ClassItem | null): ClassFormData {
  if (!classItem) return initialFormData;
  return {
    name: classItem.name || "",
    description: classItem.description || "",
    is_active: classItem.is_active ?? true,
  };
}

export function ClassForm({
  classItem,
  onSubmit,
  onCancel,
  isLoading = false,
}: ClassFormProps) {
  const [formData, setFormData] = useState<ClassFormData>(() => buildInitialFormData(classItem));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!classItem?.id;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Class name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Class name must be at least 2 characters";
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

  const handleChange = (field: keyof ClassFormData, value: string | boolean) => {
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
              {isEditing ? "Edit Class" : "Add New Class"}
            </h2>
            <p className="text-sm text-slate-500">
              {isEditing ? "Update class information" : "Fill in the details to add a new class"}
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
            {/* Class Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600">
                Class Name <span className="text-red-500">*</span>
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
                  placeholder="e.g., Grade 7, Class 10"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name}</p>
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
                  placeholder="Optional description for this class"
                />
              </div>
            </div>

            {/* Status (only for editing) */}
            {isEditing && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600">
                  Status
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={formData.is_active}
                      onChange={() => handleChange("is_active", true)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-600">Active</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={!formData.is_active}
                      onChange={() => handleChange("is_active", false)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-600">Inactive</span>
                  </label>
                </div>
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
                ? "Update Class"
                : "Add Class"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
