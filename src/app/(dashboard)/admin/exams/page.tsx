"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { ExamStats } from "@/components/exams/ExamStats";
import { ExamTable } from "@/components/exams/ExamTable";
import { ExamFilters } from "@/components/exams/ExamFilters";
import { ExamForm } from "@/components/exams/ExamForm";
import { ExamSubjectForm } from "@/components/exams/ExamSubjectForm";
import { ExamStatusDialog } from "@/components/exams/ExamStatusDialog";
import { Pagination } from "@/components/ui/pagination";
import type { ExamWithDetails, Class, Section } from "@/types/database";

const PAGE_SIZE = 20;

export default function ExamsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exams, setExams] = useState<ExamWithDetails[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedExam, setSelectedExam] = useState<ExamWithDetails | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [examTypeFilter, setExamTypeFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Reset to page 1 when filters change (skip initial render)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setCurrentPage(1);
  }, [searchQuery, examTypeFilter, classFilter, sectionFilter, statusFilter]);

  const hasActiveFilters =
    searchQuery !== "" ||
    examTypeFilter !== "all" ||
    classFilter !== "all" ||
    sectionFilter !== "all" ||
    statusFilter !== "all";

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const supabase = createClient();

        // Build query with server-side filters
        let query = supabase
          .from("exams")
          .select(
            `
            *,
            classes (*),
            sections (*),
            exam_subjects (
              *,
              subjects (*)
            )
          `,
            { count: "exact" }
          );

        // Apply search filter server-side
        if (searchQuery) {
          const search = searchQuery.toLowerCase();
          query = query.ilike("name", `%${search}%`);
        }

        // Apply exam type filter server-side
        if (examTypeFilter !== "all") {
          query = query.eq("exam_type", examTypeFilter);
        }

        // Apply class filter server-side
        if (classFilter !== "all") {
          query = query.eq("class_id", classFilter);
        }

        // Apply section filter server-side
        if (sectionFilter !== "all") {
          query = query.eq("section_id", sectionFilter);
        }

        // Apply status filter server-side
        if (statusFilter !== "all") {
          query = query.eq("status", statusFilter);
        }

        // Apply pagination
        const startIndex = (currentPage - 1) * PAGE_SIZE;
        const endIndex = startIndex + PAGE_SIZE - 1;

        const [examsResult, classesResult] = await Promise.all([
          query.order("start_date", { ascending: false }).range(startIndex, endIndex),
          supabase
            .from("classes")
            .select("*")
            .eq("is_active", true)
            .order("name"),
        ]);

        if (cancelled) return;

        if (examsResult.error) throw examsResult.error;
        if (classesResult.error) throw classesResult.error;

        setExams((examsResult.data as ExamWithDetails[]) || []);
        setTotalCount(examsResult.count || 0);
        setClasses(classesResult.data || []);
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Failed to load exams";
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
  }, [searchQuery, examTypeFilter, classFilter, sectionFilter, statusFilter, currentPage]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (classFilter === "all") {
        if (!cancelled) setSections([]);
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

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = exam.name.toLowerCase().includes(query);
        const matchesType = exam.exam_type.toLowerCase().includes(query);
        const matchesClass = exam.classes?.name?.toLowerCase().includes(query);
        if (!matchesName && !matchesType && !matchesClass) return false;
      }

      if (examTypeFilter !== "all" && exam.exam_type !== examTypeFilter) {
        return false;
      }

      if (classFilter !== "all" && exam.class_id !== classFilter) {
        return false;
      }

      if (sectionFilter !== "all" && exam.section_id !== sectionFilter) {
        return false;
      }

      if (statusFilter !== "all" && exam.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [exams, searchQuery, examTypeFilter, classFilter, sectionFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = totalCount;
    const upcoming = exams.filter((e) => e.status === "upcoming").length;
    const ongoing = exams.filter((e) => e.status === "ongoing").length;
    const completed = exams.filter((e) => e.status === "completed").length;
    const cancelled = exams.filter((e) => e.status === "cancelled").length;
    return { total, upcoming, ongoing, completed, cancelled };
  }, [exams, totalCount]);

  const handleView = useCallback((exam: ExamWithDetails) => {
    router.push(`/admin/exams/${exam.id}`);
  }, [router]);

  const handleEdit = useCallback((exam: ExamWithDetails) => {
    setSelectedExam(exam);
    setShowForm(true);
  }, []);

  const handleManageSubjects = useCallback((exam: ExamWithDetails) => {
    setSelectedExam(exam);
    setShowSubjectForm(true);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setExamTypeFilter("all");
    setClassFilter("all");
    setSectionFilter("all");
    setStatusFilter("all");
  }, []);

  const refreshExams = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("exams")
        .select(
          `
          *,
          classes (*),
          sections (*),
          exam_subjects (
            *,
            subjects (*)
          )
        `
        )
        .order("start_date", { ascending: false });

      if (error) throw error;
      setExams((data as ExamWithDetails[]) || []);
    } catch (err) {
      console.error("Failed to refresh exams:", err);
    }
  }, []);

  const handleFormSuccess = useCallback(() => {
    setShowForm(false);
    setSelectedExam(null);
    refreshExams();
  }, [refreshExams]);

  const handleSubjectFormSuccess = useCallback(() => {
    setShowSubjectForm(false);
    setSelectedExam(null);
    refreshExams();
  }, [refreshExams]);

  const handleStatusSuccess = useCallback(() => {
    setShowStatusDialog(false);
    setSelectedExam(null);
    refreshExams();
  }, [refreshExams]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Exams</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create and manage school examinations and schedules.
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedExam(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <Plus size={18} />
          Create Exam
        </button>
      </div>

      {/* Stats */}
      <ExamStats {...stats} />

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <ExamFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        examTypeFilter={examTypeFilter}
        onExamTypeChange={setExamTypeFilter}
        classFilter={classFilter}
        onClassChange={setClassFilter}
        sectionFilter={sectionFilter}
        onSectionChange={setSectionFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        classes={classes}
        sections={sections}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-16 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <span className="text-slate-600">Loading exams...</span>
          </div>
        </div>
      ) : (
        <>
          <ExamTable
            exams={filteredExams}
            onView={handleView}
            onEdit={handleEdit}
            onManageSubjects={handleManageSubjects}
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
      {showForm && (
        <ExamForm
          exam={selectedExam}
          onClose={() => {
            setShowForm(false);
            setSelectedExam(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}

      {showSubjectForm && selectedExam && (
        <ExamSubjectForm
          examId={selectedExam.id}
          onClose={() => {
            setShowSubjectForm(false);
            setSelectedExam(null);
          }}
          onSuccess={handleSubjectFormSuccess}
        />
      )}

      {showStatusDialog && selectedExam && (
        <ExamStatusDialog
          exam={selectedExam}
          onClose={() => {
            setShowStatusDialog(false);
            setSelectedExam(null);
          }}
          onSuccess={handleStatusSuccess}
        />
      )}
    </div>
  );
}
