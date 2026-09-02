"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AnnouncementWidget } from "@/components/announcements";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  BookOpen,
  Users,
  ClipboardList,
  CalendarCheck,
  FileText,
  GraduationCap,
  Sparkles,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";

interface TeacherStats {
  assignedClasses: number;
  assignedSections: number;
  assignedSubjects: number;
  totalStudents: number;
  todayAttendance: number;
  pendingAssignments: number;
  upcomingExams: number;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function TeacherDashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<TeacherStats>({
    assignedClasses: 0,
    assignedSections: 0,
    assignedSubjects: 0,
    totalStudents: 0,
    todayAttendance: 0,
    pendingAssignments: 0,
    upcomingExams: 0,
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
        const schoolId = profile.school_id;

        const { data: assignments } = await supabase
          .from("teacher_assignments")
          .select("class_id, section_id, subject_id")
          .eq("teacher_id", teacherId);

        const uniqueClasses = new Set(assignments?.map((a) => a.class_id) || []);
        const uniqueSections = new Set(assignments?.map((a) => a.section_id) || []);
        const uniqueSubjects = new Set(assignments?.map((a) => a.subject_id) || []);

        const { data: students } = await supabase
          .from("students")
          .select("id")
          .eq("school_id", schoolId)
          .eq("status", "active")
          .in("class_id", Array.from(uniqueClasses));

        const today = new Date().toISOString().split("T")[0];

        const { data: todayAttendance } = await supabase
          .from("attendance_records")
          .select("id")
          .eq("school_id", schoolId)
          .eq("attendance_date", today)
          .in("class_id", Array.from(uniqueClasses));

        const { data: pendingAssignments } = await supabase
          .from("academic_assignments")
          .select("id")
          .eq("school_id", schoolId)
          .eq("teacher_id", teacherId)
          .eq("status", "active");

        const { data: upcomingExams } = await supabase
          .from("exams")
          .select("id")
          .eq("school_id", schoolId)
          .eq("status", "upcoming")
          .in("class_id", Array.from(uniqueClasses));

        if (!cancelled) {
          setStats({
            assignedClasses: uniqueClasses.size,
            assignedSections: uniqueSections.size,
            assignedSubjects: uniqueSubjects.size,
            totalStudents: students?.length || 0,
            todayAttendance: todayAttendance?.length || 0,
            pendingAssignments: pendingAssignments?.length || 0,
            upcomingExams: upcomingExams?.length || 0,
          });
        }
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
  }, [profile?.id, profile?.school_id]);

  return (
    <DashboardLayout allowedRoles={["teacher"]}>
      <div className="space-y-8 animate-in fade-in duration-1000">
        {/* Premium Welcome Hero Section */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#064e3b] via-[#0f172a] to-[#064e3b] p-8 md:p-10 text-white shadow-[0_20px_50px_rgba(6,78,59,0.15)] border border-white/5">
          
          {/* Advanced Background Decorations */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] left-[-10%] w-80 h-80 bg-teal-500/10 rounded-full blur-[100px]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:3rem_3rem]" />
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
                <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200">{formatDate()}</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
                {getGreeting()}, <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-teal-400">
                  {profile?.full_name || "Faculty Member"}
                </span> 👋
              </h1>
              <p className="text-slate-300 text-sm md:text-base max-w-xl font-medium leading-relaxed">
                You are currently managing <span className="text-white font-bold">{stats.totalStudents} students</span> across <span className="text-white font-bold">{stats.assignedClasses} academic classes</span>. Your next session is ready to begin.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                 <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Faculty Active</span>
                 </div>
                 <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Edu-Secure Node</span>
                 </div>
              </div>
            </div>

            {/* Quick Metrics Overlay in Hero */}
            <div className="grid grid-cols-2 gap-4 lg:w-[400px]">
               {[
                 { label: "Students", value: stats.totalStudents, icon: GraduationCap, color: "text-blue-400" },
                 { label: "My Subjects", value: stats.assignedSubjects, icon: ClipboardList, color: "text-emerald-400" },
                 { label: "Active Sections", value: stats.assignedSections, icon: Users, color: "text-purple-400" },
                 { label: "Assigned Classes", value: stats.assignedClasses, icon: BookOpen, color: "text-amber-400" },
               ].map((item, idx) => (
                 <div key={idx} className="p-5 rounded-3xl bg-white/[0.03] border border-white/5 backdrop-blur-md hover:bg-white/[0.06] transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-2">
                       <item.icon className={`w-4 h-4 ${item.color} group-hover:scale-110 transition-transform`} />
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.label}</span>
                    </div>
                    <div className="text-2xl font-black text-white">{item.value}</div>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 flex items-start gap-4 animate-shake">
            <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0">
               <span className="text-red-600 font-black text-xl">!</span>
            </div>
            <div>
               <h4 className="text-sm font-black text-red-900 uppercase tracking-wider mb-1">Dashboard Loading Error</h4>
               <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-40 rounded-[2rem] bg-white border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
              <StatCard
                title="Assigned Classes"
                value={stats.assignedClasses}
                icon={BookOpen}
                iconColor="text-blue-600"
                iconBgColor="bg-blue-50"
              />
              <StatCard
                title="Active Sections"
                value={stats.assignedSections}
                icon={GraduationCap}
                iconColor="text-purple-600"
                iconBgColor="bg-purple-50"
              />
              <StatCard
                title="My Subjects"
                value={stats.assignedSubjects}
                icon={ClipboardList}
                iconColor="text-emerald-600"
                iconBgColor="bg-emerald-50"
              />
              <StatCard
                title="Total Students"
                value={stats.totalStudents}
                icon={Users}
                iconColor="text-amber-600"
                iconBgColor="bg-amber-50"
              />
              <StatCard
                title="Today's Attendance"
                value={stats.todayAttendance}
                icon={CalendarCheck}
                iconColor="text-indigo-600"
                iconBgColor="bg-indigo-50"
              />
              <StatCard
                title="Pending Tasks"
                value={stats.pendingAssignments}
                icon={FileText}
                iconColor="text-rose-600"
                iconBgColor="bg-rose-50"
              />
              <StatCard
                title="Upcoming Exams"
                value={stats.upcomingExams}
                icon={FileText}
                iconColor="text-cyan-600"
                iconBgColor="bg-cyan-50"
              />
              <StatCard
                title="Quick Access"
                value="Launch"
                icon={TrendingUp}
                iconColor="text-teal-600"
                iconBgColor="bg-teal-50"
              />
            </div>

            {/* Announcements Panel with premium design */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200/60 p-2 shadow-[0_10px_40px_rgba(0,0,0,0.02)]">
               <div className="p-6 pb-2">
                  <div className="flex items-center justify-between">
                     <div className="space-y-1">
                        <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                           <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                              <Sparkles className="w-4 h-4 text-amber-600" />
                           </div>
                           Institutional Bulletins
                        </h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-11">Latest notices for faculty</p>
                     </div>
                     <button className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center gap-1.5 px-4 py-2 hover:bg-blue-50 rounded-xl transition-all">
                        View Archive <ArrowRight size={14} />
                     </button>
                  </div>
               </div>
               <AnnouncementWidget role="teacher" />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
