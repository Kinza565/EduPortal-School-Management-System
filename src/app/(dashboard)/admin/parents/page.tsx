"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Plus, Users } from "lucide-react";
import { ParentStats } from "@/components/parents/ParentStats";
import { ParentTable } from "@/components/parents/ParentTable";
import { ParentFilters } from "@/components/parents/ParentFilters";
import { ParentForm, type ParentFormData } from "@/components/parents/ParentForm";
import { ParentDetails } from "@/components/parents/ParentDetails";
import { ParentStatusDialog } from "@/components/parents/ParentStatusDialog";
import { Pagination } from "@/components/ui/pagination";
import type { Parent, Class, Section, Student } from "@/types/database";

type ParentWithStats = Parent & {
  student_count: number;
};

type ParentWithStudents = Parent & {
  students: {
    id: string;
    full_name: string;
    student_id: string;
    roll_number: string | null;
    class_name: string | null;
    section_name: string | null;
    status: string;
  }[];
};

const PAGE_SIZE = 20;

export default function AdminParentsPage() {
  const [parents, setParents] = useState<ParentWithStats[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [relationshipFilter, setRelationshipFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");

  // UI States
  const [showForm, setShowForm] = useState(false);
  const [editingParent, setEditingParent] = useState<ParentWithStats | null>(null);
  const [viewingParent, setViewingParent] = useState<ParentWithStudents | null>(null);
  const [statusParent, setStatusParent] = useState<ParentWithStats | null>(null);
  const [linkedStudentIds, setLinkedStudentIds] = useState<string[]>([]);
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
  }, [searchQuery, relationshipFilter, statusFilter]);

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
      .from("parents")
      .select("*", { count: "exact" })
      .eq("school_id", profile.school_id);

    // Apply search filter server-side
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Apply relationship filter server-side
    if (relationshipFilter !== "all") {
      query = query.eq("relationship", relationshipFilter);
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

    const [parentsRes, classesRes, sectionsRes, studentsRes, relationshipsRes] = await Promise.all([
      query.order("full_name").range(startIndex, endIndex),
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
        .from("students")
        .select("*")
        .eq("school_id", profile.school_id)
        .eq("status", "active")
        .order("full_name"),
      supabase
        .from("parent_student")
        .select("parent_id, student_id")
        .eq("school_id", profile.school_id),
    ]);

    if (parentsRes.error) {
      setError("Failed to load parents.");
      setIsLoading(false);
      return;
    }

    const parentsData = (parentsRes.data || []) as Parent[];
    const relationships = relationshipsRes.data || [];

    // Calculate student count for each parent
    const studentCountMap = new Map<string, number>();
    relationships.forEach((rel) => {
      studentCountMap.set(rel.parent_id, (studentCountMap.get(rel.parent_id) || 0) + 1);
    });

    const parentsWithStats: ParentWithStats[] = parentsData.map((p) => ({
      ...p,
      student_count: studentCountMap.get(p.id) || 0,
    }));

    setParents(parentsWithStats);
    setTotalCount(parentsRes.count || 0);
    setClasses(classesRes.data || []);
    setSections(sectionsRes.data || []);
    setStudents(studentsRes.data || []);
    setIsLoading(false);
  }, [supabase, router, searchQuery, relationshipFilter, statusFilter, currentPage]);

  useEffect(() => {
    (async () => {
      await fetchData();
    })();
  }, [fetchData]);

  // Filtered sections based on selected class
  const filteredSections = useMemo(() => {
    if (!classFilter) return [];
    return sections.filter((s) => s.class_id === classFilter);
  }, [classFilter, sections]);

  // Client-side filters for class/section (requires student data)
  const filteredParents = useMemo(() => {
    return parents.filter((parent) => {
      // Class and section filters would require checking linked students
      // For now, we'll filter in memory based on linked students
      const matchesClassSection =
        (!classFilter && !sectionFilter) ||
        parent.student_count > 0; // Simplified - would need student data for exact filtering

      return matchesClassSection;
    });
  }, [parents, classFilter, sectionFilter]);

  // Stats
  const totalParents = totalCount;
  const activeParents = parents.filter((p) => p.is_active).length;
  const parentsWithStudents = parents.filter((p) => p.student_count > 0).length;
  const totalLinkedStudents = parents.reduce((sum, p) => sum + p.student_count, 0);

  const clearFilters = () => {
    setSearchQuery("");
    setRelationshipFilter("all");
    setStatusFilter("all");
    setClassFilter("");
    setSectionFilter("");
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    relationshipFilter !== "all" ||
    statusFilter !== "all" ||
    classFilter !== "" ||
    sectionFilter !== "";

  // Handlers
  const handleAddParent = () => {
    setEditingParent(null);
    setLinkedStudentIds([]);
    setShowForm(true);
  };

  const handleEditParent = async (id: string) => {
    const parent = parents.find((p) => p.id === id);
    if (parent) {
      // Fetch linked students
      const { data: relationships } = await supabase
        .from("parent_student")
        .select("student_id")
        .eq("parent_id", id);

      setLinkedStudentIds(relationships?.map((r) => r.student_id) || []);
      setEditingParent(parent);
      setShowForm(true);
    }
  };

  const handleViewParent = async (id: string) => {
    const parent = parents.find((p) => p.id === id);
    if (parent) {
      // Fetch linked students with details
      const { data: relationships } = await supabase
        .from("parent_student")
        .select("student_id")
        .eq("parent_id", id);

      const studentIds = relationships?.map((r) => r.student_id) || [];
      
      if (studentIds.length > 0) {
        const { data: studentData } = await supabase
          .from("students")
          .select("*, classes!class_id(name), sections!section_id(name)")
          .in("id", studentIds);

        const studentsWithDetails = (studentData || []).map((s) => ({
          id: s.id,
          full_name: s.full_name,
          student_id: s.student_id,
          roll_number: s.roll_number,
          class_name: (s.classes as unknown as { name: string })?.name || null,
          section_name: (s.sections as unknown as { name: string })?.name || null,
          status: s.status,
        }));

        setViewingParent({
          ...parent,
          students: studentsWithDetails,
        } as ParentWithStudents);
      } else {
        setViewingParent({
          ...parent,
          students: [],
        } as ParentWithStudents);
      }
    }
  };

  const handleToggleStatus = (id: string) => {
    const parent = parents.find((p) => p.id === id);
    if (parent) {
      setStatusParent(parent);
    }
  };

  const handleFormSubmit = async (formData: ParentFormData) => {
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

      if (editingParent) {
        // Update existing parent
        const { error: updateError } = await supabase
          .from("parents")
          .update({
            full_name: formData.full_name,
            relationship: formData.relationship,
            phone: formData.phone || null,
            email: formData.email || null,
            address: formData.address || null,
            occupation: formData.occupation || null,
            is_active: formData.is_active,
          })
          .eq("id", editingParent.id);

        if (updateError) {
          setError("Failed to update parent.");
          setIsSubmitting(false);
          return;
        }

        // Update student relationships
        // First, remove existing relationships
        await supabase
          .from("parent_student")
          .delete()
          .eq("parent_id", editingParent.id);

        // Then, insert new relationships
        if (formData.student_ids.length > 0) {
          const relationships = formData.student_ids.map((studentId) => ({
            school_id: adminProfile.school_id,
            parent_id: editingParent.id,
            student_id: studentId,
            is_primary_contact: false,
          }));

          await supabase.from("parent_student").insert(relationships);
        }
      } else {
        // Create new parent
        const { data: newParent, error: insertError } = await supabase
          .from("parents")
          .insert({
            school_id: adminProfile.school_id,
            full_name: formData.full_name,
            relationship: formData.relationship,
            phone: formData.phone || null,
            email: formData.email || null,
            address: formData.address || null,
            occupation: formData.occupation || null,
            is_active: formData.is_active,
          })
          .select()
          .single();

        if (insertError) {
          setError("Failed to add parent.");
          setIsSubmitting(false);
          return;
        }

        // Insert student relationships
        if (formData.student_ids.length > 0 && newParent) {
          const relationships = formData.student_ids.map((studentId) => ({
            school_id: adminProfile.school_id,
            parent_id: newParent.id,
            student_id: studentId,
            is_primary_contact: false,
          }));

          await supabase.from("parent_student").insert(relationships);
        }
      }

      setShowForm(false);
      setEditingParent(null);
      await fetchData();
    } catch (err) {
      console.error("Form submission error:", err);
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatusConfirm = async () => {
    if (!statusParent) return;

    try {
      const { error } = await supabase
        .from("parents")
        .update({ is_active: !statusParent.is_active })
        .eq("id", statusParent.id);

      if (error) {
        setError("Failed to update parent status.");
        return;
      }

      setStatusParent(null);
      await fetchData();
    } catch (err) {
      console.error("Status update error:", err);
      setError("Failed to update parent status.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading parents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 lg:text-3xl">Parents & Guardians</h1>
          <p className="text-slate-500">
            Manage parent and guardian information linked to students.
          </p>
        </div>
        <button
          onClick={handleAddParent}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Parent
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats */}
      <ParentStats
        total={totalParents}
        active={activeParents}
        withStudents={parentsWithStudents}
        totalLinked={totalLinkedStudents}
      />

      {/* Filters */}
      <ParentFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        relationshipFilter={relationshipFilter}
        onRelationshipChange={setRelationshipFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        classFilter={classFilter}
        onClassChange={setClassFilter}
        sectionFilter={sectionFilter}
        onSectionChange={setSectionFilter}
        classes={classes.map((c) => ({ id: c.id, name: c.name }))}
        sections={filteredSections.map((s) => ({ id: s.id, name: s.name }))}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Parent Table */}
      <ParentTable
        parents={filteredParents.map((p) => ({
          id: p.id,
          full_name: p.full_name,
          relationship: p.relationship,
          phone: p.phone,
          email: p.email,
          is_active: p.is_active,
          student_count: p.student_count,
          created_at: p.created_at,
        }))}
        onView={handleViewParent}
        onEdit={handleEditParent}
        onToggleStatus={handleToggleStatus}
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

      {/* Empty State */}
      {parents.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700">No parents yet</h3>
          <p className="mt-1 text-sm text-slate-500">
            Add your first parent to start managing parent information.
          </p>
          <button
            onClick={handleAddParent}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus size={16} />
            Add your first parent
          </button>
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <ParentForm
          parent={editingParent}
          students={students.map((s) => ({
            id: s.id,
            full_name: s.full_name,
            student_id: s.student_id,
            roll_number: s.roll_number,
          }))}
          linkedStudentIds={linkedStudentIds}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingParent(null);
          }}
          isLoading={isSubmitting}
        />
      )}

      {viewingParent && (
        <ParentDetails
          parent={{
            id: viewingParent.id,
            full_name: viewingParent.full_name,
            relationship: viewingParent.relationship,
            phone: viewingParent.phone,
            email: viewingParent.email,
            address: viewingParent.address,
            occupation: viewingParent.occupation,
            is_active: viewingParent.is_active,
            created_at: viewingParent.created_at,
            updated_at: viewingParent.updated_at,
            students: viewingParent.students || [],
          }}
          onClose={() => setViewingParent(null)}
          onEdit={() => {
            setViewingParent(null);
            handleEditParent(viewingParent.id);
          }}
          onToggleStatus={() => {
            setViewingParent(null);
            setStatusParent({
              ...viewingParent,
              student_count: viewingParent.students?.length || 0,
            });
          }}
        />
      )}

      {statusParent && (
        <ParentStatusDialog
          parentName={statusParent.full_name}
          isActive={statusParent.is_active}
          onConfirm={handleToggleStatusConfirm}
          onCancel={() => setStatusParent(null)}
        />
      )}
    </div>
  );
}
