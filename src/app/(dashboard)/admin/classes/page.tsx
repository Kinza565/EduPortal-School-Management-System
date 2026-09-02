"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Plus, BookOpen } from "lucide-react";
import { ClassStats } from "@/components/classes/ClassStats";
import { ClassTable } from "@/components/classes/ClassTable";
import { ClassFilters } from "@/components/classes/ClassFilters";
import { ClassForm, type ClassFormData } from "@/components/classes/ClassForm";
import { ClassDetails } from "@/components/classes/ClassDetails";
import { DeleteClassDialog } from "@/components/classes/DeleteClassDialog";
import type { Class, Section, TeacherAssignment } from "@/types/database";

type ClassWithStats = Class & {
  sections: Section[];
  sections_count: number;
  students_count: number;
  teachers_count: number;
};

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<ClassWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // UI States
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassWithStats | null>(null);
  const [viewingClass, setViewingClass] = useState<ClassWithStats | null>(null);
  const [statusClass, setStatusClass] = useState<ClassWithStats | null>(null);
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

    const [classesRes, sectionsRes, studentsRes, assignmentsRes] = await Promise.all([
      supabase
        .from("classes")
        .select("*")
        .eq("school_id", profile.school_id)
        .order("name"),
      supabase
        .from("sections")
        .select("*")
        .eq("school_id", profile.school_id),
      supabase
        .from("students")
        .select("class_id")
        .eq("school_id", profile.school_id)
        .eq("status", "active"),
      supabase
        .from("teacher_assignments")
        .select("class_id")
        .eq("school_id", profile.school_id),
    ]);

    if (classesRes.error) {
      setError("Failed to load classes.");
      setIsLoading(false);
      return;
    }

    const classList = (classesRes.data || []) as Class[];
    const sectionList = (sectionsRes.data || []) as Section[];
    const studentList = studentsRes.data || [];
    const assignmentList = (assignmentsRes.data || []) as TeacherAssignment[];

    // Build counts
    const sectionsByClass: Record<string, Section[]> = {};
    sectionList.forEach((s) => {
      if (!sectionsByClass[s.class_id]) {
        sectionsByClass[s.class_id] = [];
      }
      sectionsByClass[s.class_id].push(s);
    });

    const studentsByClass: Record<string, number> = {};
    studentList.forEach((s) => {
      if (s.class_id) {
        studentsByClass[s.class_id] = (studentsByClass[s.class_id] || 0) + 1;
      }
    });

    const teachersByClass: Record<string, Set<string>> = {};
    assignmentList.forEach((a) => {
      if (!teachersByClass[a.class_id]) {
        teachersByClass[a.class_id] = new Set();
      }
      teachersByClass[a.class_id].add(a.teacher_id);
    });

    const classesWithStats: ClassWithStats[] = classList.map((cls) => ({
      ...cls,
      sections: sectionsByClass[cls.id] || [],
      sections_count: (sectionsByClass[cls.id] || []).length,
      students_count: studentsByClass[cls.id] || 0,
      teachers_count: teachersByClass[cls.id]?.size || 0,
    }));

    setClasses(classesWithStats);
    setIsLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    (async () => {
      await fetchData();
    })();
  }, [fetchData]);

  // Filtered classes
  const filteredClasses = classes.filter((cls) => {
    const matchesSearch =
      searchQuery === "" ||
      cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cls.description && cls.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && cls.is_active) ||
      (statusFilter === "inactive" && !cls.is_active);

    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalClasses = classes.length;
  const activeClasses = classes.filter((c) => c.is_active).length;
  const inactiveClasses = classes.filter((c) => !c.is_active).length;
  const totalSections = classes.reduce((sum, c) => sum + c.sections_count, 0);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  const hasActiveFilters = searchQuery !== "" || statusFilter !== "all";

  // Handlers
  const handleAddClass = () => {
    setEditingClass(null);
    setShowForm(true);
  };

  const handleEditClass = (id: string) => {
    const cls = classes.find((c) => c.id === id);
    if (cls) {
      setEditingClass(cls);
      setShowForm(true);
    }
  };

  const handleViewClass = (id: string) => {
    const cls = classes.find((c) => c.id === id);
    if (cls) {
      setViewingClass(cls);
    }
  };

  const handleToggleStatus = (id: string) => {
    const cls = classes.find((c) => c.id === id);
    if (cls) {
      setStatusClass(cls);
    }
  };

  const handleFormSubmit = async (formData: ClassFormData) => {
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

      if (editingClass) {
        // Update existing class
        const { error: updateError } = await supabase
          .from("classes")
          .update({
            name: formData.name,
            description: formData.description || null,
            is_active: formData.is_active,
          })
          .eq("id", editingClass.id);

        if (updateError) {
          if (updateError.code === "23505") {
            setError("A class with this name already exists.");
          } else {
            setError("Failed to update class.");
          }
          setIsSubmitting(false);
          return;
        }
      } else {
        // Insert new class
        const { error: insertError } = await supabase.from("classes").insert({
          school_id: adminProfile.school_id,
          name: formData.name,
          description: formData.description || null,
          is_active: true,
        });

        if (insertError) {
          if (insertError.code === "23505") {
            setError("A class with this name already exists.");
          } else {
            setError("Failed to add class.");
          }
          setIsSubmitting(false);
          return;
        }
      }

      setShowForm(false);
      setEditingClass(null);
      await fetchData();
    } catch (err) {
      console.error("Form submission error:", err);
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!statusClass) return;

    try {
      const { error } = await supabase
        .from("classes")
        .update({ is_active: !statusClass.is_active })
        .eq("id", statusClass.id);

      if (error) {
        setError("Failed to update class status.");
        return;
      }

      setStatusClass(null);
      await fetchData();
    } catch (err) {
      console.error("Status update error:", err);
      setError("Failed to update class status.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading classes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 lg:text-3xl">Classes</h1>
          <p className="text-slate-500">
            Manage your school&apos;s classes and academic structure.
          </p>
        </div>
        <button
          onClick={handleAddClass}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Class
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats */}
      <ClassStats
        total={totalClasses}
        active={activeClasses}
        inactive={inactiveClasses}
        totalSections={totalSections}
      />

      {/* Filters */}
      <ClassFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Class Table */}
      <ClassTable
        classes={filteredClasses.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          is_active: c.is_active,
          created_at: c.created_at,
          sections_count: c.sections_count,
          students_count: c.students_count,
          teachers_count: c.teachers_count,
        }))}
        onView={handleViewClass}
        onEdit={handleEditClass}
        onToggleStatus={handleToggleStatus}
      />

      {/* Empty State for No Classes */}
      {classes.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <BookOpen className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700">No classes yet</h3>
          <p className="mt-1 text-sm text-slate-500">
            Add your first class to get started.
          </p>
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <ClassForm
          classItem={editingClass}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingClass(null);
          }}
          isLoading={isSubmitting}
        />
      )}

      {viewingClass && (
        <ClassDetails
          classItem={{
            id: viewingClass.id,
            name: viewingClass.name,
            description: viewingClass.description,
            is_active: viewingClass.is_active,
            created_at: viewingClass.created_at,
            updated_at: viewingClass.updated_at,
            sections: viewingClass.sections.map((s) => ({
              id: s.id,
              name: s.name,
              capacity: s.capacity,
              is_active: s.is_active,
            })),
            sections_count: viewingClass.sections_count,
            students_count: viewingClass.students_count,
            teachers_count: viewingClass.teachers_count,
          }}
          onClose={() => setViewingClass(null)}
          onEdit={() => {
            setViewingClass(null);
            handleEditClass(viewingClass.id);
          }}
          onToggleStatus={() => {
            setViewingClass(null);
            setStatusClass(viewingClass);
          }}
        />
      )}

      {statusClass && (
        <DeleteClassDialog
          className={statusClass.name}
          isActive={statusClass.is_active}
          onConfirm={handleStatusToggle}
          onCancel={() => setStatusClass(null)}
        />
      )}
    </div>
  );
}
