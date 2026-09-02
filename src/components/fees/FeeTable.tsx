"use client";

import { format, parseISO } from "date-fns";
import { Eye, Edit, CreditCard, History } from "lucide-react";
import type { StudentFeeWithDetails, FeeStatus } from "@/types/database";

interface FeeTableProps {
  fees: StudentFeeWithDetails[];
  onView: (fee: StudentFeeWithDetails) => void;
  onEdit: (fee: StudentFeeWithDetails) => void;
  onRecordPayment: (fee: StudentFeeWithDetails) => void;
  onViewHistory: (fee: StudentFeeWithDetails) => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getStatusColor(status: FeeStatus): string {
  switch (status) {
    case "paid":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
    case "partial":
      return "bg-blue-50 text-blue-700 ring-blue-600/20";
    case "pending":
      return "bg-amber-50 text-amber-700 ring-amber-600/20";
    case "overdue":
      return "bg-red-50 text-red-700 ring-red-600/20";
    case "cancelled":
      return "bg-slate-50 text-slate-700 ring-slate-600/20";
    default:
      return "bg-slate-50 text-slate-700 ring-slate-600/20";
  }
}

export function FeeTable({ fees, onView, onEdit, onRecordPayment, onViewHistory }: FeeTableProps) {
  if (fees.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <CreditCard size={28} className="text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700">No fee records found</h3>
        <p className="mt-1 text-sm text-slate-500">
          Create your first fee record to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Student
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Class
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Fee Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Paid
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Balance
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Due Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {fees.map((fee) => (
              <tr key={fee.id} className="transition-colors hover:bg-slate-50/50">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-800">{fee.students?.full_name}</p>
                    <p className="text-xs text-slate-500">ID: {fee.students?.student_id}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-slate-600">
                    {fee.classes?.name || "N/A"}
                    {fee.sections?.name && ` - ${fee.sections.name}`}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-slate-600">
                    {fee.fee_categories?.name || "N/A"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-slate-800">
                    {formatCurrency(fee.amount)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-emerald-600">
                    {formatCurrency(fee.total_paid || 0)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-sm font-medium ${(fee.balance || 0) > 0 ? "text-red-600" : "text-emerald-600"}`}>
                    {formatCurrency(fee.balance || 0)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-slate-600">
                    {format(parseISO(fee.due_date), "MMM d, yyyy")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${getStatusColor(
                      fee.status
                    )}`}
                  >
                    {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onView(fee)}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => onEdit(fee)}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600"
                      title="Edit Fee"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => onRecordPayment(fee)}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                      title="Record Payment"
                    >
                      <CreditCard size={16} />
                    </button>
                    <button
                      onClick={() => onViewHistory(fee)}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-purple-50 hover:text-purple-600"
                      title="Payment History"
                    >
                      <History size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
