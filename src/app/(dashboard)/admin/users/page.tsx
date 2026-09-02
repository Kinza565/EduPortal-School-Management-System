"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Search, Mail, Phone, Calendar, Shield, UserCheck, UserX } from "lucide-react";
import type { Profile } from "@/types/database";

export default function AdminUsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
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

      let query = supabase
        .from("profiles")
        .select("*")
        .eq("school_id", profile.school_id)
        .order("created_at", { ascending: false });

      if (filterRole !== "all") {
        query = query.eq("role", filterRole as "admin" | "teacher" | "parent");
      }

      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data, error } = await query;

      if (error) {
        setError("Failed to load users.");
      } else {
        setProfiles(data || []);
      }
      setIsLoading(false);
    };

    fetchUsers();
  }, [supabase, router, filterRole, searchQuery]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin: "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20",
      teacher: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
      parent: "bg-purple-50 text-purple-700 ring-1 ring-purple-600/20",
    };
    return styles[role] || "bg-slate-50 text-slate-700 ring-1 ring-slate-600/20";
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield size={14} className="text-blue-600" />;
      case "teacher":
        return <UserCheck size={14} className="text-emerald-600" />;
      case "parent":
        return <Users size={14} className="text-purple-600" />;
      default:
        return <UserX size={14} className="text-slate-600" />;
    }
  };

  // Stats
  const totalUsers = profiles.length;
  const activeUsers = profiles.filter((p) => p.is_active).length;
  const adminCount = profiles.filter((p) => p.role === "admin").length;
  const teacherCount = profiles.filter((p) => p.role === "teacher").length;
  const parentCount = profiles.filter((p) => p.role === "parent").length;

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-slate-500 font-medium">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 lg:text-3xl">Users</h1>
        <p className="text-slate-500 mt-1">
          Manage users in your school.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Users</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">{totalUsers}</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-3">
              <Users size={22} className="text-blue-600" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Active</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">{activeUsers}</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 p-3">
              <UserCheck size={22} className="text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Teachers</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">{teacherCount}</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 p-3">
              <Shield size={22} className="text-amber-600" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Parents</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">{parentCount}</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 p-3">
              <Users size={22} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all duration-200"
            />
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="role-filter" className="text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
              Filter:
            </Label>
            <select
              id="role-filter"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-sm text-slate-600 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all duration-200 hover:bg-slate-100"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="parent">Parent</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 animate-slide-up">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-50/50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody>
              {profiles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                      <Users size={24} className="text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-700">No users found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {filterRole !== "all" || searchQuery ? "Try adjusting your search or filters." : "Users will appear here when added."}
                    </p>
                  </td>
                </tr>
              ) : (
                profiles.map((profile, index) => (
                  <tr
                    key={profile.id}
                    className="border-b border-slate-100/80 transition-all duration-200 hover:bg-blue-50/30 group"
                    style={{ animationDelay: `${index * 20}ms` }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-sm group-hover:scale-105 transition-transform duration-200">
                          {profile.full_name?.charAt(0) || "U"}
                        </div>
                        <span className="font-medium text-slate-800 group-hover:text-blue-700 transition-colors duration-200">{profile.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail size={14} className="text-slate-400" />
                        <span className="truncate max-w-[200px]">{profile.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getRoleBadge(profile.role)}`}>
                        {getRoleIcon(profile.role)}
                        {profile.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone size={14} className="text-slate-400" />
                        {profile.phone || "—"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        profile.is_active
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20"
                          : "bg-red-50 text-red-700 ring-1 ring-red-600/20"
                      }`}>
                        {profile.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Calendar size={14} className="text-slate-400" />
                        {formatDate(profile.created_at)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
