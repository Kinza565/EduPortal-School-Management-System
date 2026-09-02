"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Users,
  UserCheck,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  Award,
  DollarSign,
  ClipboardList,
  AlertCircle,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { subDays, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, isWithinInterval } from "date-fns";

interface ReportData {
  students: {
    total: number;
    active: number;
    inactive: number;
    graduated: number;
    byClass: { class_name: string; count: number }[];
  };
  teachers: {
    total: number;
    active: number;
  };
  classes: {
    total: number;
    sections: number;
  };
  attendance: {
    total_records: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    percentage: number;
    byClass: { class_name: string; section_name: string; percentage: number }[];
  };
  exams: {
    total: number;
    upcoming: number;
    ongoing: number;
    completed: number;
    cancelled: number;
  };
  results: {
    total: number;
    average_percentage: number;
    pass_rate: number;
    fail_rate: number;
    bySubject: { subject_name: string; average: number }[];
  };
  fees: {
    total_amount: number;
    collected: number;
    pending: number;
    overdue: number;
    outstanding: number;
    collection_rate: number;
    byMethod: { method: string; amount: number }[];
  };
  assignments: {
    total: number;
    active: number;
    completed: number;
    cancelled: number;
    bySubject: { subject_name: string; count: number }[];
  };
}

type DateRange = "today" | "week" | "month" | "year" | "all";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReportData | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);

  const getDateRange = useCallback((range: DateRange) => {
    const now = new Date();
    switch (range) {
      case "today":
        return { start: now, end: now };
      case "week":
        return { start: subDays(now, 7), end: now };
      case "month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "year":
        return { start: startOfYear(now), end: endOfYear(now) };
      default:
        return null;
    }
  }, []);

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) throw new Error("Not authenticated");

      const { data: profileData } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("id", userId)
        .single();

      if (!profileData) throw new Error("Profile not found");
      const schoolId = profileData.school_id;

      const dateRangeFilter = getDateRange(dateRange);

      // Fetch all data in parallel
      const [
        studentsResult,
        teachersResult,
        classesResult,
        sectionsResult,
        attendanceResult,
        examsResult,
        resultsResult,
        feesResult,
        paymentsResult,
        assignmentsResult,
      ] = await Promise.all([
        supabase.from("students").select("*, classes(name)").eq("school_id", schoolId),
        supabase.from("profiles").select("*").eq("school_id", schoolId).eq("role", "teacher"),
        supabase.from("classes").select("*").eq("school_id", schoolId),
        supabase.from("sections").select("*").eq("school_id", schoolId),
        supabase.from("attendance_records").select("*").eq("school_id", schoolId),
        supabase.from("exams").select("*").eq("school_id", schoolId),
        supabase.from("results").select("*, exam_subjects(subjects(name))").eq("school_id", schoolId),
        supabase.from("student_fees").select("*").eq("school_id", schoolId),
        supabase.from("fee_payments").select("*").eq("school_id", schoolId),
        supabase.from("academic_assignments").select("*, subjects(name)").eq("school_id", schoolId),
      ]);

      // Process students data
      const students = studentsResult.data || [];
      const studentsByClass: Record<string, number> = {};
      students.forEach((s) => {
        const className = s.classes?.name || "Unassigned";
        studentsByClass[className] = (studentsByClass[className] || 0) + 1;
      });

      // Process attendance data
      let attendanceRecords = attendanceResult.data || [];
      if (dateRangeFilter) {
        attendanceRecords = attendanceRecords.filter((r) =>
          isWithinInterval(parseISO(r.attendance_date), dateRangeFilter)
        );
      }
      if (classFilter !== "all") {
        attendanceRecords = attendanceRecords.filter((r) => r.class_id === classFilter);
      }

      const presentCount = attendanceRecords.filter((r) => r.status === "present").length;
      const lateCount = attendanceRecords.filter((r) => r.status === "late").length;
      const absentCount = attendanceRecords.filter((r) => r.status === "absent").length;
      const excusedCount = attendanceRecords.filter((r) => r.status === "excused").length;
      const totalAttendance = attendanceRecords.length;
      const attendancePercentage = totalAttendance > 0 ? Math.round(((presentCount + lateCount) / totalAttendance) * 100) : 0;

      // Process exams data
      const exams = examsResult.data || [];

      // Process results data
      const results = resultsResult.data || [];
      const totalResults = results.length;
      const avgPercentage = totalResults > 0 ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / totalResults) : 0;
      const passCount = results.filter((r) => r.status === "pass").length;
      const passRate = totalResults > 0 ? Math.round((passCount / totalResults) * 100) : 0;

      // Results by subject
      const subjectResults: Record<string, { total: number; count: number }> = {};
      results.forEach((r) => {
        const subjectName = r.exam_subjects?.subjects?.name || "Unknown";
        if (!subjectResults[subjectName]) {
          subjectResults[subjectName] = { total: 0, count: 0 };
        }
        subjectResults[subjectName].total += r.percentage;
        subjectResults[subjectName].count += 1;
      });

      // Process fees data
      const fees = feesResult.data || [];
      const payments = paymentsResult.data || [];
      const totalFees = fees.reduce((sum, f) => sum + f.amount, 0);
      const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
      const outstanding = totalFees - totalCollected;
      const collectionRate = totalFees > 0 ? Math.round((totalCollected / totalFees) * 100) : 0;

      // Payments by method
      const paymentsByMethod: Record<string, number> = {};
      payments.forEach((p) => {
        paymentsByMethod[p.payment_method] = (paymentsByMethod[p.payment_method] || 0) + p.amount;
      });

      // Process assignments data
      const assignments = assignmentsResult.data || [];
      const assignmentsBySubject: Record<string, number> = {};
      assignments.forEach((a) => {
        const subjectName = a.subjects?.name || "Unknown";
        assignmentsBySubject[subjectName] = (assignmentsBySubject[subjectName] || 0) + 1;
      });

      setData({
        students: {
          total: students.length,
          active: students.filter((s) => s.status === "active").length,
          inactive: students.filter((s) => s.status === "inactive").length,
          graduated: students.filter((s) => s.status === "graduated").length,
          byClass: Object.entries(studentsByClass).map(([class_name, count]) => ({ class_name, count })),
        },
        teachers: {
          total: teachersResult.data?.length || 0,
          active: teachersResult.data?.filter((t) => t.is_active)?.length || 0,
        },
        classes: {
          total: classesResult.data?.length || 0,
          sections: sectionsResult.data?.length || 0,
        },
        attendance: {
          total_records: totalAttendance,
          present: presentCount,
          absent: absentCount,
          late: lateCount,
          excused: excusedCount,
          percentage: attendancePercentage,
          byClass: [],
        },
        exams: {
          total: exams.length,
          upcoming: exams.filter((e) => e.status === "upcoming").length,
          ongoing: exams.filter((e) => e.status === "ongoing").length,
          completed: exams.filter((e) => e.status === "completed").length,
          cancelled: exams.filter((e) => e.status === "cancelled").length,
        },
        results: {
          total: totalResults,
          average_percentage: avgPercentage,
          pass_rate: passRate,
          fail_rate: 100 - passRate,
          bySubject: Object.entries(subjectResults).map(([subject_name, data]) => ({
            subject_name,
            average: Math.round(data.total / data.count),
          })),
        },
        fees: {
          total_amount: totalFees,
          collected: totalCollected,
          pending: fees.filter((f) => f.status === "pending").reduce((sum, f) => sum + f.amount, 0),
          overdue: fees.filter((f) => f.status === "overdue").reduce((sum, f) => sum + f.amount, 0),
          outstanding,
          collection_rate: collectionRate,
          byMethod: Object.entries(paymentsByMethod).map(([method, amount]) => ({ method, amount })),
        },
        assignments: {
          total: assignments.length,
          active: assignments.filter((a) => a.status === "active").length,
          completed: assignments.filter((a) => a.status === "completed").length,
          cancelled: assignments.filter((a) => a.status === "cancelled").length,
          bySubject: Object.entries(assignmentsBySubject).map(([subject_name, count]) => ({ subject_name, count })),
        },
      });

      setClasses(
        (classesResult.data || []).map((c) => ({ id: c.id, name: c.name }))
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load reports";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [dateRange, classFilter, getDateRange]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session?.user.id;
        if (!userId) throw new Error("Not authenticated");

        const { data: profileData } = await supabase
          .from("profiles")
          .select("school_id")
          .eq("id", userId)
          .single();

        if (!profileData) throw new Error("Profile not found");
        const schoolId = profileData.school_id;

        const dateRangeFilter = getDateRange(dateRange);

        // Fetch all data in parallel
        const [
          studentsResult,
          teachersResult,
          classesResult,
          sectionsResult,
          attendanceResult,
          examsResult,
          resultsResult,
          feesResult,
          paymentsResult,
          assignmentsResult,
        ] = await Promise.all([
        supabase.from("students").select("*, classes!class_id(name)").eq("school_id", schoolId),
          supabase.from("profiles").select("*").eq("school_id", schoolId).eq("role", "teacher"),
          supabase.from("classes").select("*").eq("school_id", schoolId),
          supabase.from("sections").select("*").eq("school_id", schoolId),
          supabase.from("attendance_records").select("*").eq("school_id", schoolId),
          supabase.from("exams").select("*").eq("school_id", schoolId),
          supabase.from("results").select("*, exam_subjects(subjects(name))").eq("school_id", schoolId),
          supabase.from("student_fees").select("*").eq("school_id", schoolId),
          supabase.from("fee_payments").select("*").eq("school_id", schoolId),
          supabase.from("academic_assignments").select("*, subjects(name)").eq("school_id", schoolId),
        ]);

        if (cancelled) return;

        // Process students data
        const students = studentsResult.data || [];
        const studentsByClass: Record<string, number> = {};
        students.forEach((s) => {
          const className = s.classes?.name || "Unassigned";
          studentsByClass[className] = (studentsByClass[className] || 0) + 1;
        });

        // Process attendance data
        let attendanceRecords = attendanceResult.data || [];
        if (dateRangeFilter) {
          attendanceRecords = attendanceRecords.filter((r) =>
            isWithinInterval(parseISO(r.attendance_date), dateRangeFilter)
          );
        }
        if (classFilter !== "all") {
          attendanceRecords = attendanceRecords.filter((r) => r.class_id === classFilter);
        }

        const presentCount = attendanceRecords.filter((r) => r.status === "present").length;
        const lateCount = attendanceRecords.filter((r) => r.status === "late").length;
        const absentCount = attendanceRecords.filter((r) => r.status === "absent").length;
        const excusedCount = attendanceRecords.filter((r) => r.status === "excused").length;
        const totalAttendance = attendanceRecords.length;
        const attendancePercentage = totalAttendance > 0 ? Math.round(((presentCount + lateCount) / totalAttendance) * 100) : 0;

        // Process exams data
        const exams = examsResult.data || [];

        // Process results data
        const results = resultsResult.data || [];
        const totalResults = results.length;
        const avgPercentage = totalResults > 0 ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / totalResults) : 0;
        const passCount = results.filter((r) => r.status === "pass").length;
        const passRate = totalResults > 0 ? Math.round((passCount / totalResults) * 100) : 0;

        // Results by subject
        const subjectResults: Record<string, { total: number; count: number }> = {};
        results.forEach((r) => {
          const subjectName = r.exam_subjects?.subjects?.name || "Unknown";
          if (!subjectResults[subjectName]) {
            subjectResults[subjectName] = { total: 0, count: 0 };
          }
          subjectResults[subjectName].total += r.percentage;
          subjectResults[subjectName].count += 1;
        });

        // Process fees data
        const fees = feesResult.data || [];
        const payments = paymentsResult.data || [];
        const totalFees = fees.reduce((sum, f) => sum + f.amount, 0);
        const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
        const outstanding = totalFees - totalCollected;
        const collectionRate = totalFees > 0 ? Math.round((totalCollected / totalFees) * 100) : 0;

        // Payments by method
        const paymentsByMethod: Record<string, number> = {};
        payments.forEach((p) => {
          paymentsByMethod[p.payment_method] = (paymentsByMethod[p.payment_method] || 0) + p.amount;
        });

        // Process assignments data
        const assignments = assignmentsResult.data || [];
        const assignmentsBySubject: Record<string, number> = {};
        assignments.forEach((a) => {
          const subjectName = a.subjects?.name || "Unknown";
          assignmentsBySubject[subjectName] = (assignmentsBySubject[subjectName] || 0) + 1;
        });

        if (!cancelled) {
          setData({
            students: {
              total: students.length,
              active: students.filter((s) => s.status === "active").length,
              inactive: students.filter((s) => s.status === "inactive").length,
              graduated: students.filter((s) => s.status === "graduated").length,
              byClass: Object.entries(studentsByClass).map(([class_name, count]) => ({ class_name, count })),
            },
            teachers: {
              total: teachersResult.data?.length || 0,
              active: teachersResult.data?.filter((t) => t.is_active)?.length || 0,
            },
            classes: {
              total: classesResult.data?.length || 0,
              sections: sectionsResult.data?.length || 0,
            },
            attendance: {
              total_records: totalAttendance,
              present: presentCount,
              absent: absentCount,
              late: lateCount,
              excused: excusedCount,
              percentage: attendancePercentage,
              byClass: [],
            },
            exams: {
              total: exams.length,
              upcoming: exams.filter((e) => e.status === "upcoming").length,
              ongoing: exams.filter((e) => e.status === "ongoing").length,
              completed: exams.filter((e) => e.status === "completed").length,
              cancelled: exams.filter((e) => e.status === "cancelled").length,
            },
            results: {
              total: totalResults,
              average_percentage: avgPercentage,
              pass_rate: passRate,
              fail_rate: 100 - passRate,
              bySubject: Object.entries(subjectResults).map(([subject_name, data]) => ({
                subject_name,
                average: Math.round(data.total / data.count),
              })),
            },
            fees: {
              total_amount: totalFees,
              collected: totalCollected,
              pending: fees.filter((f) => f.status === "pending").reduce((sum, f) => sum + f.amount, 0),
              overdue: fees.filter((f) => f.status === "overdue").reduce((sum, f) => sum + f.amount, 0),
              outstanding,
              collection_rate: collectionRate,
              byMethod: Object.entries(paymentsByMethod).map(([method, amount]) => ({ method, amount })),
            },
            assignments: {
              total: assignments.length,
              active: assignments.filter((a) => a.status === "active").length,
              completed: assignments.filter((a) => a.status === "completed").length,
              cancelled: assignments.filter((a) => a.status === "cancelled").length,
              bySubject: Object.entries(assignmentsBySubject).map(([subject_name, count]) => ({ subject_name, count })),
            },
          });

          setClasses(
            (classesResult.data || []).map((c) => ({ id: c.id, name: c.name }))
          );
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Failed to load reports";
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
  }, [dateRange, classFilter, getDateRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-blue-600" />
        <span className="ml-3 text-slate-600">Loading reports...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <AlertCircle size={32} className="mx-auto mb-3 text-red-500" />
        <h3 className="text-lg font-semibold text-red-700">Error Loading Reports</h3>
        <p className="mt-1 text-sm text-red-600">{error}</p>
        <button
          onClick={fetchReportData}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <AlertCircle size={48} className="mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-semibold text-slate-700">No Data Available</h3>
        <p className="mt-1 text-sm text-slate-500">No report data could be loaded.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor school performance, attendance, academics, and finances.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as DateRange)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="all">All Classes</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>{cls.name}</option>
          ))}
        </select>
      </div>

      {/* Overview Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Students"
          value={data.students.total}
          icon={<GraduationCap size={22} />}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          subtitle={`${data.students.active} active`}
        />
        <StatCard
          title="Total Teachers"
          value={data.teachers.total}
          icon={<UserCheck size={22} />}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
          subtitle={`${data.teachers.active} active`}
        />
        <StatCard
          title="Today's Attendance"
          value={`${data.attendance.percentage}%`}
          icon={<CalendarCheck size={22} />}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          subtitle={`${data.attendance.total_records} records`}
        />
        <StatCard
          title="Avg Result"
          value={`${data.results.average_percentage}%`}
          icon={<Award size={22} />}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          subtitle={`${data.results.total} results`}
        />
      </div>

      {/* Student Analytics */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
          <Users size={18} className="text-blue-600" />
          Student Analytics
        </h3>
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-lg bg-blue-50 p-4 text-center">
            <p className="text-xs font-medium text-slate-500">Total</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{data.students.total}</p>
          </div>
          <div className="rounded-lg bg-emerald-50 p-4 text-center">
            <p className="text-xs font-medium text-slate-500">Active</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{data.students.active}</p>
          </div>
          <div className="rounded-lg bg-amber-50 p-4 text-center">
            <p className="text-xs font-medium text-slate-500">Inactive</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">{data.students.inactive}</p>
          </div>
          <div className="rounded-lg bg-slate-100 p-4 text-center">
            <p className="text-xs font-medium text-slate-500">Graduated</p>
            <p className="mt-1 text-2xl font-bold text-slate-600">{data.students.graduated}</p>
          </div>
        </div>
        {data.students.byClass.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-slate-600">Students by Class</p>
            <div className="flex flex-wrap gap-2">
              {data.students.byClass.map((item) => (
                <span
                  key={item.class_name}
                  className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700"
                >
                  {item.class_name}: {item.count}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Attendance Analytics */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
          <CalendarCheck size={18} className="text-emerald-600" />
          Attendance Analytics
          {dateRange !== "all" && (
            <span className="ml-2 text-xs font-normal text-slate-400">
              ({dateRange})
            </span>
          )}
        </h3>
        {data.attendance.total_records > 0 ? (
          <div className="grid gap-4 sm:grid-cols-5">
            <div className="rounded-lg bg-emerald-50 p-4 text-center">
              <p className="text-xs font-medium text-slate-500">Present</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">{data.attendance.present}</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-4 text-center">
              <p className="text-xs font-medium text-slate-500">Late</p>
              <p className="mt-1 text-2xl font-bold text-blue-600">{data.attendance.late}</p>
            </div>
            <div className="rounded-lg bg-red-50 p-4 text-center">
              <p className="text-xs font-medium text-slate-500">Absent</p>
              <p className="mt-1 text-2xl font-bold text-red-600">{data.attendance.absent}</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-4 text-center">
              <p className="text-xs font-medium text-slate-500">Excused</p>
              <p className="mt-1 text-2xl font-bold text-amber-600">{data.attendance.excused}</p>
            </div>
            <div className="rounded-lg bg-purple-50 p-4 text-center">
              <p className="text-xs font-medium text-slate-500">Attendance %</p>
              <p className="mt-1 text-2xl font-bold text-purple-600">{data.attendance.percentage}%</p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-slate-50 p-8 text-center">
            <CalendarCheck size={32} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm text-slate-500">No attendance data available for this period.</p>
          </div>
        )}
      </div>

      {/* Academic Performance */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
          <Award size={18} className="text-amber-600" />
          Academic Performance
        </h3>
        {data.results.total > 0 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="rounded-lg bg-blue-50 p-4 text-center">
                <p className="text-xs font-medium text-slate-500">Total Results</p>
                <p className="mt-1 text-2xl font-bold text-slate-800">{data.results.total}</p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-4 text-center">
                <p className="text-xs font-medium text-slate-500">Pass Rate</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">{data.results.pass_rate}%</p>
              </div>
              <div className="rounded-lg bg-red-50 p-4 text-center">
                <p className="text-xs font-medium text-slate-500">Fail Rate</p>
                <p className="mt-1 text-2xl font-bold text-red-600">{data.results.fail_rate}%</p>
              </div>
              <div className="rounded-lg bg-purple-50 p-4 text-center">
                <p className="text-xs font-medium text-slate-500">Average</p>
                <p className="mt-1 text-2xl font-bold text-purple-600">{data.results.average_percentage}%</p>
              </div>
            </div>
            {data.results.bySubject.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-medium text-slate-600">Performance by Subject</p>
                <div className="space-y-2">
                  {data.results.bySubject.map((item) => (
                    <div key={item.subject_name} className="flex items-center gap-3">
                      <span className="w-32 truncate text-sm text-slate-600">{item.subject_name}</span>
                      <div className="flex-1">
                        <div className="h-2 rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-blue-500"
                            style={{ width: `${item.average}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-slate-700">{item.average}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-lg bg-slate-50 p-8 text-center">
            <Award size={32} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm text-slate-500">No results available.</p>
          </div>
        )}
      </div>

      {/* Exam Analytics */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
          <BookOpen size={18} className="text-purple-600" />
          Exam Analytics
        </h3>
        <div className="grid gap-4 sm:grid-cols-5">
          <div className="rounded-lg bg-blue-50 p-4 text-center">
            <p className="text-xs font-medium text-slate-500">Total</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{data.exams.total}</p>
          </div>
          <div className="rounded-lg bg-purple-50 p-4 text-center">
            <p className="text-xs font-medium text-slate-500">Upcoming</p>
            <p className="mt-1 text-2xl font-bold text-purple-600">{data.exams.upcoming}</p>
          </div>
          <div className="rounded-lg bg-amber-50 p-4 text-center">
            <p className="text-xs font-medium text-slate-500">Ongoing</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">{data.exams.ongoing}</p>
          </div>
          <div className="rounded-lg bg-emerald-50 p-4 text-center">
            <p className="text-xs font-medium text-slate-500">Completed</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{data.exams.completed}</p>
          </div>
          <div className="rounded-lg bg-red-50 p-4 text-center">
            <p className="text-xs font-medium text-slate-500">Cancelled</p>
            <p className="mt-1 text-2xl font-bold text-red-600">{data.exams.cancelled}</p>
          </div>
        </div>
      </div>

      {/* Fee Analytics */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
          <DollarSign size={18} className="text-emerald-600" />
          Fee Analytics
        </h3>
        <div className="grid gap-4 sm:grid-cols-5">
          <div className="rounded-lg bg-blue-50 p-4 text-center">
            <p className="text-xs font-medium text-slate-500">Total Fees</p>
            <p className="mt-1 text-xl font-bold text-slate-800">{formatCurrency(data.fees.total_amount)}</p>
          </div>
          <div className="rounded-lg bg-emerald-50 p-4 text-center">
            <p className="text-xs font-medium text-slate-500">Collected</p>
            <p className="mt-1 text-xl font-bold text-emerald-600">{formatCurrency(data.fees.collected)}</p>
          </div>
          <div className="rounded-lg bg-amber-50 p-4 text-center">
            <p className="text-xs font-medium text-slate-500">Pending</p>
            <p className="mt-1 text-xl font-bold text-amber-600">{formatCurrency(data.fees.pending)}</p>
          </div>
          <div className="rounded-lg bg-red-50 p-4 text-center">
            <p className="text-xs font-medium text-slate-500">Overdue</p>
            <p className="mt-1 text-xl font-bold text-red-600">{formatCurrency(data.fees.overdue)}</p>
          </div>
          <div className="rounded-lg bg-purple-50 p-4 text-center">
            <p className="text-xs font-medium text-slate-500">Collection Rate</p>
            <p className="mt-1 text-xl font-bold text-purple-600">{data.fees.collection_rate}%</p>
          </div>
        </div>
        {data.fees.byMethod.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-slate-600">Payments by Method</p>
            <div className="flex flex-wrap gap-2">
              {data.fees.byMethod.map((item) => (
                <span
                  key={item.method}
                  className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700"
                >
                  {item.method.replace("_", " ")}: {formatCurrency(item.amount)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Assignment Analytics */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
          <ClipboardList size={18} className="text-blue-600" />
          Assignment Analytics
        </h3>
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-lg bg-blue-50 p-4 text-center">
            <p className="text-xs font-medium text-slate-500">Total</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{data.assignments.total}</p>
          </div>
          <div className="rounded-lg bg-emerald-50 p-4 text-center">
            <p className="text-xs font-medium text-slate-500">Active</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{data.assignments.active}</p>
          </div>
          <div className="rounded-lg bg-purple-50 p-4 text-center">
            <p className="text-xs font-medium text-slate-500">Completed</p>
            <p className="mt-1 text-2xl font-bold text-purple-600">{data.assignments.completed}</p>
          </div>
          <div className="rounded-lg bg-red-50 p-4 text-center">
            <p className="text-xs font-medium text-slate-500">Cancelled</p>
            <p className="mt-1 text-2xl font-bold text-red-600">{data.assignments.cancelled}</p>
          </div>
        </div>
        {data.assignments.bySubject.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-slate-600">Assignments by Subject</p>
            <div className="flex flex-wrap gap-2">
              {data.assignments.bySubject.map((item) => (
                <span
                  key={item.subject_name}
                  className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700"
                >
                  {item.subject_name}: {item.count}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Class Performance Summary */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
          <TrendingUp size={18} className="text-indigo-600" />
          Class Overview
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-slate-50 p-4 text-center">
            <p className="text-xs font-medium text-slate-500">Total Classes</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{data.classes.total}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 text-center">
            <p className="text-xs font-medium text-slate-500">Total Sections</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{data.classes.sections}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 text-center">
            <p className="text-xs font-medium text-slate-500">Outstanding Fees</p>
            <p className="mt-1 text-xl font-bold text-red-600">{formatCurrency(data.fees.outstanding)}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 text-center">
            <p className="text-xs font-medium text-slate-500">Pass Rate</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{data.results.pass_rate}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  subtitle?: string;
}

function StatCard({ title, value, icon, iconColor, iconBg, subtitle }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        </div>
        <div className={`rounded-xl p-3 ${iconBg}`}>
          <div className={iconColor}>{icon}</div>
        </div>
      </div>
    </div>
  );
}
