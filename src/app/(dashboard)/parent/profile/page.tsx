"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loader2, Save, User, Users } from "lucide-react";

interface ParentProfile {
  full_name: string;
  email: string;
  phone: string | null;
  relationship: string;
  address: string | null;
  occupation: string | null;
}

interface LinkedChild {
  id: string;
  full_name: string;
  class_name: string;
  section_name: string;
}

export default function ParentProfilePage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [parentData, setParentData] = useState<ParentProfile>({
    full_name: "",
    email: "",
    phone: null,
    relationship: "",
    address: null,
    occupation: null,
  });
  const [linkedChildren, setLinkedChildren] = useState<LinkedChild[]>([]);

  useEffect(() => {
    if (!profile?.id) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const parentId = profile.id;

        // Get parent data
        const { data: parentRes } = await supabase
          .from("parents")
          .select("*")
          .eq("profile_id", parentId)
          .single();

        // Get linked children
        let children: LinkedChild[] = [];
        if (parentRes) {
          const { data: parentStudents } = await supabase
            .from("parent_student")
            .select("student_id")
            .eq("parent_id", parentRes.id);

          if (parentStudents && parentStudents.length > 0) {
            const studentIds = parentStudents.map((ps) => ps.student_id);
            const { data: studentsData } = await supabase
              .from("students")
              .select("id, full_name, class_id, section_id")
              .in("id", studentIds);

            if (studentsData) {
              const classIds = [...new Set(studentsData.map((s) => s.class_id))];
              const sectionIds = [...new Set(studentsData.map((s) => s.section_id))];

              const [classesRes, sectionsRes] = await Promise.all([
                supabase.from("classes").select("id, name").in("id", classIds),
                supabase.from("sections").select("id, name").in("id", sectionIds),
              ]);

              const classMap = new Map(classesRes.data?.map((c) => [c.id, c.name]) || []);
              const sectionMap = new Map(sectionsRes.data?.map((s) => [s.id, s.name]) || []);

              children = studentsData.map((s) => ({
                id: s.id,
                full_name: s.full_name,
                class_name: classMap.get(s.class_id) || "Unknown",
                section_name: sectionMap.get(s.section_id) || "Unknown",
              }));
            }
          }
        }

        if (cancelled) return;

        setParentData({
          full_name: parentRes?.full_name || profile.full_name || "",
          email: profile.email || "",
          phone: parentRes?.phone || profile.phone,
          relationship: parentRes?.relationship || "",
          address: parentRes?.address || null,
          occupation: parentRes?.occupation || null,
        });
        setLinkedChildren(children);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load profile");
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
  }, [profile?.id, profile?.full_name, profile?.email, profile?.phone]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();

      // Update profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: parentData.full_name,
          phone: parentData.phone,
        })
        .eq("id", profile.id);

      if (profileError) throw profileError;

      // Update parents table
      const { error: parentError } = await supabase
        .from("parents")
        .update({
          phone: parentData.phone,
          address: parentData.address,
          occupation: parentData.occupation,
        })
        .eq("profile_id", profile.id);

      if (parentError) throw parentError;

      setSuccess("Profile updated successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout allowedRoles={["parent"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
          <p className="mt-1 text-sm text-slate-500">
            View and update your profile information.
          </p>
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

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <span className="ml-3 text-slate-600">Loading profile...</span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Personal Information */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
                <User size={18} className="text-blue-600" />
                Personal Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Full Name</label>
                  <input
                    type="text"
                    value={parentData.full_name}
                    onChange={(e) => setParentData({ ...parentData, full_name: e.target.value })}
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
                  <input
                    type="email"
                    value={parentData.email}
                    disabled
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500"
                  />
                  <p className="mt-1 text-xs text-slate-400">Email cannot be changed</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Phone</label>
                  <input
                    type="tel"
                    value={parentData.phone || ""}
                    onChange={(e) => setParentData({ ...parentData, phone: e.target.value || null })}
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Relationship</label>
                  <input
                    type="text"
                    value={parentData.relationship}
                    disabled
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 capitalize"
                  />
                  <p className="mt-1 text-xs text-slate-400">Contact admin to change</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Occupation</label>
                  <input
                    type="text"
                    value={parentData.occupation || ""}
                    onChange={(e) => setParentData({ ...parentData, occupation: e.target.value || null })}
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Address</label>
                  <textarea
                    value={parentData.address || ""}
                    onChange={(e) => setParentData({ ...parentData, address: e.target.value || null })}
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>

            {/* Linked Children */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
                <Users size={18} className="text-emerald-600" />
                Linked Children
              </h3>
              {linkedChildren.length === 0 ? (
                <p className="text-sm text-slate-500">No children linked to your account.</p>
              ) : (
                <div className="space-y-3">
                  {linkedChildren.map((child) => (
                    <div
                      key={child.id}
                      className="flex items-center justify-between rounded-lg bg-slate-50 p-3"
                    >
                      <div>
                        <p className="font-medium text-slate-800">{child.full_name}</p>
                        <p className="text-sm text-slate-500">
                          {child.class_name} - {child.section_name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
