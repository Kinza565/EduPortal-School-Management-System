"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loader2, ClipboardList, Search } from "lucide-react";

interface Child {
  id: string;
  full_name: string;
  class_name: string;
  section_name: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  subject_name: string;
  teacher_name: string;
  assigned_date: string;
  due_date: string;
  status: string;
}

export default function ParentAssignmentsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!profile?.id) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const parentId = profile.id;

        const { data: parentData } = await supabase
          .from("parents")
          .select("id")
          .eq("profile_id", parentId)
          .single();

        if (!parentData) {
          if (!cancelled) {
            setChildren([]);
            setLoading(false);
          }
          return;
        }

        const { data: parentStudents } = await supabase
          .from("parent_student")
          .select("student_id")
          .eq("parent_id", parentData.id);

        if (!parentStudents || parentStudents.length === 0) {
          if (!cancelled) {
            setChildren([]);
            setLoading(false);
          }
          return;
        }

        const studentIds = parentStudents.map((ps) => ps.student_id);

        const { data: studentsData } = await supabase
          .from("students")
          .select("id, full_name, class_id, section_id")
          .in("id", studentIds)
          .order("full_name");

        if (cancelled) return;

        const classIds = [...new Set(studentsData?.map((s) => s.class_id) || [])];
        const sectionIds = [...new Set(studentsData?.map((s) => s.section_id) || [])];

        const [classesRes, sectionsRes] = await Promise.all([
          supabase.from("classes").select("id, name").in("id", classIds),
          supabase.from("sections").select("id, name").in("id", sectionIds),
        ]);

        const classMap = new Map(classesRes.data?.map((c) => [c.id, c.name]) || []);
        const sectionMap = new Map(sectionsRes.data?.map((s) => [s.id, s.name]) || []);

        const childrenData: Child[] = studentsData?.map((s) => ({
          id: s.id,
          full_name: s.full_name,
          class_name: classMap.get(s.class_id) || "Unknown",
          section_name: sectionMap.get(s.section_id) || "Unknown",
        })) || [];

        if (!cancelled) {
          setChildren(childrenData);
          if (childrenData.length > 0) {
            setSelectedChild(childrenData[0].id);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load children");
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
  }, [profile?.id]);

  useEffect(() => {
    if (!selectedChild || !profile?.id) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        const { data: studentData } = await supabase
          .from("students")
          .select("class_id, section_id")
          .eq("id", selectedChild)
          .single();

        if (!studentData) {
          if (!cancelled) {
            setAssignments([]);
            setLoading(false);
          }
          return;
        }

        let query = supabase
          .from("academic_assignments")
          .select("id, title, description, assigned_date, due_date, status, subject_id, teacher_id")
          .eq("class_id", studentData.class_id)
          .eq("section_id", studentData.section_id)
          .eq("school_id", profile.school_id)
          .order("due_date", { ascending: false });

        if (statusFilter !== "all") query = query.eq("status", statusFilter);

        const { data: assignmentsData, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        if (cancelled) return;

        const subjectIds = [...new Set(assignmentsData?.map((a) => a.subject_id) || [])];
        const teacherIds = [...new Set(assignmentsData?.map((a) => a.teacher_id) || [])];

        const [subjectsRes, teachersRes] = await Promise.all([
          supabase.from("subjects").select("id, name").in("id", subjectIds),
          supabase.from("profiles").select("id, full_name").in("id", teacherIds),
        ]);

        const subjectMap = new Map(subjectsRes.data?.map((s) => [s.id, s.name]) || []);
        const teacherMap = new Map(teachersRes.data?.map((t) => [t.id, t.full_name]) || []);

        const mappedAssignments: Assignment[] = assignmentsData?.map((a) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          subject_name: subjectMap.get(a.subject_id) || "Unknown",
          teacher_name: teacherMap.get(a.teacher_id) || "Unknown",
          assigned_date: a.assigned_date,
          due_date: a.due_date,
          status: a.status,
        })) || [];

        if (!cancelled) {
          setAssignments(mappedAssignments);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load assignments");
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
  }, [selectedChild, statusFilter]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !a.title.toLowerCase().includes(query) &&
          !a.subject_name.toLowerCase().includes(query) &&
          !(a.description?.toLowerCase().includes(query))
        ) {
          return false;
        }
      }
      return true;
    });
  }, [assignments, searchQuery]);

  const getDueDateStatus = (dueDate: string, status: string) => {
    if (status === "completed") return "completed";
    if (status === "cancelled") return "cancelled";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    if (due < today) return "overdue";
    if (due.getTime() === today.getTime()) return "due-today";
    return "upcoming";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
      case "completed":
        return "bg-blue-50 text-blue-700 ring-blue-600/20";
      case "cancelled":
        return "bg-red-50 text-red-700 ring-red-600/20";
      default:
        return "bg-slate-50 text-slate-700 ring-slate-600/20";
    }
  };

  const getDueDateColor = (dueDate: string, status: string) => {
    const dueStatus = getDueDateStatus(dueDate, status);
    switch (dueStatus) {
      case "overdue":
        return "text-red-600";
      case "due-today":
        return "text-amber-600";
      case "upcoming":
        return "text-slate-600";
      default:
        return "text-slate-600";
    }
  };

  return (
    <DashboardLayout allowedRoles={["parent"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Assignments</h1>
          <p className="mt-1 text-sm text-slate-500">
            View homework and assignments for your children.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <span className="ml-3 text-slate-600">Loading...</span>
          </div>
        ) : children.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <ClipboardList size={48} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-700">No Children Linked</h3>
            <p className="mt-1 text-sm text-slate-500">
              No children are currently linked to your account.
            </p>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Select Child</label>
                <select
                  value={selectedChild}
                  onChange={(e) => setSelectedChild(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.full_name} - {child.class_name} {child.section_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Search</label>
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search assignments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>

            {/* Assignments List */}
            {filteredAssignments.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                <ClipboardList size={48} className="mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-700">No Assignments Found</h3>
                <p className="mt-1 text-sm text-slate-500">
                  No assignments match your search criteria.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAssignments.map((assignment) => {
                  const dueStatus = getDueDateStatus(assignment.due_date, assignment.status);
                  return (
                    <div
                      key={assignment.id}
                      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold text-slate-800">{assignment.title}</h3>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${getStatusColor(assignment.status)}`}
                            >
                              {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                            </span>
                          </div>
                          {assignment.description && (
                            <p className="mt-1 text-sm text-slate-600">{assignment.description}</p>
                          )}
                          <div className="mt-3 flex flex-wrap gap-4 text-sm">
                            <div>
                              <span className="text-slate-500">Subject:</span>{" "}
                              <span className="font-medium text-slate-700">{assignment.subject_name}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Teacher:</span>{" "}
                              <span className="font-medium text-slate-700">{assignment.teacher_name}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Due Date</p>
                          <p className={`text-sm font-medium ${getDueDateColor(assignment.due_date, assignment.status)}`}>
                            {new Date(assignment.due_date).toLocaleDateString()}
                          </p>
                          {dueStatus === "overdue" && (
                            <span className="mt-1 inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                              Overdue
                            </span>
                          )}
                          {dueStatus === "due-today" && (
                            <span className="mt-1 inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                              Due Today
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
