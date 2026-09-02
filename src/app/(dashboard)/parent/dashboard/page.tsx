"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AnnouncementWidget } from "@/components/announcements";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  Loader2,
  Users,
  CalendarCheck,
  ClipboardList,
  FileText,
  Award,
  DollarSign,
  GraduationCap,
  Sparkles,
  Heart,
} from "lucide-react";
import Link from "next/link";

interface ChildSummary {
  id: string;
  full_name: string;
  student_id: string;
  class_name: string;
  section_name: string;
  attendance_percentage: number;
  pending_assignments: number;
  outstanding_fees: number;
}

interface DashboardStats {
  totalChildren: number;
  avgAttendance: number;
  totalPendingAssignments: number;
  upcomingExams: number;
  totalOutstandingFees: number;
  recentResultsCount: number;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function ParentDashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalChildren: 0,
    avgAttendance: 0,
    totalPendingAssignments: 0,
    upcomingExams: 0,
    totalOutstandingFees: 0,
    recentResultsCount: 0,
  });

  const studentIds = useMemo(() => children.map((c) => c.id), [children]);

  useEffect(() => {
    if (!profile?.id) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const parentId = profile.id;
        const schoolId = profile.school_id;

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

        const [studentsRes, classesRes, sectionsRes] = await Promise.all([
          supabase
            .from("students")
            .select("id, full_name, student_id, class_id, section_id")
            .in("id", studentIds),
          supabase
            .from("classes")
            .select("id, name")
            .in("id", [...new Set(studentIds.map(() => ""))]),
          supabase
            .from("sections")
            .select("id, name")
            .in("id", [...new Set(studentIds.map(() => ""))]),
        ]);

        if (cancelled) return;

        const classMap = new Map(classesRes.data?.map((c) => [c.id, c.name]) || []);
        const sectionMap = new Map(sectionsRes.data?.map((s) => [s.id, s.name]) || []);

        const { data: allAttendance } = await supabase
          .from("attendance_records")
          .select("status, student_id")
          .in("student_id", studentIds)
          .eq("school_id", schoolId);

        const attendanceByStudent = new Map<string, { status: string }[]>();
        (allAttendance || []).forEach((record) => {
          const existing = attendanceByStudent.get(record.student_id) || [];
          existing.push(record);
          attendanceByStudent.set(record.student_id, existing);
        });

        const assignmentResults = await Promise.all(
          studentsRes.data?.map((s) =>
            supabase
              .from("academic_assignments")
              .select("id", { count: "exact", head: true })
              .eq("class_id", s.class_id)
              .eq("section_id", s.section_id)
              .eq("status", "active")
              .eq("school_id", schoolId)
          ) || []
        );

        const upcomingExamsRes = await supabase
          .from("exams")
          .select("id", { count: "exact", head: true })
          .eq("status", "upcoming")
          .eq("school_id", schoolId)
          .in(
            "class_id",
            studentsRes.data?.map((s) => s.class_id) || []
          );

        const feesRes = await supabase
          .from("student_fees")
          .select("amount")
          .in("student_id", studentIds)
          .eq("school_id", schoolId)
          .in("status", ["pending", "overdue", "partial"]);

        const resultsRes = await supabase
          .from("results")
          .select("id", { count: "exact", head: true })
          .in("student_id", studentIds)
          .eq("school_id", schoolId);

        if (cancelled) return;

        const childrenData: ChildSummary[] = studentsRes.data?.map((student, index) => {
          const attendance = attendanceByStudent.get(student.id) || [];
          const present = attendance.filter((a) => a.status === "present" || a.status === "late").length;
          const total = attendance.length;
          const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

          return {
            id: student.id,
            full_name: student.full_name,
            student_id: student.student_id,
            class_name: classMap.get(student.class_id) || "Unknown",
            section_name: sectionMap.get(student.section_id) || "Unknown",
            attendance_percentage: percentage,
            pending_assignments: assignmentResults[index]?.count || 0,
            outstanding_fees: 0,
          };
        }) || [];

        const totalOutstanding = feesRes.data?.reduce((sum, f) => sum + f.amount, 0) || 0;
        const avgAttendance =
          childrenData.length > 0
            ? Math.round(childrenData.reduce((sum, c) => sum + c.attendance_percentage, 0) / childrenData.length)
            : 0;

        setChildren(childrenData);
        setStats({
          totalChildren: childrenData.length,
          avgAttendance,
          totalPendingAssignments: childrenData.reduce((sum, c) => sum + c.pending_assignments, 0),
          upcomingExams: upcomingExamsRes.count || 0,
          totalOutstandingFees: totalOutstanding,
          recentResultsCount: resultsRes.count || 0,
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard");
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

  return (
    <DashboardLayout allowedRoles={["parent"]}>
      <div className="space-y-6">
        {/* Premium Welcome Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600 p-6 md:p-8 text-white shadow-xl shadow-pink-500/20">
          {/* Background Decorations */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute top-1/2 right-1/3 w-20 h-20 bg-white/5 rounded-full blur-xl" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-5 h-5 text-pink-200 animate-pulse" />
              <span className="text-pink-100 text-sm font-medium">{getGreeting()}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Welcome, {profile?.full_name || "Parent"} 👋
            </h1>
            <p className="text-pink-100 text-sm md:text-base mt-2 max-w-lg">
              Stay connected with your {stats.totalChildren > 1 ? "children's" : "child's"} academic progress and school activities.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 animate-slide-up">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 w-full">
                    <div className="h-3 w-20 skeleton-text" />
                    <div className="h-6 w-16 skeleton-text" />
                  </div>
                  <div className="h-10 w-10 rounded-xl skeleton" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
              <StatCard
                title="My Children"
                value={stats.totalChildren}
                icon={Users}
                iconColor="text-blue-600"
                iconBgColor="bg-gradient-to-br from-blue-50 to-blue-100"
              />
              <StatCard
                title="Avg. Attendance"
                value={`${stats.avgAttendance}%`}
                icon={CalendarCheck}
                iconColor="text-emerald-600"
                iconBgColor="bg-gradient-to-br from-emerald-50 to-emerald-100"
              />
              <StatCard
                title="Pending Assignments"
                value={stats.totalPendingAssignments}
                icon={ClipboardList}
                iconColor="text-amber-600"
                iconBgColor="bg-gradient-to-br from-amber-50 to-amber-100"
              />
              <StatCard
                title="Upcoming Exams"
                value={stats.upcomingExams}
                icon={FileText}
                iconColor="text-purple-600"
                iconBgColor="bg-gradient-to-br from-purple-50 to-purple-100"
              />
              <StatCard
                title="Recent Results"
                value={stats.recentResultsCount}
                icon={Award}
                iconColor="text-indigo-600"
                iconBgColor="bg-gradient-to-br from-indigo-50 to-indigo-100"
              />
              <StatCard
                title="Outstanding Fees"
                value={`$${stats.totalOutstandingFees.toLocaleString()}`}
                icon={DollarSign}
                iconColor="text-rose-600"
                iconBgColor="bg-gradient-to-br from-rose-50 to-rose-100"
              />
            </div>

            {/* Quick Access */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm card-hover">
              <h2 className="mb-4 text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Quick Access
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <QuickAccessCard
                  title="My Children"
                  description="View your children's profiles"
                  icon={<GraduationCap size={20} />}
                  href="/parent/children"
                />
                <QuickAccessCard
                  title="Attendance"
                  description="Track attendance records"
                  icon={<CalendarCheck size={20} />}
                  href="/parent/attendance"
                />
                <QuickAccessCard
                  title="Assignments"
                  description="View homework and tasks"
                  icon={<ClipboardList size={20} />}
                  href="/parent/assignments"
                />
                <QuickAccessCard
                  title="Exams"
                  description="Upcoming and past exams"
                  icon={<FileText size={20} />}
                  href="/parent/exams"
                />
                <QuickAccessCard
                  title="Results"
                  description="Academic performance"
                  icon={<Award size={20} />}
                  href="/parent/results"
                />
                <QuickAccessCard
                  title="Fees"
                  description="Fee status and payments"
                  icon={<DollarSign size={20} />}
                  href="/parent/fees"
                />
              </div>
            </div>

            {/* Children Overview */}
            {children.length > 0 && (
              <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm card-hover">
                <h2 className="mb-4 text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  My Children
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
                  {children.map((child) => (
                    <Link
                      key={child.id}
                      href={`/parent/children/${child.id}`}
                      className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/50 p-4 transition-all duration-300 hover:shadow-lg hover:border-slate-300/80 hover:-translate-y-0.5 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-md group-hover:scale-105 transition-transform duration-300">
                          {child.full_name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-800">{child.full_name}</h3>
                          <p className="text-xs text-slate-500">
                            {child.class_name} - {child.section_name}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                        <div className="rounded-lg bg-emerald-50 p-2 text-center">
                          <p className="text-emerald-600 font-bold text-sm">{child.attendance_percentage}%</p>
                          <p className="text-emerald-500 text-[10px]">Attendance</p>
                        </div>
                        <div className="rounded-lg bg-amber-50 p-2 text-center">
                          <p className="text-amber-600 font-bold text-sm">{child.pending_assignments}</p>
                          <p className="text-amber-500 text-[10px]">Pending</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {children.length === 0 && (
              <div className="rounded-xl border border-slate-200/80 bg-white p-10 text-center animate-fade-in">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                  <Users size={32} className="text-slate-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-700">No Children Linked</h3>
                <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                  No children are currently linked to your account. Please contact the school administration.
                </p>
              </div>
            )}

            {/* Announcements */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm card-hover">
              <h2 className="mb-4 text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                School Announcements
              </h2>
              <AnnouncementWidget role="parent" />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function QuickAccessCard({
  title,
  description,
  icon,
  href,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/50 p-3.5 transition-all duration-300 hover:shadow-lg hover:border-slate-300/80 hover:-translate-y-0.5 group"
    >
      <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 p-2.5 text-slate-500 group-hover:scale-110 transition-transform duration-300">{icon}</div>
      <div>
        <h3 className="text-sm font-medium text-slate-800">{title}</h3>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </Link>
  );
}
