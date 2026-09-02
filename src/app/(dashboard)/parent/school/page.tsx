"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loader2, School, Mail, Phone, MapPin } from "lucide-react";

interface SchoolInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  logo_url: string | null;
}

export default function ParentSchoolPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [school, setSchool] = useState<SchoolInfo | null>(null);

  useEffect(() => {
    if (!profile?.school_id) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        const { data, error: fetchError } = await supabase
          .from("schools")
          .select("name, email, phone, address, city, logo_url")
          .eq("id", profile.school_id)
          .single();

        if (fetchError) throw fetchError;

        if (!cancelled) {
          setSchool(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load school information");
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
  }, [profile?.school_id]);

  return (
    <DashboardLayout allowedRoles={["parent"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">School Information</h1>
          <p className="mt-1 text-sm text-slate-500">
            Details about your school.
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
            <span className="ml-3 text-slate-600">Loading school information...</span>
          </div>
        ) : school ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              {school.logo_url ? (
                <img
                  src={school.logo_url}
                  alt={school.name}
                  className="h-16 w-16 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-100">
                  <School size={32} className="text-blue-600" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-slate-800">{school.name}</h2>
                <p className="text-sm text-slate-500">{school.city}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-4">
                <Mail size={20} className="text-blue-600" />
                <div>
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="text-sm font-medium text-slate-700">{school.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-4">
                <Phone size={20} className="text-emerald-600" />
                <div>
                  <p className="text-xs text-slate-500">Phone</p>
                  <p className="text-sm font-medium text-slate-700">{school.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-4 sm:col-span-2">
                <MapPin size={20} className="text-amber-600" />
                <div>
                  <p className="text-xs text-slate-500">Address</p>
                  <p className="text-sm font-medium text-slate-700">
                    {school.address}, {school.city}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <School size={48} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-700">No School Information</h3>
            <p className="mt-1 text-sm text-slate-500">
              School information is not available.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
