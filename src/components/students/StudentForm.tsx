"use client";

import { useState } from "react";
import { X, User, BookOpen, Calendar, Hash, MapPin, Phone, Users } from "lucide-react";

interface ClassOption {
  id: string;
  name: string;
}

interface SectionOption {
  id: string;
  name: string;
  class_id: string;
  capacity: number;
  current_students: number;
}

interface StudentFormProps {
  student?: StudentFormData | null;
  classes: ClassOption[];
  sections: SectionOption[];
  onSubmit: (data: StudentFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface StudentFormData {
  student_id: string;
  roll_number: string;
  full_name: string;
  father_name: string;
  guardian_name: string;
  date_of_birth: string;
  gender: string;
  phone: string;
  address: string;
  admission_date: string;
  class_id: string;
  section_id: string;
  status: string;
  photo_url: string;
}

const initialFormData: StudentFormData = {
  student_id: "",
  roll_number: "",
  full_name: "",
  father_name: "",
  guardian_name: "",
  date_of_birth: "",
  gender: "",
  phone: "",
  address: "",
  admission_date: new Date().toISOString().split("T")[0],
  class_id: "",
  section_id: "",
  status: "active",
  photo_url: "",
};

function buildInitialFormData(student?: StudentFormData | null): StudentFormData {
  if (!student) return initialFormData;
  return {
    student_id: student.student_id || "",
    roll_number: student.roll_number || "",
    full_name: student.full_name || "",
    father_name: student.father_name || "",
    guardian_name: student.guardian_name || "",
    date_of_birth: student.date_of_birth || "",
    gender: student.gender || "",
    phone: student.phone || "",
    address: student.address || "",
    admission_date: student.admission_date || new Date().toISOString().split("T")[0],
    class_id: student.class_id || "",
    section_id: student.section_id || "",
    status: student.status || "active",
    photo_url: student.photo_url || "",
  };
}

export function StudentForm({
  student,
  classes,
  sections,
  onSubmit,
  onCancel,
  isLoading = false,
}: StudentFormProps) {
  const [formData, setFormData] = useState<StudentFormData>(() => buildInitialFormData(student));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [capacityWarning, setCapacityWarning] = useState<string | null>(null);

  const isEditing = !!student?.student_id;

  const filteredSections = formData.class_id
    ? sections.filter((s) => s.class_id === formData.class_id)
    : [];

  const selectedSection = sections.find((s) => s.id === formData.section_id);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.student_id.trim()) {
      newErrors.student_id = "Student ID is required";
    }
    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    }
    if (!formData.admission_date) {
      newErrors.admission_date = "Admission date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Check section capacity
    if (selectedSection && !isEditing) {
      if (selectedSection.current_students >= selectedSection.capacity) {
        setCapacityWarning(`Section ${selectedSection.name} is already full (${selectedSection.current_students}/${selectedSection.capacity}). Do you want to continue?`);
        return;
      }
    }

    setIsSubmitting(true);
    setCapacityWarning(null);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof StudentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    if (field === "class_id") {
      setFormData((prev) => ({ ...prev, section_id: "" }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              {isEditing ? "Edit Student" : "Add New Student"}
            </h2>
            <p className="text-sm text-slate-500">
              {isEditing ? "Update student information" : "Fill in the details to add a new student"}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Capacity Warning */}
        {capacityWarning && (
          <div className="mx-6 mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-700">{capacityWarning}</p>
            <div className="mt-3 flex gap-3">
              <button
                onClick={() => setCapacityWarning(null)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setCapacityWarning(null);
                  setIsSubmitting(true);
                  onSubmit(formData).finally(() => setIsSubmitting(false));
                }}
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm text-white hover:bg-amber-700"
              >
                Continue Anyway
              </button>
            </div>
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
                    Student ID <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={formData.student_id}
                      onChange={(e) => handleChange("student_id", e.target.value)}
                      className={`h-10 w-full rounded-lg border pl-10 pr-3 text-sm focus:outline-none focus:ring-2 ${
                        errors.student_id
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : "border-slate-200 focus:border-blue-300 focus:ring-blue-100"
                      }`}
                      placeholder="STU-2024-001"
                    />
                  </div>
                  {errors.student_id && <p className="mt-1 text-xs text-red-500">{errors.student_id}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    value={formData.roll_number}
                    onChange={(e) => handleChange("roll_number", e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="1"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => handleChange("full_name", e.target.value)}
                    className={`h-10 w-full rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 ${
                      errors.full_name
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-slate-200 focus:border-blue-300 focus:ring-blue-100"
                    }`}
                    placeholder="Student full name"
                  />
                  {errors.full_name && <p className="mt-1 text-xs text-red-500">{errors.full_name}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Father&apos;s Name
                  </label>
                  <input
                    type="text"
                    value={formData.father_name}
                    onChange={(e) => handleChange("father_name", e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Father's name"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Guardian&apos;s Name
                  </label>
                  <input
                    type="text"
                    value={formData.guardian_name}
                    onChange={(e) => handleChange("guardian_name", e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Guardian name (if different)"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => handleChange("date_of_birth", e.target.value)}
                      className="h-10 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleChange("gender", e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      className="h-10 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      placeholder="Contact number"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Address
                  </label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-3 text-slate-400" />
                    <textarea
                      value={formData.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-slate-200 pl-10 pr-3 py-2 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      placeholder="Home address"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <BookOpen size={16} className="text-emerald-600" />
                Academic Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Admission Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      value={formData.admission_date}
                      onChange={(e) => handleChange("admission_date", e.target.value)}
                      className={`h-10 w-full rounded-lg border pl-10 pr-3 text-sm focus:outline-none focus:ring-2 ${
                        errors.admission_date
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : "border-slate-200 focus:border-blue-300 focus:ring-blue-100"
                      }`}
                    />
                  </div>
                  {errors.admission_date && <p className="mt-1 text-xs text-red-500">{errors.admission_date}</p>}
                </div>
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
                    <option value="graduated">Graduated</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Class <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <BookOpen size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      value={formData.class_id}
                      onChange={(e) => handleChange("class_id", e.target.value)}
                      className="h-10 w-full appearance-none rounded-lg border border-slate-200 pl-10 pr-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">Select class</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600">
                    Section
                  </label>
                  <div className="relative">
                    <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select
                      value={formData.section_id}
                      onChange={(e) => handleChange("section_id", e.target.value)}
                      disabled={!formData.class_id}
                      className="h-10 w-full appearance-none rounded-lg border border-slate-200 pl-10 pr-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">
                        {formData.class_id ? "Select section" : "Select a class first"}
                      </option>
                      {filteredSections.map((sec) => (
                        <option key={sec.id} value={sec.id}>
                          {sec.name} ({sec.current_students}/{sec.capacity})
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedSection && (
                    <p className="mt-1 text-xs text-slate-400">
                      Capacity: {selectedSection.current_students}/{selectedSection.capacity} students
                    </p>
                  )}
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
                ? "Update Student"
                : "Add Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
