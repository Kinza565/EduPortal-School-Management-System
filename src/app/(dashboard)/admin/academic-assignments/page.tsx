"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Plus, ClipboardList } from "lucide-react";
import { AssignmentStats } from "@/components/academic-assignments/AssignmentStats";
import { AssignmentTable } from "@/components/academic-assignments/AssignmentTable";
import { AssignmentFilters } from "@/components/academic-assignments/AssignmentFilters";
import { AssignmentForm, type AssignmentFormData } from "@/components/academic-assignments/AssignmentForm";
import { AssignmentDetails } from "@/components/academic-assignments/AssignmentDetails";
import { AssignmentStatusDialog } from "@/components/academic-assignments/AssignmentStatusDialog";
import type { AcademicAssignment, Class, Section, Subject, Profile } from "@/types/database";

type AssignmentWithDetails = AcademicAssignment & {
  profiles: Profile;
  classes: Class;
  sections: Section;
  subjects: Subject;
};

const getToday = () => new Date().toISOString().split("T")[0];

export default function AdminAssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [teacherFilter, setTeacherFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // UI States
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentWithDetails | null>(null);
  const [viewingAssignment, setViewingAssignment] = useState<AssignmentWithDetails | null>(null);
  const [deletingAssignment, setDeletingAssignment] = useState<AssignmentWithDetails | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supabase = createClient();
  const router = useRouter();

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

    const [assignmentsRes, subjectsRes, classesRes, sectionsRes, teachersRes] = await Promise.all([
      supabase
        .from("academic_assignments")
        .select("*, profiles(*), classes(*), sections(*), subjects(*)")
        .eq("school_id", profile.school_id)
        .order("due_date", { ascending: false }),
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
      supabase
        .from("sections")
        .select("*")
        .eq("school_id", profile.school_id)
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("profiles")
        .select("*")
        .eq("school_id", profile.school_id)
        .eq("role", "teacher")
        .eq("is_active", true)
        .order("full_name"),
    ]);

    if (assignmentsRes.error) {
      setError("Failed to load assignments.");
      setIsLoading(false);
      return;
    }

    setAssignments((assignmentsRes.data as AssignmentWithDetails[]) || []);
    setSubjects(subjectsRes.data || []);
    setClasses(classesRes.data || []);
    setSections(sectionsRes.data || []);
    setTeachers(teachersRes.data || []);
    setIsLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    (async () => {
      await fetchData();
    })();
  }, [fetchData]);

  // Filtered sections based on selected class
  const filteredSections = useMemo(() => {
    if (classFilter === "all") return sections;
    return sections.filter((s) => s.class_id === classFilter);
  }, [classFilter, sections]);

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];

    return assignments.filter((assignment) => {
      const matchesSearch =
        searchQuery === "" ||
        assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (assignment.description && assignment.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        assignment.subjects?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSubject =
        subjectFilter === "all" || assignment.subject_id === subjectFilter;

      const matchesClass =
        classFilter === "all" || assignment.class_id === classFilter;

      const matchesSection =
        sectionFilter === "all" || assignment.section_id === sectionFilter;

      const matchesTeacher =
        teacherFilter === "all" || assignment.teacher_id === teacherFilter;

      const matchesStatus =
        statusFilter === "all" || assignment.status === statusFilter;

      // Date filter
      let matchesDate = true;
      if (dateFilter === "due_today") {
        matchesDate = assignment.due_date === today;
      } else if (dateFilter === "overdue") {
        matchesDate = assignment.due_date < today && assignment.status === "active";
      } else if (dateFilter === "upcoming") {
        matchesDate = assignment.due_date > today;
      }

      return matchesSearch && matchesSubject && matchesClass && matchesSection && matchesTeacher && matchesStatus && matchesDate;
    });
  }, [assignments, searchQuery, subjectFilter, classFilter, sectionFilter, teacherFilter, statusFilter, dateFilter]);

  // Compute status based on dates
  const assignmentsWithComputedStatus = useMemo(() => {
    const today = getToday();

    return filteredAssignments.map((assignment) => {
      let computedStatus = "active";
      if (assignment.due_date < today && assignment.status === "active") {
        computedStatus = "overdue";
      } else if (assignment.due_date === today) {
        computedStatus = "due_today";
      } else if (assignment.due_date > today) {
        computedStatus = "upcoming";
      }

      return {
        ...assignment,
        computed_status: computedStatus,
      };
    });
  }, [filteredAssignments]);

  // Stats
  const today = getToday();
  const totalAssignments = assignments.length;
  const activeAssignments = assignments.filter((a) => a.status === "active").length;
  const upcomingAssignments = assignments.filter((a) => a.due_date > today).length;
  const dueTodayAssignments = assignments.filter((a) => a.due_date === today).length;
  const overdueAssignments = assignments.filter((a) => a.due_date < today && a.status === "active").length;

  const clearFilters = () => {
    setSearchQuery("");
    setSubjectFilter("all");
    setClassFilter("all");
    setSectionFilter("all");
    setTeacherFilter("all");
    setStatusFilter("all");
    setDateFilter("all");
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    subjectFilter !== "all" ||
    classFilter !== "all" ||
    sectionFilter !== "all" ||
    teacherFilter !== "all" ||
    statusFilter !== "all" ||
    dateFilter !== "all";

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

  const handleDeleteAssignment = (id: string) => {
    const assignment = assignments.find((a) => a.id === id);
    if (assignment) {
      setDeletingAssignment(assignment);
    }
  };

  const handleFormSubmit = async (formData: AssignmentFormData) => {
    setIsSubmitting(true);
    setError(null);

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
          .from("academic_assignments")
          .update({
            title: formData.title,
            description: formData.description || null,
            subject_id: formData.subject_id,
            class_id: formData.class_id,
            section_id: formData.section_id,
            teacher_id: formData.teacher_id,
            assigned_date: formData.assigned_date,
            due_date: formData.due_date,
            status: formData.status,
          })
          .eq("id", editingAssignment.id);

        if (updateError) {
          setError("Failed to update assignment.");
          setIsSubmitting(false);
          return;
        }
      } else {
        // Create new assignment
        const { error: insertError } = await supabase
          .from("academic_assignments")
          .insert({
            school_id: adminProfile.school_id,
            teacher_id: formData.teacher_id,
            class_id: formData.class_id,
            section_id: formData.section_id,
            subject_id: formData.subject_id,
            title: formData.title,
            description: formData.description || null,
            assigned_date: formData.assigned_date,
            due_date: formData.due_date,
            status: formData.status,
          });

        if (insertError) {
          setError("Failed to create assignment.");
          setIsSubmitting(false);
          return;
        }
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

  const handleConfirmDelete = async () => {
    if (!deletingAssignment) return;

    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from("academic_assignments")
        .delete()
        .eq("id", deletingAssignment.id);

      if (deleteError) {
        setError("Failed to delete assignment.");
        return;
      }

      setDeletingAssignment(null);
      await fetchData();
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete assignment.");
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
          <h1 className="text-2xl font-bold text-slate-800 lg:text-3xl">Assignments</h1>
          <p className="text-slate-500">
            Create and manage homework and academic assignments.
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

      {/* Stats */}
      <AssignmentStats
        total={totalAssignments}
        active={activeAssignments}
        upcoming={upcomingAssignments}
        dueToday={dueTodayAssignments}
        overdue={overdueAssignments}
      />

      {/* Filters */}
      <AssignmentFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        subjectFilter={subjectFilter}
        onSubjectChange={setSubjectFilter}
        classFilter={classFilter}
        onClassChange={setClassFilter}
        sectionFilter={sectionFilter}
        onSectionChange={setSectionFilter}
        teacherFilter={teacherFilter}
        onTeacherChange={setTeacherFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        dateFilter={dateFilter}
        onDateChange={setDateFilter}
        subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
        classes={classes.map((c) => ({ id: c.id, name: c.name }))}
        sections={filteredSections.map((s) => ({ id: s.id, name: s.name }))}
        teachers={teachers.map((t) => ({ id: t.id, full_name: t.full_name }))}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Assignment Table */}
      <AssignmentTable
        assignments={assignmentsWithComputedStatus.map((a) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          subject_name: a.subjects?.name || "Unknown",
          class_name: a.classes?.name || "Unknown",
          section_name: a.sections?.name || "Unknown",
          teacher_name: a.profiles?.full_name || "Unknown",
          assigned_date: a.assigned_date,
          due_date: a.due_date,
          status: a.status,
          computed_status: a.computed_status as "upcoming" | "due_today" | "overdue" | "active",
        }))}
        onView={handleViewAssignment}
        onEdit={handleEditAssignment}
        onDelete={handleDeleteAssignment}
      />

      {/* Empty State */}
      {assignments.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <ClipboardList className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700">No assignments yet</h3>
          <p className="mt-1 text-sm text-slate-500">
            Create your first assignment to manage homework and academic tasks.
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
        <AssignmentForm
          assignment={editingAssignment}
          subjects={subjects.map((s) => ({ id: s.id, name: s.name, code: s.code }))}
          classes={classes.map((c) => ({ id: c.id, name: c.name }))}
          sections={sections.map((s) => ({ id: s.id, name: s.name, class_id: s.class_id }))}
          teachers={teachers.map((t) => ({ id: t.id, full_name: t.full_name }))}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingAssignment(null);
          }}
          isLoading={isSubmitting}
        />
      )}

      {viewingAssignment && (
        <AssignmentDetails
          assignment={{
            id: viewingAssignment.id,
            title: viewingAssignment.title,
            description: viewingAssignment.description,
            subject_name: viewingAssignment.subjects?.name || "Unknown",
            subject_code: viewingAssignment.subjects?.code,
            class_name: viewingAssignment.classes?.name || "Unknown",
            section_name: viewingAssignment.sections?.name || "Unknown",
            teacher_name: viewingAssignment.profiles?.full_name || "Unknown",
            assigned_date: viewingAssignment.assigned_date,
            due_date: viewingAssignment.due_date,
            status: viewingAssignment.status,
            computed_status: viewingAssignment.due_date < today ? "overdue" : viewingAssignment.due_date === today ? "due_today" : "upcoming",
            created_at: viewingAssignment.created_at,
            updated_at: viewingAssignment.updated_at,
          }}
          onClose={() => setViewingAssignment(null)}
          onEdit={() => {
            setViewingAssignment(null);
            handleEditAssignment(viewingAssignment.id);
          }}
          onDelete={() => {
            setViewingAssignment(null);
            setDeletingAssignment(viewingAssignment);
          }}
        />
      )}

      {deletingAssignment && (
        <AssignmentStatusDialog
          assignmentTitle={deletingAssignment.title}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingAssignment(null)}
        />
      )}
    </div>
  );
}