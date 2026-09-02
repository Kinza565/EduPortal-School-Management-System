"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, AlertCircle } from "lucide-react";
import type { StudentFeeWithDetails, PaymentMethod } from "@/types/database";

interface PaymentFormProps {
  fee: StudentFeeWithDetails;
  onClose: () => void;
  onSuccess: () => void;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "online", label: "Online" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function PaymentForm({ fee, onClose, onSuccess }: PaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const balance = fee.balance || 0;

  const [formData, setFormData] = useState({
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "cash" as PaymentMethod,
    reference_number: "",
    remarks: "",
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (!formData.amount || Number(formData.amount) <= 0) {
      errors.amount = "Amount must be greater than 0";
    } else if (Number(formData.amount) > balance) {
      errors.amount = `Amount cannot exceed balance (${formatCurrency(balance)})`;
    }
    if (!formData.payment_date) {
      errors.payment_date = "Payment date is required";
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
      if (profileData.role !== "admin") throw new Error("Only admins can record payments");

      const { error: insertError } = await supabase.from("fee_payments").insert({
        school_id: profileData.school_id,
        student_fee_id: fee.id,
        student_id: fee.student_id,
        amount: Number(formData.amount),
        payment_date: formData.payment_date,
        payment_method: formData.payment_method,
        reference_number: formData.reference_number.trim() || null,
        remarks: formData.remarks.trim() || null,
        received_by: userId,
      });

      if (insertError) throw insertError;

      // Update fee status
      const newTotalPaid = (fee.total_paid || 0) + Number(formData.amount);
      let newStatus: "paid" | "partial" | "pending" = "partial";
      if (newTotalPaid >= fee.amount) {
        newStatus = "paid";
      } else if (newTotalPaid > 0) {
        newStatus = "partial";
      }

      const { error: updateError } = await supabase
        .from("student_fees")
        .update({ status: newStatus })
        .eq("id", fee.id);

      if (updateError) throw updateError;

      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to record payment";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Record Payment</h2>
            <p className="mt-1 text-sm text-slate-500">
              {fee.students?.full_name} - {fee.fee_categories?.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Fee Summary */}
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-slate-500">Total Amount</p>
              <p className="text-lg font-bold text-slate-800">{formatCurrency(fee.amount)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Paid</p>
              <p className="text-lg font-bold text-emerald-600">
                {formatCurrency(fee.total_paid || 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Balance</p>
              <p className="text-lg font-bold text-red-600">{formatCurrency(balance)}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 flex items-start gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            {/* Amount */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Payment Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                  Rs.
                </span>
                <input
                  type="number"
                  min="0"
                  max={balance}
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className={`h-11 w-full rounded-lg border bg-white pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                    validationErrors.amount ? "border-red-300" : "border-slate-200"
                  }`}
                />
              </div>
              {validationErrors.amount && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.amount}</p>
              )}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, amount: String(balance) })}
                className="mt-1 text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                Pay full balance
              </button>
            </div>

            {/* Payment Date & Method */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Payment Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  className={`h-11 w-full rounded-lg border bg-white px-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                    validationErrors.payment_date ? "border-red-300" : "border-slate-200"
                  }`}
                />
                {validationErrors.payment_date && (
                  <p className="mt-1 text-xs text-red-600">{validationErrors.payment_date}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Payment Method
                </label>
                <select
                  value={formData.payment_method}
                  onChange={(e) =>
                    setFormData({ ...formData, payment_method: e.target.value as PaymentMethod })
                  }
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reference Number */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Reference / Receipt Number <span className="text-xs text-slate-400">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                placeholder="e.g., REC-001"
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Remarks */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Remarks <span className="text-xs text-slate-400">(Optional)</span>
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="Add any notes..."
                rows={2}
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
              className="h-10 rounded-lg bg-emerald-600 px-5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Recording..." : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
