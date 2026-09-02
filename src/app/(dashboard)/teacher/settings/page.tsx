"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loader2, Save, Bell, Lock, User } from "lucide-react";

interface TeacherSettings {
  enableNotifications: boolean;
  enableEmailAlerts: boolean;
  notifyAttendance: boolean;
  notifyAssignments: boolean;
  notifyExams: boolean;
  notifyResults: boolean;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function TeacherSettingsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"notifications" | "security">("notifications");
  const [settings, setSettings] = useState<TeacherSettings>({
    enableNotifications: true,
    enableEmailAlerts: false,
    notifyAttendance: true,
    notifyAssignments: true,
    notifyExams: true,
    notifyResults: true,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    // Simulate saving notification preferences
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSuccess("Notification preferences saved successfully!");
    setSaving(false);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    if (settings.newPassword !== settings.confirmPassword) {
      setError("New password and confirmation do not match.");
      setSaving(false);
      return;
    }

    if (settings.newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      setSaving(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: settings.newPassword,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess("Password changed successfully!");
        setSettings({
          ...settings,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch {
      setError("Failed to change password.");
    }

    setSaving(false);
    setTimeout(() => setSuccess(null), 3000);
  };

  return (
    <DashboardLayout allowedRoles={["teacher"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your notification preferences and account security.
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

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setActiveTab("notifications")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "notifications"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Bell size={16} />
            Notifications
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "security"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Lock size={16} />
            Security
          </button>
        </div>

        {activeTab === "notifications" && (
          <form onSubmit={handleSaveNotifications}>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
                <Bell size={18} className="text-amber-600" />
                Notification Preferences
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Enable Notifications</p>
                    <p className="text-xs text-slate-500">Receive in-app notifications</p>
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
                <div className="border-t border-slate-100 pt-4">
                  <p className="mb-3 text-sm font-medium text-slate-700">Notify me about:</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                      <input
                        type="checkbox"
                        checked={settings.notifyAttendance}
                        onChange={(e) => setSettings({ ...settings, notifyAttendance: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-600">Attendance Alerts</span>
                    </label>
                    <label className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                      <input
                        type="checkbox"
                        checked={settings.notifyAssignments}
                        onChange={(e) => setSettings({ ...settings, notifyAssignments: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-600">New Assignments</span>
                    </label>
                    <label className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                      <input
                        type="checkbox"
                        checked={settings.notifyExams}
                        onChange={(e) => setSettings({ ...settings, notifyExams: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-600">Exam Schedules</span>
                    </label>
                    <label className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                      <input
                        type="checkbox"
                        checked={settings.notifyResults}
                        onChange={(e) => setSettings({ ...settings, notifyResults: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-600">Result Publications</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Preferences
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {activeTab === "security" && (
          <form onSubmit={handleChangePassword}>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
                <Lock size={18} className="text-red-600" />
                Change Password
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={settings.currentPassword}
                    onChange={(e) => setSettings({ ...settings, currentPassword: e.target.value })}
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={settings.newPassword}
                    onChange={(e) => setSettings({ ...settings, newPassword: e.target.value })}
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    required
                    minLength={8}
                  />
                  <p className="mt-1 text-xs text-slate-400">Must be at least 8 characters</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={settings.confirmPassword}
                    onChange={(e) => setSettings({ ...settings, confirmPassword: e.target.value })}
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    required
                    minLength={8}
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Changing...
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    Change Password
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
