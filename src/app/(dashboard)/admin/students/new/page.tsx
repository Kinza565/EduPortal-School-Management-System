"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, BookOpen, Calendar, Hash, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import type { Class, Section } from "@/types/database";

interface StudentFormData {
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

export default function AdminNewStudentPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<StudentFormData>({
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
  });

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, school_id")
        .eq("id", session.user.id)
        .single();

      if (!profile || profile.role !== "admin") {
        router.push("/login");
        return;
      }

      const [classesRes, sectionsRes] = await Promise.all([
        supabase
          .from("classes")
          .select("*")
          .eq("school_id", profile.school_id)
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("sections")
          .select("*")
          .eq("school_id", profile.school_id)
          .eq("is_active", true)
          .order("name"),
      ]);

      if (!classesRes.error) {
        setClasses(classesRes.data || []);
      }
      if (!sectionsRes.error) {
        setSections(sectionsRes.data || []);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [supabase, router]);

  const filteredSections = useMemo(() => {
    if (formData.class_id) {
      return sections.filter((s) => s.class_id === formData.class_id);
    }
    return [];
  }, [formData.class_id, sections]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, class_id: e.target.value, section_id: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    if (!formData.student_id.trim() || !formData.full_name.trim()) {
      setError("Student ID and Full Name are required.");
      setIsSaving(false);
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("school_id")
      .eq("id", session.user.id)
      .single();

    if (!profile) {
      setError("Unable to verify admin permissions.");
      setIsSaving(false);
      return;
    }

    const { error: insertError } = await supabase.from("students").insert({
      school_id: profile.school_id,
      student_id: formData.student_id,
      roll_number: formData.roll_number || null,
      full_name: formData.full_name,
      father_name: formData.father_name || null,
      guardian_name: formData.guardian_name || null,
      date_of_birth: formData.date_of_birth || null,
      gender: formData.gender || null,
      phone: formData.phone || null,
      address: formData.address || null,
      admission_date: formData.admission_date,
      class_id: formData.class_id || null,
      section_id: formData.section_id || null,
      status: formData.status as "active" | "inactive" | "graduated",
      photo_url: formData.photo_url || null,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        setError("A student with this ID or roll number already exists.");
      } else {
        setError("Failed to add student. Please try again.");
      }
      setIsSaving(false);
    } else {
      router.push("/admin/students");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/students"
          className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 lg:text-3xl">Add Student</h1>
          <p className="text-slate-500">Create a new student record.</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Personal Information */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
              <User size={18} className="text-blue-600" />
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
                    name="student_id"
                    value={formData.student_id}
                    onChange={handleChange}
                    className="h-10 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="STU-2024-001"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600">
                  Roll Number
                </label>
                <input
                  type="text"
                  name="roll_number"
                  value={formData.roll_number}
                  onChange={handleChange}
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
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Student full name"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600">
                  Father&apos;s Name
                </label>
                <input
                  type="text"
                  name="father_name"
                  value={formData.father_name}
                  onChange={handleChange}
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
                  name="guardian_name"
                  value={formData.guardian_name}
                  onChange={handleChange}
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
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    className="h-10 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
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
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
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
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 pl-10 pr-3 py-2 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Home address"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
              <BookOpen size={18} className="text-emerald-600" />
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
                    name="admission_date"
                    value={formData.admission_date}
                    onChange={handleChange}
                    className="h-10 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="graduated">Graduated</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600">
                  Class
                </label>
                <div className="relative">
                  <BookOpen size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    name="class_id"
                    value={formData.class_id}
                    onChange={handleClassChange}
                    className="h-10 w-full appearance-none rounded-lg border border-slate-200 pl-10 pr-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Select class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600">
                  Section
                </label>
                <select
                  name="section_id"
                  value={formData.section_id}
                  onChange={handleChange}
                  disabled={!formData.class_id}
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">
                    {formData.class_id ? "Select section" : "Select a class first"}
                  </option>
                  {filteredSections.map((sec) => (
                    <option key={sec.id} value={sec.id}>{sec.name}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-600">
                  Photo URL
                </label>
                <input
                  type="url"
                  name="photo_url"
                  value={formData.photo_url}
                  onChange={handleChange}
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link
              href="/admin/students"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Adding..." : "Add Student"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
