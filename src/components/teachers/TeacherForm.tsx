"use client";

import { useState, useEffect } from "react";
import { X, User, Mail, Phone, Calendar, BookOpen, MapPin, Award, Briefcase } from "lucide-react";

interface Teacher {
  id?: string;
  full_name?: string;
  email?: string;
  phone?: string | null;
  role?: string;
  is_active?: boolean;
  created_at?: string;
  employee_id?: string | null;
  joining_date?: string | null;
  qualification?: string | null;
  specialization?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  address?: string | null;
}

interface TeacherFormProps {
  teacher?: Teacher | null;
  onSubmit: (data: TeacherFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  serverError?: string | null;
}

export interface TeacherFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  date_of_birth: string;
  joining_date: string;
  qualification: string;
  specialization: string;
  address: string;
  employee_id: string;
  is_active: boolean;
  password?: string;
  class_ids: string[];
  subject_ids: string[];
}

const initialFormData: TeacherFormData = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  gender: "",
  date_of_birth: "",
  joining_date: new Date().toISOString().split("T")[0],
  qualification: "",
  specialization: "",
  address: "",
  employee_id: "",
  is_active: true,
  password: "",
  class_ids: [],
  subject_ids: [],
};

function buildInitialFormData(teacher?: Teacher | null): TeacherFormData {
  if (!teacher) return initialFormData;
  const nameParts = teacher.full_name?.split(" ") || ["", ""];
  return {
    first_name: nameParts[0] || "",
    last_name: nameParts.slice(1).join(" ") || "",
    email: teacher.email || "",
    phone: teacher.phone || "",
    gender: teacher.gender || "",
    date_of_birth: teacher.date_of_birth || "",
    joining_date: teacher.joining_date || new Date().toISOString().split("T")[0],
    qualification: teacher.qualification || "",
    specialization: teacher.specialization || "",
    address: teacher.address || "",
    employee_id: teacher.employee_id || "",
    is_active: teacher.is_active ?? true,
    class_ids: [],
    subject_ids: [],
  };
}

export function TeacherForm({
  teacher,
  onSubmit,
  onCancel,
  isLoading = false,
  serverError = null,
}: TeacherFormProps) {
  const [formData, setFormData] = useState<TeacherFormData>(() => buildInitialFormData(teacher));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!teacher?.id;

  useEffect(() => {
    if (teacher?.id) {
      const nameParts = teacher.full_name?.split(" ") || ["", ""];
      setFormData({
        first_name: nameParts[0] || "",
        last_name: nameParts.slice(1).join(" ") || "",
        email: teacher.email || "",
        phone: teacher.phone || "",
        gender: teacher.gender || "",
        date_of_birth: teacher.date_of_birth || "",
        joining_date: teacher.joining_date || new Date().toISOString().split("T")[0],
        qualification: teacher.qualification || "",
        specialization: teacher.specialization || "",
        address: teacher.address || "",
        employee_id: teacher.employee_id || "",
        is_active: teacher.is_active ?? true,
        class_ids: [],
        subject_ids: [],
      });
    }
  }, [teacher?.id]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (formData.phone.replace(/\D/g, "").length < 10) {
      newErrors.phone = "Please enter a valid phone number";
    }
    if (!formData.gender) {
      newErrors.gender = "Please select a gender";
    }
    if (!formData.joining_date) {
      newErrors.joining_date = "Joining date is required";
    }
    if (!isEditing) {
      if (!formData.password || formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
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

  const handleChange = (field: keyof TeacherFormData, value: string | boolean | string[]) => {
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
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              {isEditing ? "Edit Teacher" : "Add New Teacher"}
            </h2>
            <p className="text-sm text-slate-500">
              {isEditing ? "Update teacher information" : "Fill in the details to add a new teacher"}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {serverError && (
          <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <User size={16} className="text-blue-600" />
                Personal Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => handleChange("first_name", e.target.value)}
                    className={`h-10 w-full rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 ${
                      errors.first_name
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-slate-200 focus:border-blue-300 focus:ring-blue-100"
                    }`}
                    placeholder="Enter first name"
                  />
                  {errors.first_name && (
                    <p className="mt-1 text-xs text-red-500">{errors.first_name}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => handleChange("last_name", e.target.value)}
                    className={`h-10 w-full rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 ${
                      errors.last_name
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-slate-200 focus:border-blue-300 focus:ring-blue-100"
                    }`}
                    placeholder="Enter last name"
                  />
                  {errors.last_name && (
                    <p className="mt-1 text-xs text-red-500">{errors.last_name}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleChange("gender", e.target.value)}
                    className={`h-10 w-full rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 ${
                      errors.gender
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-slate-200 focus:border-blue-300 focus:ring-blue-100"
                    }`}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-xs text-red-500">{errors.gender}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleChange("date_of_birth", e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Mail size={16} className="text-emerald-600" />
                Contact Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Email <span className="text-red-500">*</span>
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
                      placeholder="teacher@school.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Phone <span className="text-red-500">*</span>
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
                      className={`h-10 w-full rounded-lg border pl-10 pr-3 text-sm focus:outline-none focus:ring-2 ${
                        errors.phone
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : "border-slate-200 focus:border-blue-300 focus:ring-blue-100"
                      }`}
                      placeholder="+92 300 1234567"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
                  )}
              </div>

              {!isEditing && (
                <div className="mt-4">
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleChange("password", e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Set a login password"
                  />
                </div>
              )}
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

            {/* Professional Information */}
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Briefcase size={16} className="text-amber-600" />
                Professional Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={formData.employee_id}
                    onChange={(e) => handleChange("employee_id", e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="EMP-001"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Joining Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="date"
                      value={formData.joining_date}
                      onChange={(e) => handleChange("joining_date", e.target.value)}
                      className={`h-10 w-full rounded-lg border pl-10 pr-3 text-sm focus:outline-none focus:ring-2 ${
                        errors.joining_date
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : "border-slate-200 focus:border-blue-300 focus:ring-blue-100"
                      }`}
                    />
                  </div>
                  {errors.joining_date && (
                    <p className="mt-1 text-xs text-red-500">{errors.joining_date}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Qualification
                  </label>
                  <div className="relative">
                    <Award
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      value={formData.qualification}
                      onChange={(e) => handleChange("qualification", e.target.value)}
                      className="h-10 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      placeholder="M.Ed, B.Sc, etc."
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Specialization
                  </label>
                  <div className="relative">
                    <BookOpen
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      value={formData.specialization}
                      onChange={(e) => handleChange("specialization", e.target.value)}
                      className="h-10 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      placeholder="Mathematics, Science, etc."
                    />
                  </div>
                </div>
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
                ? "Update Teacher"
                : "Add Teacher"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
