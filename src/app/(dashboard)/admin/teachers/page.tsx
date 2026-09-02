"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Plus, Users } from "lucide-react";
import { TeacherStats } from "@/components/teachers/TeacherStats";
import { TeacherTable } from "@/components/teachers/TeacherTable";
import { TeacherFilters } from "@/components/teachers/TeacherFilters";
import { TeacherForm, type TeacherFormData } from "@/components/teachers/TeacherForm";
import { TeacherDetails } from "@/components/teachers/TeacherDetails";
import { DeleteTeacherDialog } from "@/components/teachers/DeleteTeacherDialog";
import { Pagination } from "@/components/ui/pagination";
import type { Profile, TeacherDetail, TeacherAssignment, Subject, Class } from "@/types/database";

type TeacherWithDetails = Profile & {
  teacher_details: TeacherDetail | null;
  assignments: (TeacherAssignment & { classes: Class; subjects: Subject })[];
};

const PAGE_SIZE = 20;

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<TeacherWithDetails[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");

  // UI States
  const [showForm, setShowForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherWithDetails | null>(null);
  const [viewingTeacher, setViewingTeacher] = useState<TeacherWithDetails | null>(null);
  const [statusTeacher, setStatusTeacher] = useState<TeacherWithDetails | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  // Reset to page 1 when filters change (skip initial render)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const fetchData = useCallback(async () => {
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
        .select("role, school_id")
        .eq("id", session.user.id)
        .single();

      if (!profile || profile.role !== "admin") {
        router.push("/login");
        return;
      }

      setError(null);

      // Build query with server-side filters
      let query = supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .eq("school_id", profile.school_id)
        .eq("role", "teacher");

      // Apply search filter server-side
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
      }

      // Apply status filter server-side
      if (statusFilter === "active") {
        query = query.eq("is_active", true);
      } else if (statusFilter === "inactive") {
        query = query.eq("is_active", false);
      }

      // Apply pagination
      const startIndex = (currentPage - 1) * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE - 1;

      const [teachersRes, detailsRes, assignmentsRes, subjectsRes, classesRes] = await Promise.all([
        query.order("full_name").range(startIndex, endIndex),
        supabase.from("teacher_details").select("*"),
        supabase
          .from("teacher_assignments")
          .select("*, classes(*), subjects(*)")
          .eq("school_id", profile.school_id),
        supabase
          .from("subjects")
          .select("*")
          .eq("school_id", profile.school_id)
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("classes")
          .select("*")
          .eq("school_id", profile.school_id)
          .eq("is_active", true)
          .order("name"),
      ]);

      if (teachersRes.error) {
        setError(`Failed to load teachers: ${teachersRes.error.message}`);
        return;
      }
      if (detailsRes.error) {
        setError(`Failed to load teacher details: ${detailsRes.error.message}`);
        return;
      }
      if (assignmentsRes.error) {
        setError(`Failed to load teacher assignments: ${assignmentsRes.error.message}`);
        return;
      }

      const teacherProfiles = (teachersRes.data || []) as Profile[];
      const teacherDetails = (detailsRes.data || []) as TeacherDetail[];
      const assignments = (assignmentsRes.data || []) as (TeacherAssignment & { classes: Class; subjects: Subject })[];

      const detailsMap = new Map<string, TeacherDetail>();
      teacherDetails.forEach((d) => detailsMap.set(d.profile_id, d));

      const assignmentsMap = new Map<string, typeof assignments>();
      assignments.forEach((a) => {
        if (!assignmentsMap.has(a.teacher_id)) {
          assignmentsMap.set(a.teacher_id, []);
        }
        assignmentsMap.get(a.teacher_id)!.push(a);
      });

      const teachersWithDetails: TeacherWithDetails[] = teacherProfiles.map((t) => ({
        ...t,
        teacher_details: detailsMap.get(t.id) || null,
        assignments: assignmentsMap.get(t.id) || [],
      }));

      setTeachers(teachersWithDetails);
      setTotalCount(teachersRes.count || 0);
      setSubjects(subjectsRes.data || []);
      setClasses(classesRes.data || []);
    } catch (err) {
      console.error("fetchData error:", err);
      setError(`Failed to load teachers: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, router, searchQuery, statusFilter, currentPage]);

  useEffect(() => {
    (async () => {
      await fetchData();
    })();
  }, [fetchData]);

  // Client-side filters for assignment-based filters (subject, class)
  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSubject =
      subjectFilter === "all" ||
      teacher.assignments.some((a) => a.subject_id === subjectFilter);

    const matchesClass =
      classFilter === "all" ||
      teacher.assignments.some((a) => a.class_id === classFilter);

    return matchesSubject && matchesClass;
  });

  // Reset to page 1 when assignment-based filters change (skip initial render)
  const isAssignmentFilterInitialMount = useRef(true);
  useEffect(() => {
    if (isAssignmentFilterInitialMount.current) {
      isAssignmentFilterInitialMount.current = false;
      return;
    }
    setCurrentPage(1);
  }, [subjectFilter, classFilter]);

  // Stats (total from server, others from current page)
  const totalTeachers = totalCount;
  const activeTeachers = teachers.filter((t) => t.is_active).length;
  const inactiveTeachers = teachers.filter((t) => !t.is_active).length;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentTeachers = teachers.filter(
    (t) => new Date(t.created_at) >= thirtyDaysAgo
  ).length;

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSubjectFilter("all");
    setClassFilter("all");
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    statusFilter !== "all" ||
    subjectFilter !== "all" ||
    classFilter !== "all";

  // Handlers
  const handleAddTeacher = () => {
    setEditingTeacher(null);
    setFormError(null);
    setSuccessMessage(null);
    setShowForm(true);
  };

  const handleEditTeacher = (id: string) => {
    const teacher = teachers.find((t) => t.id === id);
    if (teacher) {
      setEditingTeacher(teacher);
      setShowForm(true);
    }
  };

  const handleViewTeacher = (id: string) => {
    const teacher = teachers.find((t) => t.id === id);
    if (teacher) {
      setViewingTeacher(teacher);
    }
  };

  const handleDeactivateTeacher = (id: string) => {
    const teacher = teachers.find((t) => t.id === id);
    if (teacher) {
      setStatusTeacher(teacher);
    }
  };

  const handleFormSubmit = async (formData: TeacherFormData) => {
    setIsSubmitting(true);
    setFormError(null);
    setSuccessMessage(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.push("/login");
        return;
      }

      const { data: adminProfile } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("id", sessionData.session.user.id)
        .single();

      if (!adminProfile) {
        setError("Failed to get admin profile.");
        setIsSubmitting(false);
        return;
      }

      const fullName = `${formData.first_name} ${formData.last_name}`.trim();

      if (editingTeacher) {
        // Update existing teacher profile
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            full_name: fullName,
            email: formData.email,
            phone: formData.phone,
            is_active: formData.is_active,
          })
          .eq("id", editingTeacher.id);

        if (profileError) {
          if (profileError.code === "23505") {
            setError("A teacher with this email already exists.");
          } else {
            setError("Failed to update teacher.");
          }
          setIsSubmitting(false);
          return;
        }

        // Update teacher details
        const { error: detailsError } = await supabase
          .from("teacher_details")
          .upsert({
            profile_id: editingTeacher.id,
            employee_id: formData.employee_id || null,
            joining_date: formData.joining_date || null,
            qualification: formData.qualification || null,
            specialization: formData.specialization || null,
          });

        if (detailsError) {
          setError("Failed to update teacher details.");
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await fetch("/api/admin/create-teacher", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            employee_id: formData.employee_id,
            joining_date: formData.joining_date,
            qualification: formData.qualification,
            specialization: formData.specialization,
          }),
        });

        const result = await res.json();

        if (!res.ok) {
          setFormError(result.error || "Failed to create teacher.");
          setIsSubmitting(false);
          return;
        }

        setSuccessMessage("Teacher added successfully.");
      }

      setShowForm(false);
      setEditingTeacher(null);
      await fetchData();
    } catch (err) {
      console.error("Form submission error:", err);
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!statusTeacher) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: !statusTeacher.is_active })
        .eq("id", statusTeacher.id);

      if (error) {
        setError("Failed to update teacher status.");
        return;
      }

      setStatusTeacher(null);
      await fetchData();
    } catch (err) {
      console.error("Status update error:", err);
      setError("Failed to update teacher status.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading teachers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 lg:text-3xl">Teachers</h1>
          <p className="text-slate-500">
            Manage your school&apos;s teaching staff.
          </p>
        </div>
        <button
          onClick={handleAddTeacher}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Teacher
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Success */}
      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      {/* Stats */}
      <TeacherStats
        total={totalTeachers}
        active={activeTeachers}
        inactive={inactiveTeachers}
        recent={recentTeachers}
      />

      {/* Filters */}
      <TeacherFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        subjectFilter={subjectFilter}
        onSubjectChange={setSubjectFilter}
        classFilter={classFilter}
        onClassChange={setClassFilter}
        subjects={subjects}
        classes={classes}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Teacher Table */}
      <TeacherTable
        teachers={filteredTeachers.map((t) => ({
          id: t.id,
          full_name: t.full_name,
          email: t.email,
          phone: t.phone,
          avatar_url: t.avatar_url,
          is_active: t.is_active,
          created_at: t.created_at,
          employee_id: t.teacher_details?.employee_id,
          joining_date: t.teacher_details?.joining_date,
          assignments_count: t.assignments.length,
        }))}
        onView={handleViewTeacher}
        onEdit={handleEditTeacher}
        onDeactivate={handleDeactivateTeacher}
        onActivate={handleDeactivateTeacher}
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

      {/* Empty State for No Teachers */}
      {teachers.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700">No teachers yet</h3>
          <p className="mt-1 text-sm text-slate-500">
            Create user accounts with the &quot;teacher&quot; role to add teachers.
          </p>
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <TeacherForm
          teacher={editingTeacher}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingTeacher(null);
            setFormError(null);
          }}
          isLoading={isSubmitting}
          serverError={formError}
        />
      )}

      {viewingTeacher && (
        <TeacherDetails
          teacher={{
            id: viewingTeacher.id,
            full_name: viewingTeacher.full_name,
            email: viewingTeacher.email,
            phone: viewingTeacher.phone,
            avatar_url: viewingTeacher.avatar_url,
            is_active: viewingTeacher.is_active,
            created_at: viewingTeacher.created_at,
            employee_id: viewingTeacher.teacher_details?.employee_id,
            joining_date: viewingTeacher.teacher_details?.joining_date,
            qualification: viewingTeacher.teacher_details?.qualification,
            specialization: viewingTeacher.teacher_details?.specialization,
            assignments: viewingTeacher.assignments.map((a) => ({
              classes: a.classes,
              sections: null,
              subjects: a.subjects,
            })),
          }}
          onClose={() => setViewingTeacher(null)}
          onEdit={() => {
            setViewingTeacher(null);
            handleEditTeacher(viewingTeacher.id);
          }}
          onToggleStatus={() => {
            setViewingTeacher(null);
            setStatusTeacher(viewingTeacher);
          }}
        />
      )}

      {statusTeacher && (
        <DeleteTeacherDialog
          teacherName={statusTeacher.full_name}
          isActive={statusTeacher.is_active}
          onConfirm={handleToggleStatus}
          onCancel={() => setStatusTeacher(null)}
        />
      )}
    </div>
  );
}
