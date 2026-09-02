import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import {
  GraduationCap,
  Users,
  UserCheck,
  BookOpen,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import {
  StatCard,
  AttendanceChart,
  EnrollmentChart,
  RecentActivity,
  QuickActions,
  UpcomingEvents,
} from "@/components/dashboard";
import { AnnouncementWidget } from "@/components/announcements";
import type { AttendanceRecord } from "@/types/database";

async function getAdminStats(supabase: Awaited<ReturnType<typeof createClient>>, schoolId: string) {
  const [teachersResult, parentsResult, studentsResult, classesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .eq("role", "teacher"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .eq("role", "parent"),
    supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .eq("status", "active"),
    supabase
      .from("classes")
      .select("*", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .eq("is_active", true),
  ]);

  return {
    teachers: teachersResult.count || 0,
    parents: parentsResult.count || 0,
    students: studentsResult.count || 0,
    classes: classesResult.count || 0,
  };
}

async function getTodayAttendance(supabase: Awaited<ReturnType<typeof createClient>>, schoolId: string) {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("school_id", schoolId)
    .eq("attendance_date", today);

  if (error || !data) {
    return { present: 0, absent: 0, late: 0, excused: 0, total: 0, percentage: 0 };
  }

  const records = data as AttendanceRecord[];
  const present = records.filter((r) => r.status === "present").length;
  const absent = records.filter((r) => r.status === "absent").length;
  const late = records.filter((r) => r.status === "late").length;
  const excused = records.filter((r) => r.status === "excused").length;
  const total = records.length;
  const applicable = present + absent + late;
  const percentage = applicable > 0 ? Math.round((present / applicable) * 100 * 10) / 10 : 0;

  return { present, absent, late, excused, total, percentage };
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

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, school_id, full_name")
    .eq("id", session.user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/login");
  }

  const [stats, todayAttendance] = await Promise.all([
    getAdminStats(supabase, profile.school_id),
    getTodayAttendance(supabase, profile.school_id),
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      {/* Premium Welcome Hero Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] p-8 md:p-10 text-white shadow-[0_20px_50px_rgba(15,23,42,0.15)] border border-white/5">
        
        {/* Advanced Background Decorations */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] left-[-10%] w-80 h-80 bg-emerald-600/10 rounded-full blur-[100px]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:3rem_3rem]" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
              <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200">{formatDate()}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
              {getGreeting()}, <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-emerald-400">
                {profile.full_name || "Administrator"}
              </span> 👋
            </h1>
            <p className="text-slate-400 text-sm md:text-base max-w-xl font-medium leading-relaxed">
              Your institution is currently overseeing <span className="text-white font-bold">{stats.students} active students</span> and <span className="text-white font-bold">{stats.teachers} faculty members</span>. All systems are operational.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
               <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">System Live</span>
               </div>
               <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Enterprise Secure</span>
               </div>
            </div>
          </div>

          {/* Quick Metrics Overlay in Hero */}
          <div className="grid grid-cols-2 gap-4 lg:w-[400px]">
             {[
               { label: "Students", value: stats.students, icon: GraduationCap, color: "text-blue-400" },
               { label: "Teachers", value: stats.teachers, icon: UserCheck, color: "text-emerald-400" },
               { label: "Parents", value: stats.parents, icon: Users, color: "text-purple-400" },
               { label: "Classes", value: stats.classes, icon: BookOpen, color: "text-amber-400" },
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

      {/* Main Stats Grid with enhanced shadow and micro-interactions */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Students"
          value={stats.students}
          change="+12% enrollment"
          changeType="positive"
          icon={GraduationCap}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-50"
        />
        <StatCard
          title="Total Faculty"
          value={stats.teachers}
          change="3 new joined"
          changeType="positive"
          icon={UserCheck}
          iconColor="text-emerald-600"
          iconBgColor="bg-emerald-50"
        />
        <StatCard
          title="Active Classes"
          value={stats.classes}
          change={`${stats.classes} active courses`}
          changeType="neutral"
          icon={BookOpen}
          iconColor="text-amber-600"
          iconBgColor="bg-amber-50"
        />
        <StatCard
          title="Daily Attendance"
          value={todayAttendance.total > 0 ? `${todayAttendance.percentage}%` : "0%"}
          change={
            todayAttendance.total > 0
              ? `${todayAttendance.present} students present`
              : "Marking in progress"
          }
          changeType={todayAttendance.percentage >= 80 ? "positive" : "neutral"}
          icon={Users}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-50"
        />
      </div>

      {/* Interactive Quick Actions Section */}
      <div className="bg-white rounded-[2rem] border border-slate-200/60 p-8 shadow-[0_10px_40px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between mb-8">
           <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                   <Sparkles className="w-4 h-4 text-amber-600" />
                </div>
                Quick Management Actions
              </h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-11">Essential administrative shortcuts</p>
           </div>
           <button className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center gap-1.5 px-4 py-2 hover:bg-blue-50 rounded-xl transition-all">
              View All <ArrowRight size={14} />
           </button>
        </div>
        <QuickActions />
      </div>

      {/* Analytics Central Panel */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Attendance Breakdown Glass Card */}
        <div className="bg-white rounded-[2rem] border border-slate-200/60 p-8 shadow-[0_10px_40px_rgba(0,0,0,0.02)] hover:shadow-xl hover:shadow-slate-200/20 transition-all group">
          <div className="mb-8 flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Attendance Analytics</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Real-time presence tracking</p>
            </div>
            <div className="flex items-center gap-3 bg-blue-50/50 p-2 rounded-2xl border border-blue-100/50">
               <div className="px-4 py-2 bg-blue-600 rounded-xl text-white font-black text-lg shadow-lg shadow-blue-600/20">
                  {todayAttendance.percentage}%
               </div>
            </div>
          </div>
          <div className="p-4 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 group-hover:bg-white group-hover:border-blue-200 transition-all duration-500">
             <AttendanceChart
               present={todayAttendance.present}
               absent={todayAttendance.absent}
               late={todayAttendance.late}
               excused={todayAttendance.excused}
             />
          </div>
        </div>

        {/* Enrollment Trend Glass Card */}
        <div className="bg-white rounded-[2rem] border border-slate-200/60 p-8 shadow-[0_10px_40px_rgba(0,0,0,0.02)] hover:shadow-xl hover:shadow-slate-200/20 transition-all group">
          <div className="mb-8">
             <div className="space-y-1">
               <h2 className="text-xl font-black text-slate-800 tracking-tight">Institutional Growth</h2>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Enrollment trends & projection</p>
             </div>
          </div>
          <div className="p-4 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 group-hover:bg-white group-hover:border-emerald-200 transition-all duration-500">
             <EnrollmentChart />
          </div>
        </div>
      </div>

      {/* Secondary Dashboard Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activity Feed */}
        <div className="bg-white rounded-[2rem] border border-slate-200/60 p-8 shadow-[0_10px_40px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-8">
             <div className="space-y-1">
               <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                 <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                 </div>
                 Operational Feed
               </h2>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-11">Real-time system activities</p>
             </div>
          </div>
          <RecentActivity />
        </div>

        {/* Calendar/Upcoming Feed */}
        <div className="bg-white rounded-[2rem] border border-slate-200/60 p-8 shadow-[0_10px_40px_rgba(0,0,0,0.02)]">
           <div className="flex items-center justify-between mb-8">
             <div className="space-y-1">
               <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                 <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-purple-600" />
                 </div>
                 Academic Calendar
               </h2>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-11">Upcoming exams & events</p>
             </div>
          </div>
          <UpcomingEvents />
        </div>
      </div>

      {/* Global Announcements */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200/60 p-2 shadow-[0_10px_40px_rgba(0,0,0,0.02)]">
        <Suspense fallback={
          <div className="p-8 space-y-4">
            <div className="h-6 w-48 bg-slate-100 rounded-full animate-pulse" />
            <div className="grid gap-4 md:grid-cols-2">
               <div className="h-32 bg-slate-50 rounded-3xl animate-pulse" />
               <div className="h-32 bg-slate-50 rounded-3xl animate-pulse" />
            </div>
          </div>
        }>
          <AnnouncementWidget role="admin" />
        </Suspense>
      </div>
    </div>
  );
}
