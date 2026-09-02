"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loader2, Search, CalendarDays } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";

interface AttendanceRecord {
  id: string;
  student_name: string;
  student_id: string;
  attendance_date: string;
  class_name: string;
  section_name: string;
  status: string;
  remarks: string | null;
}

const PAGE_SIZE = 25;

export default function AttendanceHistoryPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [sections, setSections] = useState<{ id: string; name: string }[]>([]);
  const [classFilter, setClassFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
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
  }, [searchQuery, dateFrom, dateTo, classFilter, sectionFilter, statusFilter]);

  const fetchTeacherAssignments = useCallback(async () => {
    if (!profile?.id) return null;
    const supabase = createClient();
    const teacherId = profile.id;

    const { data: assignments } = await supabase
      .from("teacher_assignments")
      .select("class_id, section_id")
      .eq("teacher_id", teacherId);

    const classIds = [...new Set(assignments?.map((a) => a.class_id) || [])];
    const sectionIds = [...new Set(assignments?.map((a) => a.section_id) || [])];

    return { classIds, sectionIds };
  }, [profile]);

  const fetchAttendanceHistory = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const teacherId = profile.id;

      const { data: assignments } = await supabase
        .from("teacher_assignments")
        .select("class_id, section_id")
        .eq("teacher_id", teacherId);

      const classIds = [...new Set(assignments?.map((a) => a.class_id) || [])];
      const sectionIds = [...new Set(assignments?.map((a) => a.section_id) || [])];

      if (classIds.length === 0) {
        setRecords([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      let query = supabase
        .from("attendance_records")
        .select("id, attendance_date, status, remarks, student_id, class_id, section_id", { count: "exact" })
        .in("class_id", classIds)
        .in("section_id", sectionIds)
        .order("attendance_date", { ascending: false });

      if (dateFrom) query = query.gte("attendance_date", dateFrom);
      if (dateTo) query = query.lte("attendance_date", dateTo);
      if (statusFilter !== "all") query = query.eq("status", statusFilter);

      // Apply pagination
      const startIndex = (currentPage - 1) * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE - 1;

      const { data: attendanceData, count, error: fetchError } = await query.range(startIndex, endIndex);

      if (fetchError) throw fetchError;

      const studentIds = [...new Set(attendanceData?.map((r) => r.student_id) || [])];
      const classIdsFromData = [...new Set(attendanceData?.map((r) => r.class_id) || [])];
      const sectionIdsFromData = [...new Set(attendanceData?.map((r) => r.section_id) || [])];

      const [studentsRes, classesRes, sectionsRes] = await Promise.all([
        supabase.from("students").select("id, full_name, student_id").in("id", studentIds),
        supabase.from("classes").select("id, name").in("id", classIdsFromData),
        supabase.from("sections").select("id, name").in("id", sectionIdsFromData),
      ]);

      const studentMap = new Map(studentsRes.data?.map((s) => [s.id, s]) || []);
      const classMap = new Map(classesRes.data?.map((c) => [c.id, c.name]) || []);
      const sectionMap = new Map(sectionsRes.data?.map((s) => [s.id, s.name]) || []);

      const mappedRecords: AttendanceRecord[] = (attendanceData || []).map((r) => {
        const student = studentMap.get(r.student_id);
        return {
          id: r.id,
          student_name: student?.full_name || "Unknown",
          student_id: student?.student_id || "",
          attendance_date: r.attendance_date,
          class_name: classMap.get(r.class_id) || "Unknown",
          section_name: sectionMap.get(r.section_id) || "Unknown",
          status: r.status,
          remarks: r.remarks,
        };
      });

      setRecords(mappedRecords);
      setTotalCount(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load attendance history");
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [profile, dateFrom, dateTo, statusFilter, currentPage]);

  // Fetch filter options on mount
  useEffect(() => {
    if (!profile?.id) return;

    (async () => {
      const result = await fetchTeacherAssignments();
      if (!result) return;

      const supabase = createClient();
      const [classesRes, sectionsRes] = await Promise.all([
        supabase.from("classes").select("id, name").in("id", result.classIds),
        supabase.from("sections").select("id, name").in("id", result.sectionIds),
      ]);

      setClasses(classesRes.data || []);
      setSections(sectionsRes.data || []);
    })();
  }, [profile?.id, fetchTeacherAssignments]);

  // Fetch attendance history when filters change
  useEffect(() => {
    (async () => {
      await fetchAttendanceHistory();
    })();
  }, [fetchAttendanceHistory]);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !record.student_name.toLowerCase().includes(query) &&
          !record.student_id.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      if (classFilter !== "all" && record.class_name !== classFilter) return false;
      if (sectionFilter !== "all" && record.section_name !== sectionFilter) return false;
      return true;
    });
  }, [records, searchQuery, classFilter, sectionFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
      case "absent":
        return "bg-red-50 text-red-700 ring-red-600/20";
      case "late":
        return "bg-amber-50 text-amber-700 ring-amber-600/20";
      case "excused":
        return "bg-blue-50 text-blue-700 ring-blue-600/20";
      default:
        return "bg-slate-50 text-slate-700 ring-slate-600/20";
    }
  };

  return (
    <DashboardLayout allowedRoles={["teacher"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Attendance History</h1>
          <p className="mt-1 text-sm text-slate-500">
            View attendance records for your assigned classes and sections.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <select
              value={classFilter}
              onChange={(e) => { setClassFilter(e.target.value); setSectionFilter("all"); }}
              className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.name}>{cls.name}</option>
              ))}
            </select>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All Sections</option>
              {sections.map((sec) => (
                <option key={sec.id} value={sec.name}>{sec.name}</option>
              ))}
            </select>
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
            <div className="flex gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="From"
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="To"
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <span className="ml-3 text-slate-600">Loading attendance history...</span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <CalendarDays size={48} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-700">No Records Found</h3>
            <p className="mt-1 text-sm text-slate-500">
              No attendance records match your search criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Student
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Class
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Section
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Remarks
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {new Date(record.attendance_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{record.student_name}</p>
                          <p className="text-xs text-slate-500">{record.student_id}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {record.class_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {record.section_name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${getStatusColor(record.status)}`}
                        >
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {record.remarks || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-slate-100">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalRecords={totalCount}
                  pageSize={PAGE_SIZE}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
