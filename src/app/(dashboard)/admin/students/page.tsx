"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Plus, GraduationCap } from "lucide-react";
import { StudentStats } from "@/components/students/StudentStats";
import { StudentTable } from "@/components/students/StudentTable";
import { StudentFilters } from "@/components/students/StudentFilters";
import { StudentDetails } from "@/components/students/StudentDetails";
import { StudentStatusDialog } from "@/components/students/StudentStatusDialog";
import { Pagination } from "@/components/ui/pagination";
import type { Class, Section, Student } from "@/types/database";

type StudentWithRelations = Student & {
  classes: { name: string } | null;
  sections: { name: string } | null;
};

const PAGE_SIZE = 20;

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentWithRelations[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");

  // UI States
  const [viewingStudent, setViewingStudent] = useState<StudentWithRelations | null>(null);
  const [statusStudent, setStatusStudent] = useState<StudentWithRelations | null>(null);

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
  }, [searchQuery, statusFilter, classFilter, sectionFilter]);

  const fetchData = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, school_id")
      .eq("id", session.user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      router.push("/login");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Build query with filters
      let query = supabase
        .from("students")
        .select("*, classes!class_id(name), sections!section_id(name)", { count: "exact" })
        .eq("school_id", profile.school_id);

      // Apply search filter
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        query = query.or(
          `full_name.ilike.%${search}%,student_id.ilike.%${search}%,roll_number.ilike.%${search}%`
        );
      }

      // Apply status filter
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      // Apply class filter
      if (classFilter !== "all") {
        query = query.eq("class_id", classFilter);
      }

      // Apply section filter
      if (sectionFilter !== "all") {
        query = query.eq("section_id", sectionFilter);
      }

      // Apply pagination
      const startIndex = (currentPage - 1) * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE - 1;

      const { data, count, error: studentsError } = await query
        .order("created_at", { ascending: false })
        .range(startIndex, endIndex);

      if (studentsError) {
        setError("Failed to load students.");
      } else {
        setStudents(data as StudentWithRelations[] || []);
        setTotalCount(count || 0);
      }
    } catch (err) {
      setError("Failed to load students.");
    } finally {
      setIsLoading(false);
    }
  }, [supabase, router, searchQuery, statusFilter, classFilter, sectionFilter, currentPage]);

  const fetchStaticData = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, school_id")
      .eq("id", session.user.id)
      .single();

    if (!profile || profile.role !== "admin") return;

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

    if (!classesRes.error) {
      setClasses(classesRes.data || []);
    }
    if (!sectionsRes.error) {
      setSections(sectionsRes.data || []);
    }
  }, [supabase]);

  useEffect(() => {
    (async () => {
      await Promise.all([fetchStaticData(), fetchData()]);
    })();
  }, [fetchStaticData, fetchData]);

  // Stats (from total count)
  const totalStudents = totalCount;
  const activeStudents = students.filter((s) => s.status === "active").length;

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setClassFilter("all");
    setSectionFilter("all");
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    statusFilter !== "all" ||
    classFilter !== "all" ||
    sectionFilter !== "all";

  // Handlers
  const handleViewStudent = (id: string) => {
    const student = students.find((s) => s.id === id);
    if (student) {
      setViewingStudent(student);
    }
  };

  const handleEditStudent = (id: string) => {
    router.push(`/admin/students/${id}/edit`);
  };

  const handleStatusChange = (id: string) => {
    const student = students.find((s) => s.id === id);
    if (student) {
      setStatusStudent(student);
    }
  };

  const handleStatusToggle = async () => {
    if (!statusStudent) return;

    try {
      const newStatus = statusStudent.status === "active" ? "inactive" : "active";
      const { error } = await supabase
        .from("students")
        .update({ status: newStatus })
        .eq("id", statusStudent.id);

      if (error) {
        setError("Failed to update student status.");
        return;
      }

      setStatusStudent(null);
      fetchData();
    } catch (err) {
      console.error("Status update error:", err);
      setError("Failed to update student status.");
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading && students.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 lg:text-3xl">Students</h1>
          <p className="text-slate-500">
            Manage student records, classes, sections, and enrollment.
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/students/new")}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Student
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats */}
      <StudentStats
        total={totalStudents}
        active={activeStudents}
        inactive={0}
        graduated={0}
        totalClasses={classes.length}
        totalSections={sections.length}
      />

      {/* Filters */}
      <StudentFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        classFilter={classFilter}
        onClassChange={setClassFilter}
        sectionFilter={sectionFilter}
        onSectionChange={setSectionFilter}
        classes={classes}
        sections={sections}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Student Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <StudentTable
          students={students.map((s) => ({
            id: s.id,
            student_id: s.student_id,
            full_name: s.full_name,
            class_name: s.classes?.name || "—",
            section_name: s.sections?.name || "—",
            roll_number: s.roll_number,
            status: s.status,
            admission_date: s.admission_date,
          }))}
          onView={handleViewStudent}
          onEdit={handleEditStudent}
          isLoading={isLoading}
        />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={totalCount}
          pageSize={PAGE_SIZE}
          onPageChange={handlePageChange}
          isLoading={isLoading}
        />
      </div>

      {/* Empty State for No Students */}
      {totalCount === 0 && !isLoading && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <GraduationCap className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700">No students found</h3>
          <p className="mt-1 text-sm text-slate-500">
            {hasActiveFilters
              ? "Try adjusting your search or filters."
              : "Add your first student to get started."}
          </p>
        </div>
      )}

      {/* Modals */}
      {viewingStudent && (
        <StudentDetails
          student={{
            id: viewingStudent.id,
            student_id: viewingStudent.student_id,
            roll_number: viewingStudent.roll_number,
            full_name: viewingStudent.full_name,
            father_name: viewingStudent.father_name,
            guardian_name: viewingStudent.guardian_name,
            date_of_birth: viewingStudent.date_of_birth,
            gender: viewingStudent.gender,
            phone: viewingStudent.phone,
            address: viewingStudent.address,
            admission_date: viewingStudent.admission_date,
            class_name: viewingStudent.classes?.name || null,
            section_name: viewingStudent.sections?.name || null,
            status: viewingStudent.status,
            photo_url: viewingStudent.photo_url,
            created_at: viewingStudent.created_at,
            updated_at: viewingStudent.updated_at,
          }}
          onClose={() => setViewingStudent(null)}
          onEdit={() => {
            setViewingStudent(null);
            handleEditStudent(viewingStudent.id);
          }}
          onStatusChange={() => {
            setViewingStudent(null);
            setStatusStudent(viewingStudent);
          }}
        />
      )}

      {statusStudent && (
        <StudentStatusDialog
          studentName={statusStudent.full_name}
          studentId={statusStudent.student_id}
          isActive={statusStudent.status === "active"}
          onConfirm={handleStatusToggle}
          onCancel={() => setStatusStudent(null)}
        />
      )}
    </div>
  );
}
