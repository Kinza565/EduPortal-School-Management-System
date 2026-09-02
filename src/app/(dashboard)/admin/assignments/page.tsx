"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Plus, ClipboardList } from "lucide-react";
import { TeacherAssignmentStats } from "@/components/assignments/TeacherAssignmentStats";
import { TeacherAssignmentTable } from "@/components/assignments/TeacherAssignmentTable";
import { TeacherAssignmentFilters } from "@/components/assignments/TeacherAssignmentFilters";
import { TeacherAssignmentForm, type AssignmentFormData } from "@/components/assignments/TeacherAssignmentForm";
import { TeacherAssignmentDetails } from "@/components/assignments/TeacherAssignmentDetails";
import { TeacherAssignmentStatusDialog } from "@/components/assignments/TeacherAssignmentStatusDialog";
import { Pagination } from "@/components/ui/pagination";
import type { Profile, Class, Section, Subject, TeacherAssignment } from "@/types/database";

type AssignmentWithDetails = TeacherAssignment & {
  profiles: Profile;
  classes: Class;
  sections: Section;
  subjects: Subject;
};

const PAGE_SIZE = 20;

export default function AdminAssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([]);
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [teacherFilter, setTeacherFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  // UI States
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentWithDetails | null>(null);
  const [viewingAssignment, setViewingAssignment] = useState<AssignmentWithDetails | null>(null);
  const [removingAssignment, setRemovingAssignment] = useState<AssignmentWithDetails | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  }, [searchQuery, teacherFilter, subjectFilter, classFilter, sectionFilter, roleFilter]);

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

    setError(null);

    // Build query with server-side filters
    let query = supabase
      .from("teacher_assignments")
      .select("*, profiles(*), classes(*), sections(*), subjects(*)", { count: "exact" })
      .eq("school_id", profile.school_id);

    // Apply teacher filter server-side
    if (teacherFilter !== "all") {
      query = query.eq("teacher_id", teacherFilter);
    }

    // Apply subject filter server-side
    if (subjectFilter !== "all") {
      query = query.eq("subject_id", subjectFilter);
    }

    // Apply class filter server-side
    if (classFilter !== "all") {
      query = query.eq("class_id", classFilter);
    }

    // Apply section filter server-side
    if (sectionFilter !== "all") {
      query = query.eq("section_id", sectionFilter);
    }

    // Apply role filter server-side
    if (roleFilter === "class_teacher") {
      query = query.eq("is_class_teacher", true);
    } else if (roleFilter === "subject_teacher") {
      query = query.eq("is_class_teacher", false);
    }

    // Apply pagination
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE - 1;

    const [assignmentsRes, teachersRes, classesRes, sectionsRes, subjectsRes] = await Promise.all([
      query.order("created_at", { ascending: false }).range(startIndex, endIndex),
      supabase
        .from("profiles")
        .select("*")
        .eq("school_id", profile.school_id)
        .eq("role", "teacher")
        .eq("is_active", true)
        .order("full_name"),
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
      supabase
        .from("subjects")
        .select("*")
        .eq("school_id", profile.school_id)
        .eq("is_active", true)
        .order("name"),
    ]);

    if (assignmentsRes.error) {
      setError("Failed to load assignments.");
      setIsLoading(false);
      return;
    }

    setAssignments((assignmentsRes.data as AssignmentWithDetails[]) || []);
    setTotalCount(assignmentsRes.count || 0);
    setTeachers(teachersRes.data || []);
    setClasses(classesRes.data || []);
    setSections(sectionsRes.data || []);
    setSubjects(subjectsRes.data || []);
    setIsLoading(false);
  }, [supabase, router, teacherFilter, subjectFilter, classFilter, sectionFilter, roleFilter, currentPage]);

  useEffect(() => {
    (async () => {
      await fetchData();
    })();
  }, [fetchData]);

  // Filtered sections based on selected class filter
  const filteredSections = useMemo(() => {
    if (classFilter === "all") return sections;
    return sections.filter((s) => s.class_id === classFilter);
  }, [classFilter, sections]);

  // Client-side search filter (for joined fields)
  const filteredAssignments = useMemo(() => {
    if (!searchQuery) return assignments;
    const search = searchQuery.toLowerCase();
    return assignments.filter((assignment) =>
      assignment.profiles?.full_name?.toLowerCase().includes(search) ||
      assignment.subjects?.name?.toLowerCase().includes(search) ||
      assignment.classes?.name?.toLowerCase().includes(search) ||
      assignment.sections?.name?.toLowerCase().includes(search)
    );
  }, [assignments, searchQuery]);

  // Stats
  const totalAssignments = totalCount;
  const uniqueTeachers = new Set(assignments.map((a) => a.teacher_id)).size;
  const uniqueSubjects = new Set(assignments.map((a) => a.subject_id)).size;
  const uniqueClasses = new Set(assignments.map((a) => a.class_id)).size;
  const classTeachers = assignments.filter((a) => a.is_class_teacher).length;

  const clearFilters = () => {
    setSearchQuery("");
    setTeacherFilter("all");
    setSubjectFilter("all");
    setClassFilter("all");
    setSectionFilter("all");
    setRoleFilter("all");
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    teacherFilter !== "all" ||
    subjectFilter !== "all" ||
    classFilter !== "all" ||
    sectionFilter !== "all" ||
    roleFilter !== "all";

  // Handlers
  const handleCreateAssignment = () => {
    setEditingAssignment(null);
    setShowForm(true);
  };

  const handleEditAssignment = (id: string) => {
    const assignment = assignments.find((a) => a.id === id);
    if (assignment) {
      setEditingAssignment(assignment);
      setShowForm(true);
    }
  };

  const handleViewAssignment = (id: string) => {
    const assignment = assignments.find((a) => a.id === id);
    if (assignment) {
      setViewingAssignment(assignment);
    }
  };

  const handleRemoveAssignment = (id: string) => {
    const assignment = assignments.find((a) => a.id === id);
    if (assignment) {
      setRemovingAssignment(assignment);
    }
  };

  const handleFormSubmit = async (formData: AssignmentFormData) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

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

      // Validate section belongs to class
      const section = sections.find((s) => s.id === formData.section_id);
      if (!section || section.class_id !== formData.class_id) {
        setError("Selected section does not belong to the selected class.");
        setIsSubmitting(false);
        return;
      }

      if (editingAssignment) {
        // Update existing assignment
        const { error: updateError } = await supabase
          .from("teacher_assignments")
          .update({
            teacher_id: formData.teacher_id,
            class_id: formData.class_id,
            section_id: formData.section_id,
            subject_id: formData.subject_id,
            is_class_teacher: formData.is_class_teacher,
          })
          .eq("id", editingAssignment.id);

        if (updateError) {
          if (updateError.code === "23505") {
            setError("This teacher is already assigned to this subject, class, and section.");
          } else {
            setError("Failed to update assignment.");
          }
          setIsSubmitting(false);
          return;
        }
        setSuccess("Assignment updated successfully.");
      } else {
        // Create new assignment
        const { error: insertError } = await supabase.from("teacher_assignments").insert({
          school_id: adminProfile.school_id,
          teacher_id: formData.teacher_id,
          class_id: formData.class_id,
          section_id: formData.section_id,
          subject_id: formData.subject_id,
          is_class_teacher: formData.is_class_teacher,
        });

        if (insertError) {
          if (insertError.code === "23505") {
            setError("This teacher is already assigned to this subject, class, and section.");
          } else {
            setError("Failed to create assignment.");
          }
          setIsSubmitting(false);
          return;
        }
        setSuccess("Assignment created successfully.");
      }

      setShowForm(false);
      setEditingAssignment(null);
      await fetchData();
    } catch (err) {
      console.error("Form submission error:", err);
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (!removingAssignment) return;

    setError(null);
    setSuccess(null);

    try {
      const { error: deleteError } = await supabase
        .from("teacher_assignments")
        .delete()
        .eq("id", removingAssignment.id);

      if (deleteError) {
        setError("Failed to remove assignment.");
        return;
      }

      setAssignments(assignments.filter((a) => a.id !== removingAssignment.id));
      setRemovingAssignment(null);
      setSuccess("Assignment removed successfully.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Remove error:", err);
      setError("Failed to remove assignment.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 lg:text-3xl">Teacher Assignments</h1>
          <p className="text-slate-500">
            Assign teachers to subjects, classes, and sections.
          </p>
        </div>
        <button
          onClick={handleCreateAssignment}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <Plus size={18} />
          Create Assignment
        </button>
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

      {/* Stats */}
      <TeacherAssignmentStats
        total={totalAssignments}
        activeTeachers={uniqueTeachers}
        subjectsAssigned={uniqueSubjects}
        classesCovered={uniqueClasses}
        classTeachers={classTeachers}
      />

      {/* Filters */}
      <TeacherAssignmentFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        teacherFilter={teacherFilter}
        onTeacherChange={setTeacherFilter}
        subjectFilter={subjectFilter}
        onSubjectChange={setSubjectFilter}
        classFilter={classFilter}
        onClassChange={setClassFilter}
        sectionFilter={sectionFilter}
        onSectionChange={setSectionFilter}
        roleFilter={roleFilter}
        onRoleChange={setRoleFilter}
        teachers={teachers.map((t) => ({ id: t.id, full_name: t.full_name }))}
        subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
        classes={classes.map((c) => ({ id: c.id, name: c.name }))}
        sections={filteredSections.map((s) => ({ id: s.id, name: s.name }))}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Assignment Table */}
      <TeacherAssignmentTable
        assignments={filteredAssignments.map((a) => ({
          id: a.id,
          teacher_name: a.profiles?.full_name || "Unknown",
          subject_name: a.subjects?.name || "Unknown",
          subject_code: a.subjects?.code,
          class_name: a.classes?.name || "Unknown",
          section_name: a.sections?.name || "Unknown",
          is_class_teacher: a.is_class_teacher,
          created_at: a.created_at,
        }))}
        onView={handleViewAssignment}
        onEdit={handleEditAssignment}
        onRemove={handleRemoveAssignment}
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

      {/* Empty State for No Assignments */}
      {assignments.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <ClipboardList className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700">No teacher assignments yet</h3>
          <p className="mt-1 text-sm text-slate-500">
            Create your first assignment to assign teachers to classes and subjects.
          </p>
          <button
            onClick={handleCreateAssignment}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus size={16} />
            Create your first assignment
          </button>
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <TeacherAssignmentForm
          assignment={editingAssignment}
          teachers={teachers.map((t) => ({ id: t.id, full_name: t.full_name }))}
          subjects={subjects.map((s) => ({ id: s.id, name: s.name, code: s.code }))}
          classes={classes.map((c) => ({ id: c.id, name: c.name }))}
          sections={sections.map((s) => ({ id: s.id, name: s.name, class_id: s.class_id }))}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingAssignment(null);
          }}
          isLoading={isSubmitting}
        />
      )}

      {viewingAssignment && (
        <TeacherAssignmentDetails
          assignment={{
            id: viewingAssignment.id,
            teacher_name: viewingAssignment.profiles?.full_name || "Unknown",
            teacher_email: viewingAssignment.profiles?.email || undefined,
            teacher_phone: viewingAssignment.profiles?.phone || undefined,
            subject_name: viewingAssignment.subjects?.name || "Unknown",
            subject_code: viewingAssignment.subjects?.code,
            class_name: viewingAssignment.classes?.name || "Unknown",
            section_name: viewingAssignment.sections?.name || "Unknown",
            is_class_teacher: viewingAssignment.is_class_teacher,
            created_at: viewingAssignment.created_at,
            updated_at: viewingAssignment.updated_at,
          }}
          onClose={() => setViewingAssignment(null)}
          onEdit={() => {
            setViewingAssignment(null);
            handleEditAssignment(viewingAssignment.id);
          }}
          onRemove={() => {
            setViewingAssignment(null);
            setRemovingAssignment(viewingAssignment);
          }}
        />
      )}

      {removingAssignment && (
        <TeacherAssignmentStatusDialog
          assignmentInfo={{
            teacher_name: removingAssignment.profiles?.full_name || "Unknown",
            subject_name: removingAssignment.subjects?.name || "Unknown",
            class_name: removingAssignment.classes?.name || "Unknown",
            section_name: removingAssignment.sections?.name || "Unknown",
          }}
          onConfirm={handleConfirmRemove}
          onCancel={() => setRemovingAssignment(null)}
        />
      )}
    </div>
  );
}
