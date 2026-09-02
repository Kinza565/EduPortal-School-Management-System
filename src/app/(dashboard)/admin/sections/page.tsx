"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Plus, Layers } from "lucide-react";
import { SectionStats } from "@/components/sections/SectionStats";
import { SectionTable } from "@/components/sections/SectionTable";
import { SectionFilters } from "@/components/sections/SectionFilters";
import { SectionForm, type SectionFormData } from "@/components/sections/SectionForm";
import { SectionDetails } from "@/components/sections/SectionDetails";
import { DeleteSectionDialog } from "@/components/sections/DeleteSectionDialog";
import type { Class, Section, Student } from "@/types/database";

type SectionWithStats = Section & {
  class_name: string;
  student_count: number;
  available_seats: number;
  is_over_capacity: boolean;
};

export default function AdminSectionsPage() {
  const [sections, setSections] = useState<SectionWithStats[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");

  // UI States
  const [showForm, setShowForm] = useState(false);
  const [editingSection, setEditingSection] = useState<SectionWithStats | null>(null);
  const [viewingSection, setViewingSection] = useState<SectionWithStats | null>(null);
  const [statusSection, setStatusSection] = useState<SectionWithStats | null>(null);
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

    const [sectionsRes, classesRes, studentsRes] = await Promise.all([
      supabase
        .from("sections")
        .select("*, classes(name)")
        .eq("school_id", profile.school_id)
        .order("name"),
      supabase
        .from("classes")
        .select("*")
        .eq("school_id", profile.school_id)
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("students")
        .select("section_id")
        .eq("school_id", profile.school_id)
        .eq("status", "active"),
    ]);

    if (sectionsRes.error) {
      setError("Failed to load sections.");
      setIsLoading(false);
      return;
    }

    const sectionList = (sectionsRes.data || []) as (Section & { classes: { name: string } | null })[];
    const classList = (classesRes.data || []) as Class[];
    const studentList = (studentsRes.data || []) as Student[];

    // Count students per section
    const studentCountBySection: Record<string, number> = {};
    studentList.forEach((s) => {
      if (s.section_id) {
        studentCountBySection[s.section_id] = (studentCountBySection[s.section_id] || 0) + 1;
      }
    });

    const sectionsWithStats: SectionWithStats[] = sectionList.map((section) => {
      const studentCount = studentCountBySection[section.id] || 0;
      return {
        ...section,
        class_name: section.classes?.name || "Unknown",
        student_count: studentCount,
        available_seats: section.capacity - studentCount,
        is_over_capacity: studentCount > section.capacity,
      };
    });

    setSections(sectionsWithStats);
    setClasses(classList);
    setIsLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    (async () => {
      await fetchData();
    })();
  }, [fetchData]);

  // Filtered sections
  const filteredSections = sections.filter((section) => {
    const matchesSearch =
      searchQuery === "" ||
      section.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.class_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && section.is_active) ||
      (statusFilter === "inactive" && !section.is_active);

    const matchesClass =
      classFilter === "all" || section.class_id === classFilter;

    return matchesSearch && matchesStatus && matchesClass;
  });

  // Stats
  const totalSections = sections.length;
  const activeSections = sections.filter((s) => s.is_active).length;
  const inactiveSections = sections.filter((s) => !s.is_active).length;
  const totalStudents = sections.reduce((sum, s) => sum + s.student_count, 0);
  const totalCapacity = sections.reduce((sum, s) => sum + s.capacity, 0);
  const availableSeats = totalCapacity - totalStudents;

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setClassFilter("all");
  };

  const hasActiveFilters =
    searchQuery !== "" || statusFilter !== "all" || classFilter !== "all";

  // Handlers
  const handleAddSection = () => {
    setEditingSection(null);
    setShowForm(true);
  };

  const handleEditSection = (id: string) => {
    const section = sections.find((s) => s.id === id);
    if (section) {
      setEditingSection(section);
      setShowForm(true);
    }
  };

  const handleViewSection = (id: string) => {
    const section = sections.find((s) => s.id === id);
    if (section) {
      setViewingSection(section);
    }
  };

  const handleToggleStatus = (id: string) => {
    const section = sections.find((s) => s.id === id);
    if (section) {
      setStatusSection(section);
    }
  };

  const handleFormSubmit = async (formData: SectionFormData) => {
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

      if (editingSection) {
        // Check capacity warning
        if (formData.capacity < editingSection.student_count) {
          const confirmed = window.confirm(
            `This section currently has ${editingSection.student_count} students. Setting capacity to ${formData.capacity} will put the section over capacity. Continue?`
          );
          if (!confirmed) {
            setIsSubmitting(false);
            return;
          }
        }

        // Update existing section
        const { error: updateError } = await supabase
          .from("sections")
          .update({
            name: formData.name,
            class_id: formData.class_id,
            capacity: formData.capacity,
            is_active: formData.is_active,
          })
          .eq("id", editingSection.id);

        if (updateError) {
          if (updateError.code === "23505") {
            setError("A section with this name already exists in the selected class.");
          } else {
            setError("Failed to update section.");
          }
          setIsSubmitting(false);
          return;
        }
      } else {
        // Insert new section
        const { error: insertError } = await supabase.from("sections").insert({
          school_id: adminProfile.school_id,
          name: formData.name,
          class_id: formData.class_id,
          capacity: formData.capacity,
          is_active: true,
        });

        if (insertError) {
          if (insertError.code === "23505") {
            setError("A section with this name already exists in the selected class.");
          } else {
            setError("Failed to add section.");
          }
          setIsSubmitting(false);
          return;
        }
      }

      setShowForm(false);
      setEditingSection(null);
      await fetchData();
    } catch (err) {
      console.error("Form submission error:", err);
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!statusSection) return;

    try {
      const { error } = await supabase
        .from("sections")
        .update({ is_active: !statusSection.is_active })
        .eq("id", statusSection.id);

      if (error) {
        setError("Failed to update section status.");
        return;
      }

      setStatusSection(null);
      await fetchData();
    } catch (err) {
      console.error("Status update error:", err);
      setError("Failed to update section status.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading sections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 lg:text-3xl">Sections</h1>
          <p className="text-slate-500">
            Manage class sections, capacity, and student distribution.
          </p>
        </div>
        <button
          onClick={handleAddSection}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Section
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats */}
      <SectionStats
        total={totalSections}
        active={activeSections}
        inactive={inactiveSections}
        totalStudents={totalStudents}
        availableSeats={availableSeats}
      />

      {/* Filters */}
      <SectionFilters
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

      {/* Section Table */}
      <SectionTable
        sections={filteredSections}
        onView={handleViewSection}
        onEdit={handleEditSection}
        onToggleStatus={handleToggleStatus}
      />

      {/* Empty State for No Sections */}
      {sections.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-50">
            <Layers className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700">No sections yet</h3>
          <p className="mt-1 text-sm text-slate-500">
            Add your first section to get started.
          </p>
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <SectionForm
          section={editingSection}
          classes={classes}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingSection(null);
          }}
          isLoading={isSubmitting}
        />
      )}

      {viewingSection && (
        <SectionDetails
          section={{
            id: viewingSection.id,
            name: viewingSection.name,
            class_name: viewingSection.class_name,
            capacity: viewingSection.capacity,
            student_count: viewingSection.student_count,
            available_seats: viewingSection.available_seats,
            is_active: viewingSection.is_active,
            created_at: viewingSection.created_at,
            updated_at: viewingSection.updated_at,
            is_over_capacity: viewingSection.is_over_capacity,
            teachers: [],
          }}
          onClose={() => setViewingSection(null)}
          onEdit={() => {
            setViewingSection(null);
            handleEditSection(viewingSection.id);
          }}
          onToggleStatus={() => {
            setViewingSection(null);
            setStatusSection(viewingSection);
          }}
        />
      )}

      {statusSection && (
        <DeleteSectionDialog
          sectionName={statusSection.name}
          className={statusSection.class_name}
          isActive={statusSection.is_active}
          onConfirm={handleStatusToggle}
          onCancel={() => setStatusSection(null)}
        />
      )}
    </div>
  );
}
