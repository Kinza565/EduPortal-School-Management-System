"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, AlertCircle } from "lucide-react";
import type { Student, FeeCategory, FeeStructure } from "@/types/database";

interface FeeFormProps {
  fee?: {
    id: string;
    student_id: string;
    category_id: string;
    amount: number;
    due_date: string;
    description: string | null;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
  defaultClassId?: string;
  defaultSectionId?: string;
  schoolId: string;
}

export function FeeForm({ fee, onClose, onSuccess, schoolId }: FeeFormProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);

  const [formData, setFormData] = useState({
    student_id: "",
    category_id: "",
    class_id: "",
    section_id: "",
    fee_structure_id: "",
    amount: "",
    due_date: "",
    description: "",
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const [studentsResult, categoriesResult, structuresResult] = await Promise.all([
          supabase.from("students").select("*").eq("status", "active").eq("school_id", schoolId).order("full_name"),
          supabase.from("fee_categories").select("*").eq("is_active", true).eq("school_id", schoolId).order("name"),
          supabase.from("fee_structures").select("*").eq("is_active", true).eq("school_id", schoolId).order("created_at"),
        ]);

        if (cancelled) return;
        if (studentsResult.error) throw studentsResult.error;
        if (categoriesResult.error) throw categoriesResult.error;
        if (structuresResult.error) throw structuresResult.error;

        setStudents(studentsResult.data || []);
        setCategories(categoriesResult.data || []);
        setFeeStructures(structuresResult.data || []);

        if (fee) {
          setFormData({
            student_id: fee.student_id,
            category_id: fee.category_id,
            class_id: "",
            section_id: "",
            fee_structure_id: "",
            amount: String(fee.amount),
            due_date: fee.due_date,
            description: fee.description || "",
          });
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
  }, [fee]);

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (!formData.student_id) {
      errors.student_id = "Student is required";
    }
    if (!formData.category_id) {
      errors.category_id = "Fee category is required";
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      errors.amount = "Amount must be greater than 0";
    }
    if (!formData.due_date) {
      errors.due_date = "Due date is required";
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
      if (!userId) throw new Error("You must be logged in");

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("school_id, role")
        .eq("id", userId)
        .single();

      if (profileError || !profileData) throw new Error("Failed to verify your profile");
      if (profileData.role !== "admin") throw new Error("Only admins can create fees");

      const selectedStudent = students.find((s) => s.id === formData.student_id);
      const feeData = {
        school_id: profileData.school_id,
        student_id: formData.student_id,
        category_id: formData.category_id,
        class_id: selectedStudent?.class_id || formData.class_id || null,
        section_id: selectedStudent?.section_id || formData.section_id || null,
        fee_structure_id: formData.fee_structure_id || null,
        amount: Number(formData.amount),
        due_date: formData.due_date,
        description: formData.description.trim() || null,
        status: "pending" as const,
      };

      if (fee) {
        const { error: updateError } = await supabase
          .from("student_fees")
          .update({ amount: feeData.amount, due_date: feeData.due_date, description: feeData.description })
          .eq("id", fee.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from("student_fees").insert(feeData);
        if (insertError) throw insertError;
      }

      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save fee";
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
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              {fee ? "Edit Fee" : "Create Fee Record"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {fee ? "Update fee details" : "Create a new fee record for a student"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 flex items-start gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            {/* Fee Structure (Optional) */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Fee Structure <span className="text-xs text-slate-400">(Optional)</span>
              </label>
              <select
                value={formData.fee_structure_id}
                onChange={(e) => {
                  const structureId = e.target.value;
                  const structure = feeStructures.find((s) => s.id === structureId);
                  setFormData({
                    ...formData,
                    fee_structure_id: structureId,
                    amount: structure ? String(structure.amount) : formData.amount,
                    category_id: structure ? structure.category_id : formData.category_id,
                  });
                }}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select Fee Structure</option>
                {feeStructures.map((structure) => {
                  const category = categories.find((c) => c.id === structure.category_id);
                  return (
                    <option key={structure.id} value={structure.id}>
                      {category?.name || "Unknown"} - Rs. {structure.amount.toLocaleString()} ({structure.frequency})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Student */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Student <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                className={`h-11 w-full rounded-lg border bg-white px-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                  validationErrors.student_id ? "border-red-300" : "border-slate-200"
                }`}
              >
                <option value="">Select Student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.full_name} ({student.student_id})
                  </option>
                ))}
              </select>
              {validationErrors.student_id && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.student_id}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Fee Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className={`h-11 w-full rounded-lg border bg-white px-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                  validationErrors.category_id ? "border-red-300" : "border-slate-200"
                }`}
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {validationErrors.category_id && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.category_id}</p>
              )}
            </div>

            {/* Amount & Due Date */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className={`h-11 w-full rounded-lg border bg-white px-4 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                    validationErrors.amount ? "border-red-300" : "border-slate-200"
                  }`}
                />
                {validationErrors.amount && (
                  <p className="mt-1 text-xs text-red-600">{validationErrors.amount}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className={`h-11 w-full rounded-lg border bg-white px-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                    validationErrors.due_date ? "border-red-300" : "border-slate-200"
                  }`}
                />
                {validationErrors.due_date && (
                  <p className="mt-1 text-xs text-red-600">{validationErrors.due_date}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Description <span className="text-xs text-slate-400">(Optional)</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add any additional notes..."
                rows={3}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

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
              {loading ? "Saving..." : fee ? "Update Fee" : "Create Fee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
