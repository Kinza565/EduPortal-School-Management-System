"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Save, CheckCheck, CalendarDays } from "lucide-react";
import { AttendanceStats } from "@/components/attendance/AttendanceStats";
import { AttendanceFilters } from "@/components/attendance/AttendanceFilters";
import { AttendanceTable } from "@/components/attendance/AttendanceTable";
import type { Class, Section, Student, AttendanceRecord } from "@/types/database";

type AttendanceStatus = "present" | "absent" | "late" | "excused";

interface StudentWithAttendance extends Omit<Student, "status"> {
  attendance_status: AttendanceStatus | null;
  attendance_remarks: string | null;
  attendance_id: string | null;
}

export default function AdminAttendancePage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [students, setStudents] = useState<StudentWithAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Track changes
  const [hasChanges, setHasChanges] = useState(false);

  const supabase = createClient();
  const router = useRouter();

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

  const fetchStudentsWithAttendance = useCallback(async () => {
    if (!classFilter || !sectionFilter) {
      setStudents([]);
      return;
    }

    setIsLoadingStudents(true);
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

      // Fetch students in the selected section
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("*")
        .eq("school_id", profile.school_id)
        .eq("class_id", classFilter)
        .eq("section_id", sectionFilter)
        .eq("status", "active")
        .order("roll_number");

      if (studentsError) {
        setError("Failed to load students.");
        setIsLoadingStudents(false);
        return;
      }

      // Fetch attendance for the selected date
      const { data: attendanceData } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("school_id", profile.school_id)
        .eq("attendance_date", selectedDate)
        .eq("class_id", classFilter)
        .eq("section_id", sectionFilter);

      const attendanceMap = new Map<string, AttendanceRecord>();
      if (attendanceData) {
        attendanceData.forEach((record) => {
          attendanceMap.set(record.student_id, record);
        });
      }

      const studentsWithAttendance: StudentWithAttendance[] = (studentsData || []).map((student) => {
        const attendance = attendanceMap.get(student.id);
        return {
          ...student,
          attendance_status: attendance?.status || null,
          attendance_remarks: attendance?.remarks || null,
          attendance_id: attendance?.id || null,
        };
      });

      setStudents(studentsWithAttendance);
      setHasChanges(false);
    } catch (err) {
      console.error("Error loading students:", err);
      setError("Failed to load students.");
    } finally {
      setIsLoadingStudents(false);
    }
  }, [supabase, router, classFilter, sectionFilter, selectedDate]);

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
        await fetchStudentsWithAttendance();
      }
    })();
  }, [isLoading, fetchStudentsWithAttendance]);

  // Filtered sections based on selected class
  const filteredSections = useMemo(() => {
    if (!classFilter) return [];
    return sections.filter((s) => s.class_id === classFilter);
  }, [classFilter, sections]);

  // Filtered students based on search and status
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        searchQuery === "" ||
        student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.roll_number && student.roll_number.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "present" && student.attendance_status === "present") ||
        (statusFilter === "absent" && student.attendance_status === "absent") ||
        (statusFilter === "late" && student.attendance_status === "late") ||
        (statusFilter === "excused" && student.attendance_status === "excused") ||
        (statusFilter === "unmarked" && student.attendance_status === null);

      return matchesSearch && matchesStatus;
    });
  }, [students, searchQuery, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = students.length;
    const present = students.filter((s) => s.attendance_status === "present").length;
    const absent = students.filter((s) => s.attendance_status === "absent").length;
    const late = students.filter((s) => s.attendance_status === "late").length;
    const excused = students.filter((s) => s.attendance_status === "excused").length;
    const marked = present + absent + late + excused;
    const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return { total, present, absent, late, excused, marked, percentage };
  }, [students]);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  const hasActiveFilters = searchQuery !== "" || statusFilter !== "all";

  // Handlers
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === studentId
          ? { ...student, attendance_status: status }
          : student
      )
    );
    setHasChanges(true);
  };

  const handleMarkAllPresent = () => {
    setStudents((prev) =>
      prev.map((student) => ({
        ...student,
        attendance_status: "present" as AttendanceStatus,
      }))
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!hasChanges) {
      setError("No changes to save.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

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
        setIsSaving(false);
        return;
      }

      // Prepare attendance records for upsert
      const attendanceRecords = students
        .filter((student) => student.attendance_status !== null)
        .map((student) => ({
          id: student.attendance_id || undefined,
          school_id: profile.school_id,
          student_id: student.id,
          class_id: student.class_id!,
          section_id: student.section_id!,
          attendance_date: selectedDate,
          status: student.attendance_status!,
          marked_by: session.user.id,
          remarks: student.attendance_remarks || null,
        }));

      // Use upsert to handle duplicates (based on unique constraint)
      const { error: upsertError } = await supabase
        .from("attendance_records")
        .upsert(attendanceRecords, {
          onConflict: "school_id,student_id,attendance_date",
          ignoreDuplicates: false,
        });

      if (upsertError) {
        console.error("Upsert error:", upsertError);
        setError("Failed to save attendance. Please try again.");
        setIsSaving(false);
        return;
      }

      setSuccess(`Attendance saved successfully for ${students.length} students.`);
      setHasChanges(false);
      setTimeout(() => setSuccess(null), 3000);

      // Refresh data
      await fetchStudentsWithAttendance();
    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save attendance.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading attendance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 lg:text-3xl">Attendance</h1>
          <p className="text-slate-500">
            Track and manage daily student attendance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleMarkAllPresent}
            disabled={students.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCheck size={18} />
            Mark All Present
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={18} />
            {isSaving ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {/* Filters */}
      <AttendanceFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        date={selectedDate}
        onDateChange={setSelectedDate}
        classId={classFilter}
        onClassChange={setClassFilter}
        sectionId={sectionFilter}
        onSectionChange={setSectionFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        classes={classes.map((c) => ({ id: c.id, name: c.name }))}
        sections={filteredSections.map((s) => ({ id: s.id, name: s.name }))}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Stats */}
      {students.length > 0 && (
        <AttendanceStats
          total={stats.total}
          present={stats.present}
          absent={stats.absent}
          late={stats.late}
          excused={stats.excused}
          percentage={stats.percentage}
        />
      )}

      {/* Selection Prompt */}
      {!classFilter || !sectionFilter ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <CalendarDays className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700">Select Class and Section</h3>
          <p className="mt-1 text-sm text-slate-500">
            Choose a class and section above to view and mark attendance.
          </p>
        </div>
      ) : (
        <>
          {/* Changes indicator */}
          {hasChanges && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
              You have unsaved changes. Click &quot;Save Attendance&quot; to save.
            </div>
          )}

          {/* Attendance Table */}
          <AttendanceTable
            students={filteredStudents.map((s) => ({
              student_id: s.id,
              student_name: s.full_name,
              student_code: s.student_id,
              roll_number: s.roll_number,
              status: s.attendance_status,
              remarks: s.attendance_remarks,
            }))}
            onStatusChange={handleStatusChange}
            isLoading={isLoadingStudents}
          />
        </>
      )}

      {/* Summary */}
      {students.length > 0 && (
        <div className="text-sm text-slate-500">
          Showing {filteredStudents.length} of {students.length} students
          {stats.marked > 0 && ` • ${stats.marked} marked`}
        </div>
      )}
    </div>
  );
}
