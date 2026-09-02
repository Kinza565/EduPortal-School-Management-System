"use client";

import { useState } from "react";
import { X, Users, Phone, Mail, MapPin, Briefcase, Link } from "lucide-react";

interface Student {
  id: string;
  full_name: string;
  student_id: string;
  roll_number: string | null;
}

interface ParentFormProps {
  parent?: {
    id?: string;
    full_name?: string;
    relationship?: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    occupation?: string | null;
    is_active?: boolean;
  } | null;
  students: Student[];
  linkedStudentIds: string[];
  onSubmit: (data: ParentFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface ParentFormData {
  full_name: string;
  relationship: string;
  phone: string;
  email: string;
  address: string;
  occupation: string;
  is_active: boolean;
  student_ids: string[];
}

const initialFormData: ParentFormData = {
  full_name: "",
  relationship: "father",
  phone: "",
  email: "",
  address: "",
  occupation: "",
  is_active: true,
  student_ids: [],
};

function buildInitialFormData(parent?: ParentFormProps["parent"], linkedIds: string[] = []): ParentFormData {
  if (!parent) return { ...initialFormData, student_ids: linkedIds };
  return {
    full_name: parent.full_name || "",
    relationship: parent.relationship || "father",
    phone: parent.phone || "",
    email: parent.email || "",
    address: parent.address || "",
    occupation: parent.occupation || "",
    is_active: parent.is_active ?? true,
    student_ids: linkedIds,
  };
}

export function ParentForm({
  parent,
  students,
  linkedStudentIds,
  onSubmit,
  onCancel,
  isLoading = false,
}: ParentFormProps) {
  const [formData, setFormData] = useState<ParentFormData>(() => buildInitialFormData(parent, linkedStudentIds));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!parent?.id;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Parent name is required";
    }
    if (!formData.relationship) {
      newErrors.relationship = "Please select a relationship";
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
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

  const handleChange = (field: keyof ParentFormData, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const toggleStudent = (studentId: string) => {
    setFormData((prev) => ({
      ...prev,
      student_ids: prev.student_ids.includes(studentId)
        ? prev.student_ids.filter((id) => id !== studentId)
        : [...prev.student_ids, studentId],
    }));
  };

  const linkedCount = formData.student_ids.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              {isEditing ? "Edit Parent" : "Add New Parent"}
            </h2>
            <p className="text-sm text-slate-500">
              {isEditing ? "Update parent information" : "Fill in the details to add a new parent"}
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
            {/* Personal Information */}
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Users size={16} className="text-blue-600" />
                Personal Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Users
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => handleChange("full_name", e.target.value)}
                      className={`h-10 w-full rounded-lg border pl-10 pr-3 text-sm focus:outline-none focus:ring-2 ${
                        errors.full_name
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : "border-slate-200 focus:border-blue-300 focus:ring-blue-100"
                      }`}
                      placeholder="Enter full name"
                    />
                  </div>
                  {errors.full_name && (
                    <p className="mt-1 text-xs text-red-500">{errors.full_name}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Relationship <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.relationship}
                    onChange={(e) => handleChange("relationship", e.target.value)}
                    className={`h-10 w-full rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 ${
                      errors.relationship
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-slate-200 focus:border-blue-300 focus:ring-blue-100"
                    }`}
                  >
                    <option value="father">Father</option>
                    <option value="mother">Mother</option>
                    <option value="guardian">Guardian</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.relationship && (
                    <p className="mt-1 text-xs text-red-500">{errors.relationship}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Phone size={16} className="text-emerald-600" />
                Contact Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      className="h-10 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      placeholder="+92 300 1234567"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Email
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className={`h-10 w-full rounded-lg border pl-10 pr-3 text-sm focus:outline-none focus:ring-2 ${
                        errors.email
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : "border-slate-200 focus:border-blue-300 focus:ring-blue-100"
                      }`}
                      placeholder="parent@email.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-medium text-slate-600">
                  Address
                </label>
                <div className="relative">
                  <MapPin
                    size={16}
                    className="absolute left-3 top-3 text-slate-400"
                  />
                  <textarea
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 pl-10 pr-3 py-2 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Enter address"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Briefcase size={16} className="text-amber-600" />
                Additional Information
              </h3>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600">
                  Occupation
                </label>
                <input
                  type="text"
                  value={formData.occupation}
                  onChange={(e) => handleChange("occupation", e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter occupation"
                />
              </div>
            </div>

            {/* Link Students */}
            {students.length > 0 && (
              <div>
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Link size={16} className="text-purple-600" />
                  Link Students {linkedCount > 0 && <span className="text-xs font-normal text-slate-500">({linkedCount} selected)</span>}
                </h3>
                <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200">
                  <div className="divide-y divide-slate-100">
                    {students.map((student) => (
                      <label
                        key={student.id}
                        className="flex cursor-pointer items-center gap-3 p-3 transition-colors hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={formData.student_ids.includes(student.id)}
                          onChange={() => toggleStudent(student.id)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-700">{student.full_name}</p>
                          <p className="text-xs text-slate-400">
                            {student.student_id} {student.roll_number && `• Roll #${student.roll_number}`}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
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
                ? "Update Parent"
                : "Add Parent"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
