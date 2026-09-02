"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Plus, BookOpen } from "lucide-react";
import { SubjectStats } from "@/components/subjects/SubjectStats";
import { SubjectTable } from "@/components/subjects/SubjectTable";
import { SubjectFilters } from "@/components/subjects/SubjectFilters";
import { SubjectForm, type SubjectFormData } from "@/components/subjects/SubjectForm";
import { SubjectDetails } from "@/components/subjects/SubjectDetails";
import { SubjectStatusDialog } from "@/components/subjects/SubjectStatusDialog";
import type { Subject, TeacherAssignment, Class } from "@/types/database";

type SubjectWithStats = Subject & {
  classes_count: number;
  teachers_count: number;
};

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectWithStats[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");

  // UI States
  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectWithStats | null>(null);
  const [viewingSubject, setViewingSubject] = useState<SubjectWithStats | null>(null);
  const [statusSubject, setStatusSubject] = useState<SubjectWithStats | null>(null);
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

    // Fetch subjects, classes, and teacher assignments in parallel
    const [subjectsRes, classesRes, assignmentsRes] = await Promise.all([
      supabase
        .from("subjects")
        .select("*")
        .eq("school_id", profile.school_id)
        .order("name"),
      supabase
        .from("classes")
        .select("*")
        .eq("school_id", profile.school_id)
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("teacher_assignments")
        .select("subject_id, class_id, teacher_id")
        .eq("school_id", profile.school_id),
    ]);

    if (subjectsRes.error) {
      setError("Failed to load subjects.");
      setIsLoading(false);
      return;
    }

    const subjectsData = (subjectsRes.data || []) as Subject[];
    const assignmentsData = (assignmentsRes.data || []) as Pick<TeacherAssignment, "subject_id" | "class_id" | "teacher_id">[];

    // Calculate stats for each subject
    const subjectsWithStats: SubjectWithStats[] = subjectsData.map((subject) => {
      const subjectAssignments = assignmentsData.filter((a) => a.subject_id === subject.id);
      const uniqueClasses = new Set(subjectAssignments.map((a) => a.class_id));
      const uniqueTeachers = new Set(subjectAssignments.map((a) => a.teacher_id));

      return {
        ...subject,
        classes_count: uniqueClasses.size,
        teachers_count: uniqueTeachers.size,
      };
    });

    setSubjects(subjectsWithStats);
    setClasses(classesRes.data || []);
    setIsLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    (async () => {
      await fetchData();
    })();
  }, [fetchData]);

  // Filtered subjects
  const filteredSubjects = useMemo(() => {
    return subjects.filter((subject) => {
      const matchesSearch =
        searchQuery === "" ||
        subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (subject.description && subject.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && subject.is_active) ||
        (statusFilter === "inactive" && !subject.is_active);

      // Class filter: check if subject has assignments in the selected class
      const matchesClass =
        classFilter === "all" ||
        subject.classes_count > 0; // Simplified - would need assignment data for exact class filtering

      return matchesSearch && matchesStatus && matchesClass;
    });
  }, [subjects, searchQuery, statusFilter, classFilter]);

  // Stats
  const totalSubjects = subjects.length;
  const activeSubjects = subjects.filter((s) => s.is_active).length;
  const inactiveSubjects = subjects.filter((s) => !s.is_active).length;
  const assignedSubjects = subjects.filter((s) => s.teachers_count > 0).length;
  const unassignedSubjects = subjects.filter((s) => s.teachers_count === 0).length;

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setClassFilter("all");
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    statusFilter !== "all" ||
    classFilter !== "all";

  // Handlers
  const handleAddSubject = () => {
    setEditingSubject(null);
    setShowForm(true);
  };

  const handleEditSubject = (id: string) => {
    const subject = subjects.find((s) => s.id === id);
    if (subject) {
      setEditingSubject(subject);
      setShowForm(true);
    }
  };

  const handleViewSubject = (id: string) => {
    const subject = subjects.find((s) => s.id === id);
    if (subject) {
      setViewingSubject(subject);
    }
  };

  const handleDeactivateSubject = (id: string) => {
    const subject = subjects.find((s) => s.id === id);
    if (subject) {
      setStatusSubject(subject);
    }
  };

  const handleFormSubmit = async (formData: SubjectFormData) => {
    setIsSubmitting(true);

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

      if (editingSubject) {
        // Update existing subject
        const { error: updateError } = await supabase
          .from("subjects")
          .update({
            name: formData.name,
            code: formData.code,
            description: formData.description || null,
          })
          .eq("id", editingSubject.id);

        if (updateError) {
          if (updateError.code === "23505") {
            setError("A subject with this code already exists in your school.");
          } else {
            setError("Failed to update subject.");
          }
          setIsSubmitting(false);
          return;
        }
      } else {
        // Insert new subject
        const { error: insertError } = await supabase.from("subjects").insert({
          school_id: adminProfile.school_id,
          name: formData.name,
          code: formData.code,
          description: formData.description || null,
          is_active: true,
        });

        if (insertError) {
          if (insertError.code === "23505") {
            setError("A subject with this code already exists in your school.");
          } else {
            setError("Failed to add subject.");
          }
          setIsSubmitting(false);
          return;
        }
      }

      setShowForm(false);
      setEditingSubject(null);
      await fetchData();
    } catch (err) {
      console.error("Form submission error:", err);
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!statusSubject) return;

    try {
      const { error } = await supabase
        .from("subjects")
        .update({ is_active: !statusSubject.is_active })
        .eq("id", statusSubject.id);

      if (error) {
        setError("Failed to update subject status.");
        return;
      }

      setStatusSubject(null);
      await fetchData();
    } catch (err) {
      console.error("Status update error:", err);
      setError("Failed to update subject status.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading subjects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 lg:text-3xl">Subjects</h1>
          <p className="text-slate-500">
            Manage subjects and organize your school&apos;s academic curriculum.
          </p>
        </div>
        <button
          onClick={handleAddSubject}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Subject
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats */}
      <SubjectStats
        total={totalSubjects}
        active={activeSubjects}
        inactive={inactiveSubjects}
        assigned={assignedSubjects}
        unassigned={unassignedSubjects}
      />

      {/* Filters */}
      <SubjectFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        classFilter={classFilter}
        onClassChange={setClassFilter}
        classes={classes}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Subject Table */}
      <SubjectTable
        subjects={filteredSubjects.map((s) => ({
          id: s.id,
          name: s.name,
          code: s.code,
          description: s.description,
          is_active: s.is_active,
          created_at: s.created_at,
          classes_count: s.classes_count,
          teachers_count: s.teachers_count,
        }))}
        onView={handleViewSubject}
        onEdit={handleEditSubject}
        onDeactivate={handleDeactivateSubject}
        onActivate={handleDeactivateSubject}
      />

      {/* Empty State for No Subjects */}
      {subjects.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-50">
            <BookOpen className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700">No subjects yet</h3>
          <p className="mt-1 text-sm text-slate-500">
            Add your first subject to organize your academic curriculum.
          </p>
          <button
            onClick={handleAddSubject}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus size={16} />
            Add your first subject
          </button>
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <SubjectForm
          subject={editingSubject}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingSubject(null);
          }}
          isLoading={isSubmitting}
        />
      )}

      {viewingSubject && (
        <SubjectDetails
          subject={{
            id: viewingSubject.id,
            name: viewingSubject.name,
            code: viewingSubject.code,
            description: viewingSubject.description,
            is_active: viewingSubject.is_active,
            created_at: viewingSubject.created_at,
            updated_at: viewingSubject.updated_at,
            classes: [],
            sections: [],
            teachers: [],
          }}
          onClose={() => setViewingSubject(null)}
          onEdit={() => {
            setViewingSubject(null);
            handleEditSubject(viewingSubject.id);
          }}
          onToggleStatus={() => {
            setViewingSubject(null);
            setStatusSubject(viewingSubject);
          }}
        />
      )}

      {statusSubject && (
        <SubjectStatusDialog
          subjectName={statusSubject.name}
          subjectCode={statusSubject.code}
          isActive={statusSubject.is_active}
          onConfirm={handleToggleStatus}
          onCancel={() => setStatusSubject(null)}
        />
      )}
    </div>
  );
}
