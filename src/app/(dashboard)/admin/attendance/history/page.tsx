"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { CalendarDays, Search, Filter, X } from "lucide-react";
import type { Class, Section, Student, AttendanceRecord } from "@/types/database";
import { Pagination } from "@/components/ui/pagination";

type AttendanceWithDetails = AttendanceRecord & {
  students: Student;
  classes: Class;
  sections: Section;
};

const PAGE_SIZE = 25;

export default function AttendanceHistoryPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const supabase = createClient();
  const router = useRouter();

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Reset to page 1 when filters change (skip initial render)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setCurrentPage(1);
  }, [searchQuery, dateFrom, dateTo, classFilter, sectionFilter, statusFilter]);

  const fetchInitialData = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push("/login");
      return null;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, school_id")
      .eq("id", session.user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      router.push("/login");
      return null;
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

    if (!classesRes.error) setClasses(classesRes.data || []);
    if (!sectionsRes.error) setSections(sectionsRes.data || []);

    return profile.school_id;
  }, [supabase, router]);

  const fetchAttendanceHistory = useCallback(async () => {
    setIsLoadingRecords(true);
    setError(null);

    try {
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
        setError("Failed to get admin profile.");
        return;
      }

      let query = supabase
        .from("attendance_records")
        .select("*, students(*), classes(*), sections(*)", { count: "exact" })
        .eq("school_id", profile.school_id)
        .order("attendance_date", { ascending: false })
        .order("classes(name)")
        .order("sections(name)");

      if (dateFrom) {
        query = query.gte("attendance_date", dateFrom);
      }
      if (dateTo) {
        query = query.lte("attendance_date", dateTo);
      }
      if (classFilter) {
        query = query.eq("class_id", classFilter);
      }
      if (sectionFilter) {
        query = query.eq("section_id", sectionFilter);
      }
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      // Apply pagination
      const startIndex = (currentPage - 1) * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE - 1;

      const { data, count, error: fetchError } = await query.range(startIndex, endIndex);

      if (fetchError) {
        setError("Failed to load attendance history.");
        setAttendanceRecords([]);
        setTotalCount(0);
      } else {
        setAttendanceRecords((data as AttendanceWithDetails[]) || []);
        setTotalCount(count || 0);
      }
    } catch (err) {
      console.error("Error loading history:", err);
      setError("Failed to load attendance history.");
      setTotalCount(0);
    } finally {
      setIsLoadingRecords(false);
    }
  }, [supabase, router, dateFrom, dateTo, classFilter, sectionFilter, statusFilter, currentPage]);

  useEffect(() => {
    (async () => {
      const schoolId = await fetchInitialData();
      if (schoolId) {
        setIsLoading(false);
      }
    })();
  }, [fetchInitialData]);

  useEffect(() => {
    (async () => {
      if (!isLoading) {
        await fetchAttendanceHistory();
      }
    })();
  }, [isLoading, fetchAttendanceHistory]);

  // Filtered sections based on selected class
  const filteredSections = useMemo(() => {
    if (!classFilter) return sections;
    return sections.filter((s) => s.class_id === classFilter);
  }, [classFilter, sections]);

  // Filtered records based on search
  const filteredRecords = useMemo(() => {
    if (!searchQuery) return attendanceRecords;
    const query = searchQuery.toLowerCase();
    return attendanceRecords.filter(
      (record) =>
        record.students?.full_name?.toLowerCase().includes(query) ||
        record.students?.student_id?.toLowerCase().includes(query) ||
        record.students?.roll_number?.toLowerCase().includes(query)
    );
  }, [attendanceRecords, searchQuery]);

  const clearFilters = () => {
    setSearchQuery("");
    setDateFrom("");
    setDateTo("");
    setClassFilter("");
    setSectionFilter("");
    setStatusFilter("all");
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    dateFrom !== "" ||
    dateTo !== "" ||
    classFilter !== "" ||
    sectionFilter !== "" ||
    statusFilter !== "all";

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      present: "bg-emerald-50 text-emerald-700",
      absent: "bg-red-50 text-red-700",
      late: "bg-amber-50 text-amber-700",
      excused: "bg-blue-50 text-blue-700",
    };
    return styles[status] || "bg-slate-100 text-slate-600";
  };

  // Group records by date for summary
  const summaryByDate = useMemo(() => {
    const summary: Record<string, { present: number; absent: number; late: number; excused: number }> = {};
    attendanceRecords.forEach((record) => {
      if (!summary[record.attendance_date]) {
        summary[record.attendance_date] = { present: 0, absent: 0, late: 0, excused: 0 };
      }
      summary[record.attendance_date][record.status as "present" | "absent" | "late" | "excused"]++;
    });
    return summary;
  }, [attendanceRecords]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading attendance history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 lg:text-3xl">Attendance History</h1>
          <p className="text-slate-500">
            View and filter historical attendance records.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search by student name, ID, or roll number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-slate-400" />
              <span className="text-xs font-medium text-slate-500">Filters:</span>
            </div>

            {/* Date From */}
            <div className="relative">
              <CalendarDays
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="From"
                className="h-10 rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-600 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Date To */}
            <div className="relative">
              <CalendarDays
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="To"
                className="h-10 rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-600 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Class Filter */}
            <select
              value={classFilter}
              onChange={(e) => {
                setClassFilter(e.target.value);
                setSectionFilter("");
              }}
              className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>

            {/* Section Filter */}
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              disabled={!classFilter && sections.length === 0}
              className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">All Sections</option>
              {filteredSections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="excused">Excused</option>
            </select>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <X size={14} />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {!isLoadingRecords && totalCount > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total Records</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{totalCount.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-emerald-600">Present</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">
              {attendanceRecords.filter((r) => r.status === "present").length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-red-600">Absent</p>
            <p className="mt-1 text-2xl font-bold text-red-700">
              {attendanceRecords.filter((r) => r.status === "absent").length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-amber-600">Late</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">
              {attendanceRecords.filter((r) => r.status === "late").length}
            </p>
          </div>
        </div>
      )}

      {/* Records Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {isLoadingRecords ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="text-sm text-slate-500">Loading records...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <CalendarDays className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">No attendance records found</h3>
            <p className="mt-1 text-sm text-slate-500">
              Try adjusting your filters or date range.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="px-6 py-4 text-left font-medium text-slate-500">Date</th>
                      <th className="px-6 py-4 text-left font-medium text-slate-500">Class</th>
                      <th className="px-6 py-4 text-left font-medium text-slate-500">Section</th>
                      <th className="px-6 py-4 text-left font-medium text-slate-500">Student</th>
                      <th className="px-6 py-4 text-left font-medium text-slate-500">Roll No.</th>
                      <th className="px-6 py-4 text-left font-medium text-slate-500">Status</th>
                      <th className="px-6 py-4 text-left font-medium text-slate-500">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record) => (
                      <tr
                        key={record.id}
                        className="border-b border-slate-100 transition-colors hover:bg-slate-50/50"
                      >
                        <td className="px-6 py-4 text-slate-600">
                          {formatDate(record.attendance_date)}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {record.classes?.name || "—"}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {record.sections?.name || "—"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                              {record.students?.full_name?.charAt(0) || "S"}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">
                                {record.students?.full_name || "Unknown"}
                              </p>
                              <p className="text-xs text-slate-400">
                                {record.students?.student_id}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600">
                            {record.students?.roll_number || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadge(record.status)}`}
                          >
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {record.remarks || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden">
              <div className="divide-y divide-slate-100">
                {filteredRecords.map((record) => (
                  <div key={record.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                          {record.students?.full_name?.charAt(0) || "S"}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">
                            {record.students?.full_name || "Unknown"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {record.classes?.name} - {record.sections?.name}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadge(record.status)}`}
                      >
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                      <span>{formatDate(record.attendance_date)}</span>
                      {record.students?.roll_number && (
                        <span>Roll #{record.students.roll_number}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {!isLoadingRecords && totalPages > 1 && (
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

      {/* Summary */}
      {!isLoadingRecords && filteredRecords.length > 0 && (
        <div className="text-sm text-slate-500">
          Showing {((currentPage - 1) * PAGE_SIZE) + 1}-{Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount} record{totalCount !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
