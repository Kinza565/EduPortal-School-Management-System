"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent } from "@/components/ui/card";
import { School as SchoolIcon, Mail, Phone, MapPin, Globe, Save, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import type { School } from "@/types/database";

export default function AdminSchoolPage() {
  const [school, setSchool] = useState<School | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    logo_url: "",
  });

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchSchool = async () => {
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

      const { data: schoolData } = await supabase
        .from("schools")
        .select("*")
        .eq("id", profile.school_id)
        .single();

      if (schoolData) {
        setSchool(schoolData);
        setFormData({
          name: schoolData.name,
          email: schoolData.email,
          phone: schoolData.phone,
          address: schoolData.address,
          city: schoolData.city,
          logo_url: schoolData.logo_url || "",
        });
      }
      setIsLoading(false);
    };

    fetchSchool();
  }, [supabase, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    if (!school) return;

    const { error } = await supabase
      .from("schools")
      .update({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        logo_url: formData.logo_url || null,
      })
      .eq("id", school.id);

    if (error) {
      setMessage({ type: "error", text: "Failed to update school information." });
    } else {
      setMessage({ type: "success", text: "School information updated successfully." });
      setSchool({ ...school, ...formData });
    }

    setIsSaving(false);
    setTimeout(() => setMessage(null), 3000);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-slate-500 font-medium">Loading school information...</p>
        </div>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
            <SchoolIcon size={32} className="text-slate-400" />
          </div>
          <p className="text-sm text-slate-500">School information not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 lg:text-3xl">School Information</h1>
        <p className="text-slate-500 mt-1">
          Manage your school profile and contact details.
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`rounded-xl border p-4 flex items-center gap-3 animate-slide-up ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle size={18} className="text-emerald-600" />
          ) : (
            <AlertCircle size={18} className="text-red-600" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* School Details Card */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-slate-50/50 px-6 py-4 border-b border-slate-100">
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800">
            <SchoolIcon size={18} className="text-blue-600" />
            School Details
          </h3>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <SchoolIcon size={14} className="text-slate-400" />
                  School Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Mail size={14} className="text-slate-400" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Phone size={14} className="text-slate-400" />
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <MapPin size={14} className="text-slate-400" />
                  City
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <MapPin size={14} className="text-slate-400" />
                  Address
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="logo_url" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Globe size={14} className="text-slate-400" />
                  Logo URL
                </Label>
                <Input
                  id="logo_url"
                  placeholder="https://example.com/logo.png"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                />
                <p className="text-xs text-slate-400">Enter a URL for your school logo image</p>
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button
                type="submit"
                disabled={isSaving}
                className="h-11 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-200 disabled:opacity-70 hover:scale-[1.01] active:scale-[0.99] px-6"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
