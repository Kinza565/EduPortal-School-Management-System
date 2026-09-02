"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loader2, Save, User, Award } from "lucide-react";

interface TeacherProfile {
  full_name: string;
  email: string;
  phone: string | null;
  employee_id: string | null;
  qualification: string | null;
  specialization: string | null;
  joining_date: string | null;
}

export default function TeacherProfilePage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<TeacherProfile>({
    full_name: "",
    email: "",
    phone: null,
    employee_id: null,
    qualification: null,
    specialization: null,
    joining_date: null,
  });

  useEffect(() => {
    if (!profile?.id) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        const { data: teacherDetails } = await supabase
          .from("teacher_details")
          .select("*")
          .eq("profile_id", profile.id)
          .single();

        if (!cancelled) {
          setProfileData({
            full_name: profile.full_name || "",
            email: profile.email || "",
            phone: profile.phone,
            employee_id: teacherDetails?.employee_id || null,
            qualification: teacherDetails?.qualification || null,
            specialization: teacherDetails?.specialization || null,
            joining_date: teacherDetails?.joining_date || null,
          });
        }
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
          full_name: profileData.full_name,
          phone: profileData.phone,
        })
        .eq("id", profile.id);

      if (profileError) throw profileError;

      // Update teacher_details table
      const { error: detailsError } = await supabase
        .from("teacher_details")
        .upsert(
          {
            profile_id: profile.id,
            qualification: profileData.qualification,
            specialization: profileData.specialization,
          },
          { onConflict: "profile_id" }
        );

      if (detailsError) throw detailsError;

      setSuccess("Profile updated successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout allowedRoles={["teacher"]}>
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
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500"
                  />
                  <p className="mt-1 text-xs text-slate-400">Email cannot be changed</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={profileData.phone || ""}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value || null })}
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={profileData.employee_id || ""}
                    disabled
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500"
                  />
                  <p className="mt-1 text-xs text-slate-400">Contact admin to change</p>
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
                <Award size={18} className="text-emerald-600" />
                Professional Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Qualification
                  </label>
                  <input
                    type="text"
                    value={profileData.qualification || ""}
                    onChange={(e) => setProfileData({ ...profileData, qualification: e.target.value || null })}
                    placeholder="e.g., M.Sc. Mathematics"
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Specialization
                  </label>
                  <input
                    type="text"
                    value={profileData.specialization || ""}
                    onChange={(e) => setProfileData({ ...profileData, specialization: e.target.value || null })}
                    placeholder="e.g., Algebra, Calculus"
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    value={profileData.joining_date || ""}
                    disabled
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500"
                  />
                  <p className="mt-1 text-xs text-slate-400">Contact admin to change</p>
                </div>
              </div>
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
