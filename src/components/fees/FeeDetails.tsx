"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, parseISO } from "date-fns";
import {
  ArrowLeft,
  User,
  BookOpen,
  Calendar,
  DollarSign,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
} from "lucide-react";
import type { StudentFeeWithDetails, FeePaymentWithDetails, FeeStatus } from "@/types/database";

interface FeeDetailsProps {
  feeId: string;
  onBack: () => void;
  onRecordPayment: () => void;
  schoolId: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStatusConfig(status: FeeStatus) {
  switch (status) {
    case "paid":
      return { color: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", icon: CheckCircle, label: "Paid" };
    case "partial":
      return { color: "bg-blue-50 text-blue-700 ring-blue-600/20", icon: CreditCard, label: "Partial" };
    case "pending":
      return { color: "bg-amber-50 text-amber-700 ring-amber-600/20", icon: Clock, label: "Pending" };
    case "overdue":
      return { color: "bg-red-50 text-red-700 ring-red-600/20", icon: AlertTriangle, label: "Overdue" };
    case "cancelled":
      return { color: "bg-slate-50 text-slate-700 ring-slate-600/20", icon: AlertCircle, label: "Cancelled" };
    default:
      return { color: "bg-slate-50 text-slate-700 ring-slate-600/20", icon: Clock, label: status };
  }
}

export function FeeDetails({ feeId, onBack, onRecordPayment, schoolId }: FeeDetailsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fee, setFee] = useState<StudentFeeWithDetails | null>(null);
  const [payments, setPayments] = useState<FeePaymentWithDetails[]>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        const { data: feeData, error: feeError } = await supabase
          .from("student_fees")
          .select(
            `
            *,
            students(*),
            fee_categories(*),
            classes(*),
            sections(*)
          `
          )
          .eq("id", feeId)
          .eq("school_id", schoolId)
          .single();

        if (cancelled) return;
        if (feeError) throw feeError;
        if (!feeData) throw new Error("Fee record not found");

        // Get total paid
        const { data: paymentsData } = await supabase
          .from("fee_payments")
          .select("amount")
          .eq("student_fee_id", feeId);

        const totalPaid = (paymentsData || []).reduce((sum, p) => sum + p.amount, 0);

        setFee({
          ...feeData,
          total_paid: totalPaid,
          balance: feeData.amount - totalPaid,
        } as StudentFeeWithDetails);

        // Get payment history
        const { data: paymentHistory, error: paymentsError } = await supabase
          .from("fee_payments")
          .select("*")
          .eq("student_fee_id", feeId)
          .order("payment_date", { ascending: false });

        if (cancelled) return;
        if (paymentsError) throw paymentsError;
        setPayments(paymentHistory || []);
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Failed to load fee details";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [feeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span className="text-slate-600">Loading fee details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <AlertCircle size={32} className="mx-auto mb-3 text-red-500" />
        <h3 className="text-lg font-semibold text-red-700">Error Loading Fee</h3>
        <p className="mt-1 text-sm text-red-600">{error}</p>
        <button
          onClick={onBack}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!fee) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <AlertCircle size={48} className="mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-semibold text-slate-700">Fee Record Not Found</h3>
        <p className="mt-1 text-sm text-slate-500">
          The fee record you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <button
          onClick={onBack}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Back to Fees
        </button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(fee.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Fee Details</h1>
            <p className="mt-1 text-sm text-slate-500">
              {fee.students?.full_name} • {fee.fee_categories?.name}
            </p>
          </div>
        </div>
        {fee.status !== "paid" && fee.status !== "cancelled" && (
          <button
            onClick={onRecordPayment}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            <CreditCard size={16} />
            Record Payment
          </button>
        )}
        <button
          onClick={() => {
            const paymentId = payments.length > 0 ? payments[0].id : "";
            const url = paymentId
              ? `/api/pdf/fee-receipt?feeId=${feeId}&paymentId=${paymentId}`
              : `/api/pdf/fee-receipt?feeId=${feeId}`;
            window.open(url, "_blank");
          }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Download size={16} />
          Download Receipt
        </button>
      </div>

      {/* Status Banner */}
      <div
        className={`flex items-center gap-3 rounded-xl border p-4 ${
          fee.status === "paid"
            ? "border-emerald-200 bg-emerald-50"
            : fee.status === "partial"
            ? "border-blue-200 bg-blue-50"
            : fee.status === "pending"
            ? "border-amber-200 bg-amber-50"
            : fee.status === "overdue"
            ? "border-red-200 bg-red-50"
            : "border-slate-200 bg-slate-50"
        }`}
      >
        <StatusIcon
          size={24}
          className={
            fee.status === "paid"
              ? "text-emerald-600"
              : fee.status === "partial"
              ? "text-blue-600"
              : fee.status === "pending"
              ? "text-amber-600"
              : fee.status === "overdue"
              ? "text-red-600"
              : "text-slate-600"
          }
        />
        <div>
          <p className="font-medium text-slate-800">{statusConfig.label}</p>
          <p className="text-sm text-slate-600">
            {fee.status === "paid" && "This fee has been fully paid."}
            {fee.status === "partial" && "Partial payment has been received."}
            {fee.status === "pending" && "Payment is pending."}
            {fee.status === "overdue" && "This fee is overdue. Please collect payment."}
            {fee.status === "cancelled" && "This fee has been cancelled."}
          </p>
        </div>
      </div>

      {/* Student & Fee Info */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Student Information */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
            <User size={18} className="text-blue-600" />
            Student Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Name</span>
              <span className="text-sm font-medium text-slate-800">{fee.students?.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Student ID</span>
              <span className="text-sm font-medium text-slate-800">{fee.students?.student_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Roll Number</span>
              <span className="text-sm font-medium text-slate-800">
                {fee.students?.roll_number || "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Class</span>
              <span className="text-sm font-medium text-slate-800">
                {fee.classes?.name}
                {fee.sections?.name && ` - ${fee.sections.name}`}
              </span>
            </div>
          </div>
        </div>

        {/* Fee Information */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
            <BookOpen size={18} className="text-purple-600" />
            Fee Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Category</span>
              <span className="text-sm font-medium text-slate-800">
                {fee.fee_categories?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Amount</span>
              <span className="text-sm font-medium text-slate-800">{formatCurrency(fee.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Due Date</span>
              <span className="text-sm font-medium text-slate-800">
                {format(parseISO(fee.due_date), "MMM d, yyyy")}
              </span>
            </div>
            {fee.description && (
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Description</span>
                <span className="text-sm text-slate-700">{fee.description}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
          <DollarSign size={18} className="text-emerald-600" />
          Payment Summary
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-slate-50 p-4 text-center">
            <p className="text-xs font-medium text-slate-500">Total Amount</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{formatCurrency(fee.amount)}</p>
          </div>
          <div className="rounded-lg bg-emerald-50 p-4 text-center">
            <p className="text-xs font-medium text-slate-500">Total Paid</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">
              {formatCurrency(fee.total_paid || 0)}
            </p>
          </div>
          <div className="rounded-lg bg-red-50 p-4 text-center">
            <p className="text-xs font-medium text-slate-500">Balance</p>
            <p className="mt-1 text-2xl font-bold text-red-600">
              {formatCurrency(fee.balance || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800">
            <CreditCard size={18} className="text-blue-600" />
            Payment History
          </h3>
        </div>

        {payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Method
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Reference
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Calendar size={14} className="text-slate-400" />
                        {format(parseISO(payment.payment_date), "MMM d, yyyy")}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-emerald-600">
                        {formatCurrency(payment.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-600 capitalize">
                        {payment.payment_method.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-600">
                        {payment.reference_number || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-600">{payment.remarks || "-"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <CreditCard size={32} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm text-slate-500">No payments recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
