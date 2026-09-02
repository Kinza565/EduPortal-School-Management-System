"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, School as SchoolIcon, Bell, Shield, Palette } from "lucide-react";

interface Settings {
  schoolName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  logoUrl: string;
  academicYearStart: string;
  academicYearEnd: string;
  attendanceThreshold: number;
  enableNotifications: boolean;
  enableEmailAlerts: boolean;
  enableSmsAlerts: boolean;
  defaultLanguage: string;
  timezone: string;
  theme: "light" | "dark" | "auto";
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"school" | "notifications" | "preferences">("school");
  const [settings, setSettings] = useState<Settings>({
    schoolName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    logoUrl: "",
    academicYearStart: "",
    academicYearEnd: "",
    attendanceThreshold: 75,
    enableNotifications: true,
    enableEmailAlerts: false,
    enableSmsAlerts: false,
    defaultLanguage: "en",
    timezone: "UTC",
    theme: "light",
  });

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchSettings = async () => {
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

      const { data: school } = await supabase
        .from("schools")
        .select("*")
        .eq("id", profile.school_id)
        .single();

      if (school) {
        setSettings((prev) => ({
          ...prev,
          schoolName: school.name,
          email: school.email,
          phone: school.phone,
          address: school.address,
          city: school.city,
          logoUrl: school.logo_url || "",
        }));
      }

      setLoading(false);
    };

    fetchSettings();
  }, [supabase, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("id", session.user.id)
        .single();

      if (!profile) {
        setMessage({ type: "error", text: "Failed to get profile information." });
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from("schools")
        .update({
          name: settings.schoolName,
          email: settings.email,
          phone: settings.phone,
          address: settings.address,
          city: settings.city,
          logo_url: settings.logoUrl || null,
        })
        .eq("id", profile.school_id);

      if (error) {
        setMessage({ type: "error", text: "Failed to save settings." });
      } else {
        setMessage({ type: "success", text: "Settings saved successfully." });
      }
    } catch {
      setMessage({ type: "error", text: "An unexpected error occurred." });
    }

    setSaving(false);
    setTimeout(() => setMessage(null), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-blue-600" />
        <span className="ml-3 text-slate-600">Loading settings...</span>
      </div>
    );
  }

  const tabs = [
    { id: "school" as const, label: "School", icon: <SchoolIcon size={16} /> },
    { id: "notifications" as const, label: "Notifications", icon: <Bell size={16} /> },
    { id: "preferences" as const, label: "Preferences", icon: <Palette size={16} /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your school configuration and preferences.
        </p>
      </div>

      {message && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave}>
        {activeTab === "school" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
                <SchoolIcon size={18} className="text-blue-600" />
                School Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="schoolName">School Name</Label>
                  <Input
                    id="schoolName"
                    value={settings.schoolName}
                    onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
                    className="mt-1.5"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    className="mt-1.5"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    className="mt-1.5"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={settings.city}
                    onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                    className="mt-1.5"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    className="mt-1.5"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    placeholder="https://example.com/logo.png"
                    value={settings.logoUrl}
                    onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
                <Shield size={18} className="text-emerald-600" />
                Academic Configuration
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="academicYearStart">Academic Year Start</Label>
                  <Input
                    id="academicYearStart"
                    type="date"
                    value={settings.academicYearStart}
                    onChange={(e) => setSettings({ ...settings, academicYearStart: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="academicYearEnd">Academic Year End</Label>
                  <Input
                    id="academicYearEnd"
                    type="date"
                    value={settings.academicYearEnd}
                    onChange={(e) => setSettings({ ...settings, academicYearEnd: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="attendanceThreshold">Attendance Threshold (%)</Label>
                  <Input
                    id="attendanceThreshold"
                    type="number"
                    min="0"
                    max="100"
                    value={settings.attendanceThreshold}
                    onChange={(e) => setSettings({ ...settings, attendanceThreshold: parseInt(e.target.value) || 0 })}
                    className="mt-1.5"
                  />
                  <p className="mt-1 text-xs text-slate-400">Minimum attendance required for students</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
              <Bell size={18} className="text-amber-600" />
              Notification Preferences
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                <div>
                  <p className="text-sm font-medium text-slate-700">Enable Notifications</p>
                  <p className="text-xs text-slate-500">Receive in-app notifications for important events</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.enableNotifications}
                  onClick={() => setSettings({ ...settings, enableNotifications: !settings.enableNotifications })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.enableNotifications ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.enableNotifications ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                <div>
                  <p className="text-sm font-medium text-slate-700">Email Alerts</p>
                  <p className="text-xs text-slate-500">Receive notifications via email</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.enableEmailAlerts}
                  onClick={() => setSettings({ ...settings, enableEmailAlerts: !settings.enableEmailAlerts })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.enableEmailAlerts ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.enableEmailAlerts ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                <div>
                  <p className="text-sm font-medium text-slate-700">SMS Alerts</p>
                  <p className="text-xs text-slate-500">Receive notifications via SMS</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.enableSmsAlerts}
                  onClick={() => setSettings({ ...settings, enableSmsAlerts: !settings.enableSmsAlerts })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.enableSmsAlerts ? "bg-blue-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.enableSmsAlerts ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "preferences" && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
              <Palette size={18} className="text-purple-600" />
              System Preferences
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="language">Default Language</Label>
                <select
                  id="language"
                  value={settings.defaultLanguage}
                  onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value })}
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="en">English</option>
                  <option value="ur">Urdu</option>
                  <option value="ar">Arabic</option>
                </select>
              </div>
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <select
                  id="timezone"
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="UTC">UTC</option>
                  <option value="Asia/Karachi">Asia/Karachi</option>
                  <option value="Asia/Dubai">Asia/Dubai</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="Europe/London">Europe/London</option>
                </select>
              </div>
              <div>
                <Label htmlFor="theme">Theme</Label>
                <select
                  id="theme"
                  value={settings.theme}
                  onChange={(e) => setSettings({ ...settings, theme: e.target.value as "light" | "dark" | "auto" })}
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? (
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
  );
}
