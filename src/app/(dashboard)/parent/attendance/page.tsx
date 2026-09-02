"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loader2, CalendarCheck, Search } from "lucide-react";

interface Child {
  id: string;
  full_name: string;
  class_name: string;
  section_name: string;
}

interface AttendanceRecord {
  id: string;
  student_name: string;
  attendance_date: string;
  class_name: string;
  section_name: string;
  status: string;
  remarks: string | null;
}

interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  percentage: number;
}

export default function ParentAttendancePage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

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
          if (childrenData.length > 0) {
            setSelectedChild(childrenData[0].id);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load children");
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
  }, [profile?.id]);

  useEffect(() => {
    if (!selectedChild || !profile?.id) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        let query = supabase
          .from("attendance_records")
          .select("id, attendance_date, status, remarks, student_id, class_id, section_id")
          .eq("student_id", selectedChild)
          .eq("school_id", profile.school_id)
          .order("attendance_date", { ascending: false });

        if (dateFrom) query = query.gte("attendance_date", dateFrom);
        if (dateTo) query = query.lte("attendance_date", dateTo);
        if (statusFilter !== "all") query = query.eq("status", statusFilter);

        const { data: attendanceData, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        if (cancelled) return;

        const studentIds = [...new Set(attendanceData?.map((r) => r.student_id) || [])];
        const classIds = [...new Set(attendanceData?.map((r) => r.class_id) || [])];
        const sectionIds = [...new Set(attendanceData?.map((r) => r.section_id) || [])];

        const [studentsRes, classesRes, sectionsRes] = await Promise.all([
          supabase.from("students").select("id, full_name").in("id", studentIds),
          supabase.from("classes").select("id, name").in("id", classIds),
          supabase.from("sections").select("id, name").in("id", sectionIds),
        ]);

        const studentMap = new Map(studentsRes.data?.map((s) => [s.id, s.full_name]) || []);
        const classMap = new Map(classesRes.data?.map((c) => [c.id, c.name]) || []);
        const sectionMap = new Map(sectionsRes.data?.map((s) => [s.id, s.name]) || []);

        const mappedRecords: AttendanceRecord[] = attendanceData?.map((r) => ({
          id: r.id,
          student_name: studentMap.get(r.student_id) || "Unknown",
          attendance_date: r.attendance_date,
          class_name: classMap.get(r.class_id) || "Unknown",
          section_name: sectionMap.get(r.section_id) || "Unknown",
          status: r.status,
          remarks: r.remarks,
        })) || [];

        if (!cancelled) {
          setRecords(mappedRecords);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load attendance");
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
  }, [selectedChild, dateFrom, dateTo, statusFilter]);

  const summary: AttendanceSummary = useMemo(() => {
    const filtered = records.filter((r) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!r.attendance_date.includes(query) && !r.status.toLowerCase().includes(query)) {
          return false;
        }
      }
      return true;
    });

    const present = filtered.filter((r) => r.status === "present").length;
    const late = filtered.filter((r) => r.status === "late").length;
    const absent = filtered.filter((r) => r.status === "absent").length;
    const excused = filtered.filter((r) => r.status === "excused").length;
    const total = filtered.length;
    const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return { total, present, absent, late, excused, percentage };
  }, [records, searchQuery]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!r.attendance_date.includes(query) && !r.status.toLowerCase().includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [records, searchQuery]);

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
    <DashboardLayout allowedRoles={["parent"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Attendance</h1>
          <p className="mt-1 text-sm text-slate-500">
            View attendance records for your children.
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
            <CalendarCheck size={48} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-700">No Children Linked</h3>
            <p className="mt-1 text-sm text-slate-500">
              No children are currently linked to your account.
            </p>
          </div>
        ) : (
          <>
            {/* Child Selector & Filters */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Select Child</label>
                  <select
                    value={selectedChild}
                    onChange={(e) => setSelectedChild(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    {children.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.full_name} - {child.class_name} {child.section_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">From Date</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">To Date</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="all">All Status</option>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                    <option value="excused">Excused</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-5">
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                <p className="text-sm text-slate-500">Total Days</p>
                <p className="mt-1 text-2xl font-bold text-slate-800">{summary.total}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                <p className="text-sm text-slate-500">Present</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">{summary.present}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                <p className="text-sm text-slate-500">Late</p>
                <p className="mt-1 text-2xl font-bold text-amber-600">{summary.late}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                <p className="text-sm text-slate-500">Absent</p>
                <p className="mt-1 text-2xl font-bold text-red-600">{summary.absent}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                <p className="text-sm text-slate-500">Attendance %</p>
                <p className="mt-1 text-2xl font-bold text-blue-600">{summary.percentage}%</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by date or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Records Table */}
            {filteredRecords.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <CalendarCheck size={48} className="mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-700">No Records Found</h3>
                <p className="mt-1 text-sm text-slate-500">
                  No attendance records match your search criteria.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Date
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
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
