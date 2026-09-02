"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loader2, Plus, Pencil, Trash2, FileText, X } from "lucide-react";

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  subject_name: string;
  class_name: string;
  section_name: string;
  assigned_date: string;
  due_date: string;
  status: "active" | "inactive" | "completed" | "cancelled";
}

interface TeacherAssignment {
  class_id: string;
  class_name: string;
  section_id: string;
  section_name: string;
  subject_id: string;
  subject_name: string;
}

export default function AssignmentsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    class_id: "",
    section_id: "",
    subject_id: "",
    due_date: "",
    status: "active" as "active" | "inactive" | "completed" | "cancelled",
  });

  useEffect(() => {
    if (!profile?.id) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const teacherId = profile.id;

        const { data: teacherAssigns } = await supabase
          .from("teacher_assignments")
          .select("class_id, section_id, subject_id")
          .eq("teacher_id", teacherId);

        const classIds = [...new Set(teacherAssigns?.map((a) => a.class_id) || [])];
        const sectionIds = [...new Set(teacherAssigns?.map((a) => a.section_id) || [])];
        const subjectIds = [...new Set(teacherAssigns?.map((a) => a.subject_id) || [])];

        const [classesRes, sectionsRes, subjectsRes] = await Promise.all([
          supabase.from("classes").select("id, name").in("id", classIds),
          supabase.from("sections").select("id, name").in("id", sectionIds),
          supabase.from("subjects").select("id, name").in("id", subjectIds),
        ]);

        const classMap = new Map(classesRes.data?.map((c) => [c.id, c.name]) || []);
        const sectionMap = new Map(sectionsRes.data?.map((s) => [s.id, s.name]) || []);
        const subjectMap = new Map(subjectsRes.data?.map((s) => [s.id, s.name]) || []);

        if (!cancelled && teacherAssigns) {
          setTeacherAssignments(
            teacherAssigns.map((a) => ({
              class_id: a.class_id,
              class_name: classMap.get(a.class_id) || "Unknown",
              section_id: a.section_id,
              section_name: sectionMap.get(a.section_id) || "Unknown",
              subject_id: a.subject_id,
              subject_name: subjectMap.get(a.subject_id) || "Unknown",
            }))
          );
        }

        const { data: assignmentsData } = await supabase
          .from("academic_assignments")
          .select("id, title, description, assigned_date, due_date, status, class_id, section_id, subject_id")
          .eq("teacher_id", teacherId)
          .order("created_at", { ascending: false });

        if (!cancelled && assignmentsData) {
          setAssignments(
            assignmentsData.map((a) => ({
              id: a.id,
              title: a.title,
              description: a.description,
              subject_name: subjectMap.get(a.subject_id) || "Unknown",
              class_name: classMap.get(a.class_id) || "Unknown",
              section_name: sectionMap.get(a.section_id) || "Unknown",
              assigned_date: a.assigned_date,
              due_date: a.due_date,
              status: a.status,
            }))
          );
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
  }, [profile?.id]);

  const filteredSections = useMemo(() => {
    return teacherAssignments.filter((a) => a.class_id === formData.class_id);
  }, [teacherAssignments, formData.class_id]);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      class_id: "",
      section_id: "",
      subject_id: "",
      due_date: "",
      status: "active",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (assignment: Assignment) => {
    const ta = teacherAssignments.find(
      (a) => a.class_name === assignment.class_name && a.section_name === assignment.section_name && a.subject_name === assignment.subject_name
    );
    if (!ta) {
      setError("You can only edit assignments for your assigned classes/subjects.");
      return;
    }

    setFormData({
      title: assignment.title,
      description: assignment.description || "",
      class_id: ta.class_id,
      section_id: ta.section_id,
      subject_id: ta.subject_id,
      due_date: assignment.due_date,
      status: assignment.status,
    });
    setEditingId(assignment.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || !profile?.school_id) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();

      const isAuthorized = teacherAssignments.some(
        (a) =>
          a.class_id === formData.class_id &&
          a.section_id === formData.section_id &&
          a.subject_id === formData.subject_id
      );

      if (!isAuthorized) {
        throw new Error("You are not authorized to create assignments for this class/section/subject.");
      }

      const assignmentData = {
        school_id: profile.school_id,
        teacher_id: profile.id,
        class_id: formData.class_id,
        section_id: formData.section_id,
        subject_id: formData.subject_id,
        title: formData.title,
        description: formData.description || null,
        assigned_date: new Date().toISOString().split("T")[0],
        due_date: formData.due_date,
        status: formData.status,
      };

      if (editingId) {
        const { error: updateError } = await supabase
          .from("academic_assignments")
          .update(assignmentData)
          .eq("id", editingId)
          .eq("teacher_id", profile.id);

        if (updateError) throw updateError;
        setSuccess("Assignment updated successfully!");
      } else {
        const { error: insertError } = await supabase
          .from("academic_assignments")
          .insert(assignmentData);

        if (insertError) throw insertError;
        setSuccess("Assignment created successfully!");
      }

      resetForm();

      const { data: assignmentsData } = await supabase
        .from("academic_assignments")
        .select("id, title, description, assigned_date, due_date, status, class_id, section_id, subject_id")
        .eq("teacher_id", profile.id)
        .order("created_at", { ascending: false });

      if (assignmentsData) {
        const classIds = [...new Set(assignmentsData.map((a) => a.class_id))];
        const sectionIds = [...new Set(assignmentsData.map((a) => a.section_id))];
        const subjectIds = [...new Set(assignmentsData.map((a) => a.subject_id))];

        const [classesRes, sectionsRes, subjectsRes] = await Promise.all([
          supabase.from("classes").select("id, name").in("id", classIds),
          supabase.from("sections").select("id, name").in("id", sectionIds),
          supabase.from("subjects").select("id, name").in("id", subjectIds),
        ]);

        const classMap = new Map(classesRes.data?.map((c) => [c.id, c.name]) || []);
        const sectionMap = new Map(sectionsRes.data?.map((s) => [s.id, s.name]) || []);
        const subjectMap = new Map(subjectsRes.data?.map((s) => [s.id, s.name]) || []);

        setAssignments(
          assignmentsData.map((a) => ({
            id: a.id,
            title: a.title,
            description: a.description,
            subject_name: subjectMap.get(a.subject_id) || "Unknown",
            class_name: classMap.get(a.class_id) || "Unknown",
            section_name: sectionMap.get(a.section_id) || "Unknown",
            assigned_date: a.assigned_date,
            due_date: a.due_date,
            status: a.status,
          }))
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save assignment");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!profile?.id) return;

    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase
        .from("academic_assignments")
        .delete()
        .eq("id", id)
        .eq("teacher_id", profile.id);

      if (deleteError) throw deleteError;

      setAssignments((prev) => prev.filter((a) => a.id !== id));
      setSuccess("Assignment deleted successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete assignment");
    } finally {
      setDeleteConfirm(null);
    }
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

  return (
    <DashboardLayout allowedRoles={["teacher"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Assignments</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage homework and assignments for your classes.
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus size={18} />
            New Assignment
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">
                  {editingId ? "Edit Assignment" : "New Assignment"}
                </h2>
                <button onClick={resetForm} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Assignment title"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Assignment description"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Class *</label>
                    <select
                      required
                      value={formData.class_id}
                      onChange={(e) => setFormData({ ...formData, class_id: e.target.value, section_id: "", subject_id: "" })}
                      className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">Select</option>
                      {[...new Map(teacherAssignments.map((a) => [a.class_id, a])).values()].map((a) => (
                        <option key={a.class_id} value={a.class_id}>{a.class_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Section *</label>
                    <select
                      required
                      value={formData.section_id}
                      onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                      disabled={!formData.class_id}
                      className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
                    >
                      <option value="">Select</option>
                      {filteredSections.map((a) => (
                        <option key={a.section_id} value={a.section_id}>{a.section_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Subject *</label>
                    <select
                      required
                      value={formData.subject_id}
                      onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                      disabled={!formData.section_id}
                      className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
                    >
                      <option value="">Select</option>
                      {filteredSections.map((a) => (
                        <option key={a.subject_id} value={a.subject_id}>{a.subject_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Due Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof formData.status })}
                      className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : editingId ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-slate-800">Delete Assignment</h3>
              <p className="mt-2 text-sm text-slate-600">
                Are you sure you want to delete this assignment? This action cannot be undone.
              </p>
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <span className="ml-3 text-slate-600">Loading assignments...</span>
          </div>
        ) : assignments.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <FileText size={48} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-700">No Assignments</h3>
            <p className="mt-1 text-sm text-slate-500">
              You haven&apos;t created any assignments yet.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Class
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Section
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Subject
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Due Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignments.map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{assignment.title}</p>
                          {assignment.description && (
                            <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{assignment.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{assignment.class_name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{assignment.section_name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{assignment.subject_name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {new Date(assignment.due_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${getStatusColor(assignment.status)}`}
                        >
                          {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleEdit(assignment)}
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(assignment.id)}
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
