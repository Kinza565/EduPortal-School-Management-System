"use client";

import { useState } from "react";
import { X, Layers, BookOpen, Hash } from "lucide-react";

interface ClassOption {
  id: string;
  name: string;
}

interface SectionFormProps {
  section?: SectionFormData | null;
  classes: ClassOption[];
  onSubmit: (data: SectionFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface SectionFormData {
  name: string;
  class_id: string;
  capacity: number;
  is_active: boolean;
}

const initialFormData: SectionFormData = {
  name: "",
  class_id: "",
  capacity: 30,
  is_active: true,
};

function buildInitialFormData(section?: SectionFormData | null): SectionFormData {
  if (!section) return initialFormData;
  return {
    name: section.name || "",
    class_id: section.class_id || "",
    capacity: section.capacity || 30,
    is_active: section.is_active ?? true,
  };
}

export function SectionForm({
  section,
  classes,
  onSubmit,
  onCancel,
  isLoading = false,
}: SectionFormProps) {
  const [formData, setFormData] = useState<SectionFormData>(() => buildInitialFormData(section));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!section?.name;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Section name is required";
    }

    if (!formData.class_id) {
      newErrors.class_id = "Please select a class";
    }

    if (!formData.capacity || formData.capacity < 1) {
      newErrors.capacity = "Capacity must be at least 1";
    } else if (formData.capacity > 200) {
      newErrors.capacity = "Capacity cannot exceed 200";
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

  const handleChange = (field: keyof SectionFormData, value: string | number | boolean) => {
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
              {isEditing ? "Edit Section" : "Add New Section"}
            </h2>
            <p className="text-sm text-slate-500">
              {isEditing ? "Update section information" : "Fill in the details to add a new section"}
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
            {/* Section Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600">
                Section Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Layers
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
                  placeholder="e.g., A, B, C"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Class Selection */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600">
                Class <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <BookOpen
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <select
                  value={formData.class_id}
                  onChange={(e) => handleChange("class_id", e.target.value)}
                  className={`h-10 w-full appearance-none rounded-lg border pl-10 pr-3 text-sm focus:outline-none focus:ring-2 ${
                    errors.class_id
                      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border-slate-200 focus:border-blue-300 focus:ring-blue-100"
                  }`}
                >
                  <option value="">Select a class</option>
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

            {/* Capacity */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600">
                Capacity <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Hash
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => handleChange("capacity", parseInt(e.target.value) || 0)}
                  min={1}
                  max={200}
                  className={`h-10 w-full rounded-lg border pl-10 pr-3 text-sm focus:outline-none focus:ring-2 ${
                    errors.capacity
                      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                      : "border-slate-200 focus:border-blue-300 focus:ring-blue-100"
                  }`}
                  placeholder="30"
                />
              </div>
              {errors.capacity && (
                <p className="mt-1 text-xs text-red-500">{errors.capacity}</p>
              )}
              <p className="mt-1 text-xs text-slate-400">Maximum 200 students per section</p>
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
                ? "Update Section"
                : "Add Section"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
