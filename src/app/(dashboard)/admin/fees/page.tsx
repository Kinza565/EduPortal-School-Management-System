"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { FeeStats } from "@/components/fees/FeeStats";
import { FeeFilters } from "@/components/fees/FeeFilters";
import { FeeTable } from "@/components/fees/FeeTable";
import { FeeForm } from "@/components/fees/FeeForm";
import { PaymentForm } from "@/components/fees/PaymentForm";
import { Pagination } from "@/components/ui/pagination";
import type { StudentFeeWithDetails, Class, Section, FeeCategory } from "@/types/database";

const PAGE_SIZE = 20;

export default function FeesPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fees, setFees] = useState<StudentFeeWithDetails[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [categories, setCategories] = useState<FeeCategory[]>([]);

  // Modal states
  const [showFeeForm, setShowFeeForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedFee, setSelectedFee] = useState<StudentFeeWithDetails | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Reset to page 1 when filters change (skip initial render)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setCurrentPage(1);
  }, [searchQuery, classFilter, sectionFilter, statusFilter, categoryFilter]);

  const hasActiveFilters =
    searchQuery !== "" ||
    classFilter !== "all" ||
    sectionFilter !== "all" ||
    statusFilter !== "all" ||
    categoryFilter !== "all";

  // Fetch fees with pagination
  const fetchFees = useCallback(async () => {
    if (!profile?.school_id) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Build query with filters
      let query = supabase
        .from("student_fees")
        .select(
          `
          *,
          students(*),
          fee_categories(*),
          classes(*),
          sections(*)
        `,
          { count: "exact" }
        )
        .eq("school_id", profile.school_id);

      // Apply filters
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        query = query.or(
          `students.full_name.ilike.%${search}%,students.student_id.ilike.%${search}%,students.roll_number.ilike.%${search}%`
        );
      }
      if (classFilter !== "all") query = query.eq("class_id", classFilter);
      if (sectionFilter !== "all") query = query.eq("section_id", sectionFilter);
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      if (categoryFilter !== "all") query = query.eq("category_id", categoryFilter);

      // Apply pagination
      const startIndex = (currentPage - 1) * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE - 1;

      const { data, count, error: feesError } = await query
        .order("created_at", { ascending: false })
        .range(startIndex, endIndex);

      if (feesError) throw feesError;

      // Fetch payments for all fees in a single query
      const feeIds = (data || []).map((f) => f.id);
      const { data: payments } = await supabase
        .from("fee_payments")
        .select("student_fee_id, amount")
        .in("student_fee_id", feeIds);

      // Calculate payments per fee
      const paymentsByFee = new Map<string, number>();
      (payments || []).forEach((p) => {
        const current = paymentsByFee.get(p.student_fee_id) || 0;
        paymentsByFee.set(p.student_fee_id, current + p.amount);
      });

      const feesWithPayments = (data || []).map((fee) => {
        const totalPaid = paymentsByFee.get(fee.id) || 0;
        return {
          ...fee,
          total_paid: totalPaid,
          balance: fee.amount - totalPaid,
        } as StudentFeeWithDetails;
      });

      setFees(feesWithPayments);
      setTotalCount(count || 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load fees";
      setError(message);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, classFilter, sectionFilter, statusFilter, categoryFilter, currentPage, profile]);

  // Initial data load and filter change handler
  useEffect(() => {
    (async () => {
      await fetchFees();
    })();
  }, [fetchFees]);

  // Load static data on mount
  useEffect(() => {
    if (!profile?.school_id) return;

    (async () => {
      try {
        const supabase = createClient();
        const [classesResult, categoriesResult] = await Promise.all([
          supabase.from("classes").select("*").eq("is_active", true).eq("school_id", profile.school_id).order("name"),
          supabase.from("fee_categories").select("*").eq("is_active", true).eq("school_id", profile.school_id).order("name"),
        ]);

        setClasses(classesResult.data || []);
        setCategories(categoriesResult.data || []);
      } catch (err) {
        console.error("Failed to load static data:", err);
      }
    })();
  }, [profile?.school_id]);

  // Load sections when class filter changes
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (classFilter === "all") {
        setSections([]);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("sections")
          .select("*")
          .eq("class_id", classFilter)
          .eq("is_active", true)
          .order("name");

        if (cancelled) return;
        if (error) throw error;
        setSections(data || []);
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch sections:", err);
          setSections([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [classFilter]);

  const stats = useMemo(() => {
    const totalFees = fees.reduce((sum, f) => sum + f.amount, 0);
    const totalCollected = fees.reduce((sum, f) => sum + (f.total_paid || 0), 0);
    const totalPending = fees
      .filter((f) => f.status === "pending")
      .reduce((sum, f) => sum + f.amount - (f.total_paid || 0), 0);
    const totalOverdue = fees
      .filter((f) => f.status === "overdue")
      .reduce((sum, f) => sum + f.amount - (f.total_paid || 0), 0);
    const outstandingBalance = fees.reduce((sum, f) => sum + (f.balance || 0), 0);

    return { totalFees, totalCollected, totalPending, totalOverdue, outstandingBalance };
  }, [fees]);

  const handleView = useCallback((fee: StudentFeeWithDetails) => {
    router.push(`/admin/fees/${fee.id}`);
  }, [router]);

  const handleEdit = useCallback((fee: StudentFeeWithDetails) => {
    setSelectedFee(fee);
    setShowFeeForm(true);
  }, []);

  const handleRecordPayment = useCallback((fee: StudentFeeWithDetails) => {
    setSelectedFee(fee);
    setShowPaymentForm(true);
  }, []);

  const handleViewHistory = useCallback((fee: StudentFeeWithDetails) => {
    router.push(`/admin/fees/${fee.id}`);
  }, [router]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setClassFilter("all");
    setSectionFilter("all");
    setStatusFilter("all");
    setCategoryFilter("all");
  }, []);

  const handleFeeFormSuccess = useCallback(() => {
    setShowFeeForm(false);
    setSelectedFee(null);
    fetchFees();
  }, [fetchFees]);

  const handlePaymentSuccess = useCallback(() => {
    setShowPaymentForm(false);
    setSelectedFee(null);
    fetchFees();
  }, [fetchFees]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fees Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage student fees, payments, balances, and outstanding dues.
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedFee(null);
            setShowFeeForm(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <Plus size={18} />
          Create Fee
        </button>
      </div>

      {/* Stats */}
      <FeeStats {...stats} />

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <FeeFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        classFilter={classFilter}
        onClassChange={setClassFilter}
        sectionFilter={sectionFilter}
        onSectionChange={setSectionFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        classes={classes}
        sections={sections}
        categories={categories}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-16 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <span className="text-slate-600">Loading fees...</span>
          </div>
        </div>
      ) : (
        <>
          <FeeTable
            fees={fees}
            onView={handleView}
            onEdit={handleEdit}
            onRecordPayment={handleRecordPayment}
            onViewHistory={handleViewHistory}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalRecords={totalCount}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showFeeForm && (
        <FeeForm
          fee={selectedFee}
          onClose={() => {
            setShowFeeForm(false);
            setSelectedFee(null);
          }}
          onSuccess={handleFeeFormSuccess}
          schoolId=""
        />
      )}

      {showPaymentForm && selectedFee && (
        <PaymentForm
          fee={selectedFee}
          onClose={() => {
            setShowPaymentForm(false);
            setSelectedFee(null);
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
