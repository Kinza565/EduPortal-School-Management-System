"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loader2, DollarSign, Download } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";

interface Child {
  id: string;
  full_name: string;
  class_name: string;
  section_name: string;
}

interface Fee {
  id: string;
  child_name: string;
  category_name: string;
  amount: number;
  due_date: string;
  status: string;
  total_paid: number;
  balance: number;
}

interface Payment {
  id: string;
  child_name: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_number: string | null;
  remarks: string | null;
  fee_id: string;
}

interface FeeSummary {
  totalFees: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
}

const PAGE_SIZE = 20;

export default function ParentFeesPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>("all");
  const [fees, setFees] = useState<Fee[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [feesTotalCount, setFeesTotalCount] = useState(0);
  const [paymentsTotalCount, setPaymentsTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"fees" | "payments">("fees");
  const [downloadingReceipt, setDownloadingReceipt] = useState<string | null>(null);

  // Pagination
  const [feesPage, setFeesPage] = useState(1);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const feesTotalPages = Math.max(1, Math.ceil(feesTotalCount / PAGE_SIZE));
  const paymentsTotalPages = Math.max(1, Math.ceil(paymentsTotalCount / PAGE_SIZE));

  // Reset to page 1 when filters change
  const feesInitialMount = useRef(true);
  useEffect(() => {
    if (feesInitialMount.current) {
      feesInitialMount.current = false;
      return;
    }
    setFeesPage(1);
  }, [selectedChild, statusFilter]);

  const paymentsInitialMount = useRef(true);
  useEffect(() => {
    if (paymentsInitialMount.current) {
      paymentsInitialMount.current = false;
      return;
    }
    setPaymentsPage(1);
  }, [selectedChild]);

  // Fetch children on mount
  useEffect(() => {
    if (!profile?.id) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const parentId = profile.id;

        const { data: parentData } = await supabase
          .from("parents")
          .select("id")
          .eq("profile_id", parentId)
          .single();

        if (!parentData) {
          if (!cancelled) {
            setChildren([]);
            setLoading(false);
          }
          return;
        }

        const { data: parentStudents } = await supabase
          .from("parent_student")
          .select("student_id")
          .eq("parent_id", parentData.id);

        if (!parentStudents || parentStudents.length === 0) {
          if (!cancelled) {
            setChildren([]);
            setLoading(false);
          }
          return;
        }

        const studentIds = parentStudents.map((ps) => ps.student_id);

        const { data: studentsData } = await supabase
          .from("students")
          .select("id, full_name, class_id, section_id")
          .in("id", studentIds)
          .order("full_name");

        if (cancelled) return;

        const classIds = [...new Set(studentsData?.map((s) => s.class_id) || [])];
        const sectionIds = [...new Set(studentsData?.map((s) => s.section_id) || [])];

        const [classesRes, sectionsRes] = await Promise.all([
          supabase.from("classes").select("id, name").in("id", classIds),
          supabase.from("sections").select("id, name").in("id", sectionIds),
        ]);

        const classMap = new Map(classesRes.data?.map((c) => [c.id, c.name]) || []);
        const sectionMap = new Map(sectionsRes.data?.map((s) => [s.id, s.name]) || []);

        const childrenData: Child[] = studentsData?.map((s) => ({
          id: s.id,
          full_name: s.full_name,
          class_name: classMap.get(s.class_id) || "Unknown",
          section_name: sectionMap.get(s.section_id) || "Unknown",
        })) || [];

        if (!cancelled) {
          setChildren(childrenData);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load children");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profile?.id]);

  // Fetch fees with pagination
  const fetchFees = useCallback(async () => {
    if (children.length === 0 || !profile?.id) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const studentIds = selectedChild === "all"
        ? children.map((c) => c.id)
        : [selectedChild];

      let feesQuery = supabase
        .from("student_fees")
        .select("id, student_id, amount, due_date, status, category_id", { count: "exact" })
        .in("student_id", studentIds)
        .eq("school_id", profile.school_id);

      if (statusFilter !== "all") feesQuery = feesQuery.eq("status", statusFilter);

      // Apply pagination
      const startIndex = (feesPage - 1) * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE - 1;

      const { data: feesData, count, error: feesError } = await feesQuery
        .order("due_date", { ascending: false })
        .range(startIndex, endIndex);

      if (feesError) throw feesError;

      const studentIdsFromFees = [...new Set(feesData?.map((f) => f.student_id) || [])];
      const categoryIds = [...new Set(feesData?.map((f) => f.category_id) || [])];
      const feeIds = (feesData || []).map((f) => f.id);

      const [studentsRes, categoriesRes, paymentsRes] = await Promise.all([
        supabase.from("students").select("id, full_name").in("id", studentIdsFromFees),
        supabase.from("fee_categories").select("id, name").in("id", categoryIds),
        supabase
          .from("fee_payments")
          .select("student_fee_id, amount")
          .in("student_fee_id", feeIds),
      ]);

      const studentMap = new Map(studentsRes.data?.map((s) => [s.id, s.full_name]) || []);
      const categoryMap = new Map(categoriesRes.data?.map((c) => [c.id, c.name]) || []);

      // Calculate total paid for each fee
      const feePaymentsMap = new Map<string, number>();
      paymentsRes.data?.forEach((p) => {
        const current = feePaymentsMap.get(p.student_fee_id) || 0;
        feePaymentsMap.set(p.student_fee_id, current + p.amount);
      });

      const mappedFees: Fee[] = feesData?.map((f) => {
        const totalPaid = feePaymentsMap.get(f.id) || 0;
        return {
          id: f.id,
          child_name: studentMap.get(f.student_id) || "Unknown",
          category_name: categoryMap.get(f.category_id) || "Unknown",
          amount: f.amount,
          due_date: f.due_date,
          status: f.status,
          total_paid: totalPaid,
          balance: f.amount - totalPaid,
        };
      }) || [];

      setFees(mappedFees);
      setFeesTotalCount(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load fees");
      setFeesTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [children, selectedChild, statusFilter, feesPage]);

  // Fetch payments with pagination
  const fetchPayments = useCallback(async () => {
    if (children.length === 0 || !profile?.id) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const studentIds = selectedChild === "all"
        ? children.map((c) => c.id)
        : [selectedChild];

      const paymentsQuery = supabase
        .from("fee_payments")
        .select("id, student_id, student_fee_id, amount, payment_date, payment_method, reference_number, remarks", { count: "exact" })
        .in("student_id", studentIds)
        .eq("school_id", profile.school_id);

      // Apply pagination
      const startIndex = (paymentsPage - 1) * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE - 1;

      const { data: paymentsData, count, error: paymentsError } = await paymentsQuery
        .order("payment_date", { ascending: false })
        .range(startIndex, endIndex);

      if (paymentsError) throw paymentsError;

      const studentIdsFromPayments = [...new Set(paymentsData?.map((p) => p.student_id) || [])];

      const { data: studentsRes } = await supabase
        .from("students")
        .select("id, full_name")
        .in("id", studentIdsFromPayments);

      const studentMap = new Map(studentsRes?.map((s) => [s.id, s.full_name]) || []);

      const mappedPayments: Payment[] = paymentsData?.map((p) => ({
        id: p.id,
        child_name: studentMap.get(p.student_id) || "Unknown",
        amount: p.amount,
        payment_date: p.payment_date,
        payment_method: p.payment_method,
        reference_number: p.reference_number,
        remarks: p.remarks,
        fee_id: p.student_fee_id,
      })) || [];

      setPayments(mappedPayments);
      setPaymentsTotalCount(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payments");
      setPaymentsTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [children, selectedChild, paymentsPage]);

  // Fetch data when tab or filters change
  useEffect(() => {
    (async () => {
      if (activeTab === "fees") {
        await fetchFees();
      } else {
        await fetchPayments();
      }
    })();
  }, [activeTab, fetchFees, fetchPayments]);

  const summary: FeeSummary = useMemo(() => {
    const totalFees = fees.reduce((sum, f) => sum + f.amount, 0);
    const totalPaid = fees.reduce((sum, f) => sum + f.total_paid, 0);
    const totalPending = fees.filter((f) => f.status === "pending").reduce((sum, f) => sum + f.balance, 0);
    const totalOverdue = fees.filter((f) => f.status === "overdue").reduce((sum, f) => sum + f.balance, 0);

    return { totalFees, totalPaid, totalPending, totalOverdue };
  }, [fees]);

  const getStatusColor = (status: string) => {
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
  };

  const handleDownloadReceipt = async (feeId: string, paymentId: string) => {
    setDownloadingReceipt(paymentId);
    try {
      const response = await fetch(
        `/api/pdf/fee-receipt?feeId=${feeId}&paymentId=${paymentId}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate receipt");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fee-receipt-${paymentId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to download receipt");
    } finally {
      setDownloadingReceipt(null);
    }
  };

  return (
    <DashboardLayout allowedRoles={["parent"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fees</h1>
          <p className="mt-1 text-sm text-slate-500">
            View fee status and payment history for your children.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <span className="ml-3 text-slate-600">Loading...</span>
          </div>
        ) : children.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <DollarSign size={48} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-700">No Children Linked</h3>
            <p className="mt-1 text-sm text-slate-500">
              No children are currently linked to your account.
            </p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Total Fees</p>
                <p className="mt-1 text-2xl font-bold text-slate-800">${summary.totalFees.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Total Paid</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">${summary.totalPaid.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Pending</p>
                <p className="mt-1 text-2xl font-bold text-amber-600">${summary.totalPending.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Overdue</p>
                <p className="mt-1 text-2xl font-bold text-red-600">${summary.totalOverdue.toLocaleString()}</p>
              </div>
            </div>

            {/* Filters & Tabs */}
            <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("fees")}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === "fees"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Fee Status
                </button>
                <button
                  onClick={() => setActiveTab("payments")}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === "payments"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Payment History
                </button>
              </div>
              <div className="flex gap-3">
                <select
                  value={selectedChild}
                  onChange={(e) => setSelectedChild(e.target.value)}
                  className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="all">All Children</option>
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.full_name}
                    </option>
                  ))}
                </select>
                {activeTab === "fees" && (
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="all">All Status</option>
                    <option value="paid">Paid</option>
                    <option value="partial">Partial</option>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                )}
              </div>
            </div>

            {/* Content */}
            {activeTab === "fees" ? (
              fees.length === 0 && !loading ? (
                <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                  <DollarSign size={48} className="mx-auto mb-4 text-slate-300" />
                  <h3 className="text-lg font-semibold text-slate-700">No Fees Found</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    No fees match your search criteria.
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[700px]">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Child
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Category
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
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {fees.map((fee) => (
                            <tr key={fee.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3 text-sm font-medium text-slate-800">{fee.child_name}</td>
                              <td className="px-4 py-3 text-sm text-slate-600">{fee.category_name}</td>
                              <td className="px-4 py-3 text-sm text-slate-600">${fee.amount.toLocaleString()}</td>
                              <td className="px-4 py-3 text-sm text-emerald-600">${fee.total_paid.toLocaleString()}</td>
                              <td className="px-4 py-3 text-sm font-medium text-slate-700">${fee.balance.toLocaleString()}</td>
                              <td className="px-4 py-3 text-sm text-slate-600">
                                {new Date(fee.due_date).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${getStatusColor(fee.status)}`}
                                >
                                  {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {feesTotalPages > 1 && (
                      <div className="border-t border-slate-100">
                        <Pagination
                          currentPage={feesPage}
                          totalPages={feesTotalPages}
                          totalRecords={feesTotalCount}
                          pageSize={PAGE_SIZE}
                          onPageChange={setFeesPage}
                        />
                      </div>
                    )}
                  </div>
                </>
              )
            ) : payments.length === 0 && !loading ? (
              <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <DollarSign size={48} className="mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-700">No Payments Found</h3>
                <p className="mt-1 text-sm text-slate-500">
                  No payment records found.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Child
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Method
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Reference
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {payments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 text-sm font-medium text-slate-800">{payment.child_name}</td>
                            <td className="px-4 py-3 text-sm font-medium text-emerald-600">
                              ${payment.amount.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              {new Date(payment.payment_date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600 capitalize">
                              {payment.payment_method.replace("_", " ")}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-500">
                              {payment.reference_number || "-"}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end">
                                <button
                                  onClick={() => handleDownloadReceipt(payment.fee_id, payment.id)}
                                  disabled={downloadingReceipt === payment.id}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50"
                                  title="Download Receipt"
                                >
                                  <Download size={14} />
                                  {downloadingReceipt === payment.id ? "Generating..." : "Receipt"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {paymentsTotalPages > 1 && (
                    <div className="border-t border-slate-100">
                      <Pagination
                        currentPage={paymentsPage}
                        totalPages={paymentsTotalPages}
                        totalRecords={paymentsTotalCount}
                        pageSize={PAGE_SIZE}
                        onPageChange={setPaymentsPage}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
