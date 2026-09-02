"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  School,
  Users,
  User,
  LogOut,
  Menu,
  X,
  GraduationCap,
  BookOpen,
  ClipboardList,
  UserCheck,
  CalendarCheck,
  CalendarDays,
  BarChart3,
  Settings,
  ChevronRight,
  Search,
  Bell,
  ChevronDown,
  FileText,
  ClipboardEdit,
  Award,
  DollarSign,
  ArrowLeftRight,
  Sparkles,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { Role } from "@/types/database";
import { cn } from "@/components/ui/card";
import { NotificationBell } from "@/components/announcements";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const roleConfig: Record<
  Role,
  {
    label: string;
    dashboard: string;
    groups: NavGroup[];
  }
> = {
  admin: {
    label: "Administrator",
    dashboard: "/admin/dashboard",
    groups: [
      {
        items: [
          { href: "/admin/dashboard", label: "Dashboard Overview", icon: <LayoutDashboard size={18} /> },
        ],
      },
      {
        label: "MANAGEMENT",
        items: [
          { href: "/admin/students", label: "Student Registry", icon: <GraduationCap size={18} /> },
          { href: "/admin/teachers", label: "Faculty Members", icon: <UserCheck size={18} /> },
          { href: "/admin/parents", label: "Parental Accounts", icon: <Users size={18} /> },
          { href: "/admin/users", label: "System Users", icon: <Users size={18} /> },
        ],
      },
      {
        label: "ACADEMICS",
        items: [
          { href: "/admin/classes", label: "Academic Classes", icon: <BookOpen size={18} /> },
          { href: "/admin/subjects", label: "Course Subjects", icon: <ClipboardList size={18} /> },
          { href: "/admin/sections", label: "Class Sections", icon: <Layers size={18} /> },
          { href: "/admin/assignments", label: "Teacher Assignments", icon: <ClipboardEdit size={18} /> },
        ],
      },
      {
        label: "PERFORMANCE",
        items: [
          { href: "/admin/exams", label: "Examination Portal", icon: <FileText size={18} /> },
          { href: "/admin/results", label: "Performance Results", icon: <Award size={18} /> },
          { href: "/admin/report-cards", label: "Progress Reports", icon: <FileText size={18} /> },
        ],
      },
      {
        label: "LOGISTICS",
        items: [
          { href: "/admin/attendance", label: "Daily Attendance", icon: <CalendarCheck size={18} /> },
          { href: "/admin/fees", label: "Finance & Fees", icon: <DollarSign size={18} /> },
          { href: "/admin/announcements", label: "Bulletin Board", icon: <Bell size={18} /> },
        ],
      },
      {
        label: "ANALYTICS",
        items: [
          { href: "/admin/reports", label: "Institutional Reports", icon: <BarChart3 size={18} /> },
          { href: "/admin/school", label: "Institution Settings", icon: <School size={18} /> },
        ],
      },
    ],
  },
  teacher: {
    label: "Teacher",
    dashboard: "/teacher/dashboard",
    groups: [
      {
        items: [
          { href: "/teacher/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
        ],
      },
      {
        label: "MY CLASSROOM",
        items: [
          { href: "/teacher/my-classes", label: "Assigned Classes", icon: <BookOpen size={18} /> },
          { href: "/teacher/my-students", label: "Student List", icon: <GraduationCap size={18} /> },
          { href: "/teacher/my-subjects", label: "Curriculum Subjects", icon: <ClipboardList size={18} /> },
        ],
      },
      {
        label: "OPERATIONS",
        items: [
          { href: "/teacher/attendance", label: "Mark Attendance", icon: <CalendarCheck size={18} /> },
          { href: "/teacher/results", label: "Grading & Results", icon: <Award size={18} /> },
          { href: "/teacher/assignments", label: "Class Assignments", icon: <FileText size={18} /> },
          { href: "/teacher/exams", label: "Exam Schedules", icon: <FileText size={18} /> },
        ],
      },
      {
        label: "COMMUNICATION",
        items: [
          { href: "/teacher/announcements", label: "School Notices", icon: <Bell size={18} /> },
        ],
      },
      {
        label: "PROFILE",
        items: [
          { href: "/teacher/profile", label: "Faculty Profile", icon: <User size={18} /> },
        ],
      },
    ],
  },
  parent: {
    label: "Parent",
    dashboard: "/parent/dashboard",
    groups: [
      {
        items: [
          { href: "/parent/dashboard", label: "Guardian Dashboard", icon: <LayoutDashboard size={18} /> },
        ],
      },
      {
        label: "CHILD MONITORING",
        items: [
          { href: "/parent/children", label: "Student Profiles", icon: <Users size={18} /> },
          { href: "/parent/attendance", label: "Attendance Logs", icon: <CalendarCheck size={18} /> },
          { href: "/parent/assignments", label: "Assigned Homework", icon: <ClipboardList size={18} /> },
        ],
      },
      {
        label: "ACADEMICS",
        items: [
          { href: "/parent/exams", label: "Examination Dates", icon: <FileText size={18} /> },
          { href: "/parent/results", label: "Grade Results", icon: <Award size={18} /> },
          { href: "/parent/report-cards", label: "Term Report Cards", icon: <FileText size={18} /> },
        ],
      },
      {
        label: "BILLING",
        items: [
          { href: "/parent/fees", label: "Fee Statements", icon: <DollarSign size={18} /> },
        ],
      },
      {
        label: "INFORMATION",
        items: [
          { href: "/parent/announcements", label: "Announcements", icon: <Bell size={18} /> },
          { href: "/parent/profile", label: "Personal Profile", icon: <User size={18} /> },
        ],
      },
    ],
  },
};

// Decorative Component for Layers Icon since it was missing in standard lucide imports in previous file
function Layers({ size = 18 }: { size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.27a2 2 0 0 0 0 3.66l8.57 4.09a2 2 0 0 0 1.66 0l8.57-4.09a2 2 0 0 0 0-3.66Z" />
      <path d="m2.6 13.93 8.57 4.09a2 2 0 0 0 1.66 0l8.57-4.09" />
      <path d="m2.6 17.93 8.57 4.09a2 2 0 0 0 1.66 0l8.57-4.09" />
    </svg>
  );
}

export function DashboardLayout({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: Role[];
}) {
  const { profile, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isLoading && (!profile || !allowedRoles.includes(profile.role))) {
      router.push("/login");
    }
  }, [isLoading, profile, allowedRoles, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
             <div className="h-12 w-12 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin" />
             <div className="absolute inset-0 flex items-center justify-center">
                <GraduationCap size={16} className="text-blue-600" />
             </div>
          </div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest animate-pulse">Initializing Portal...</p>
        </div>
      </div>
    );
  }

  if (!profile || !allowedRoles.includes(profile.role)) {
    return null;
  }

  const role = profile.role as Role;
  const config = roleConfig[role];
  const isActive = (href: string) => pathname === href;

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f1f5f9] selection:bg-blue-500/10 selection:text-blue-900">
      {/* Mobile sidebar overlay with heavy blur */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-md lg:hidden transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Premium Sidebar with Glassmorphism */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200/60 bg-white/95 backdrop-blur-xl transition-all duration-500 ease-in-out lg:static lg:z-auto shadow-[0_0_40px_rgba(0,0,0,0.02)]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          sidebarCollapsed ? "lg:w-[80px]" : "lg:w-[280px]",
          "w-[280px]"
        )}
      >
        {/* Sidebar Header / Logo */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100/80 px-5">
          <Link href={config.dashboard} className="flex items-center gap-3.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-600/20 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
              <GraduationCap className="h-4.5 w-4.5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col transition-all duration-500">
                <span className="text-base font-black text-slate-800 tracking-tight leading-none">
                  EduPortal
                </span>
                <span className="text-[9px] font-bold text-emerald-600 tracking-widest uppercase mt-0.5">
                  Institution
                </span>
              </div>
            )}
          </Link>
          <button
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden transition-all"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Section with Smooth Scrolling */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar">
          <div className="space-y-8">
            {config.groups.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-2">
                {group.label && !sidebarCollapsed && (
                  <div className="px-3 text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase opacity-80">
                    {group.label}
                  </div>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "group flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-[13px] font-bold transition-all duration-300",
                        isActive(item.href)
                          ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20 translate-x-1"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <span
                        className={cn(
                          "flex-shrink-0 transition-all duration-300",
                          isActive(item.href) ? "text-white scale-110" : "text-slate-400 group-hover:text-blue-500 group-hover:scale-110"
                        )}
                      >
                        {item.icon}
                      </span>
                      {!sidebarCollapsed && (
                        <span className="flex-1 truncate tracking-tight">{item.label}</span>
                      )}
                      {!sidebarCollapsed && isActive(item.href) && (
                         <ChevronRight size={14} className="ml-auto opacity-60" />
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* User Card at Sidebar Bottom */}
        {!sidebarCollapsed && (
          <div className="p-4 mx-4 mb-2 bg-slate-50/50 rounded-2xl border border-slate-100/50 flex items-center gap-3">
             <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 flex items-center justify-center text-xs font-bold text-slate-600 border border-white">
                {profile.full_name?.charAt(0)}
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-slate-800 truncate">{profile.full_name}</p>
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-tighter">{config.label}</p>
             </div>
             <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors">
                <LogOut size={14} />
             </button>
          </div>
        )}

        {/* Desktop Collapse Toggle */}
        <div className="hidden border-t border-slate-100/80 p-3 lg:block">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex w-full items-center justify-center gap-2 rounded-xl p-2.5 text-slate-400 transition-all duration-300 hover:bg-slate-50 hover:text-blue-600 group"
          >
            <ArrowLeftRight
              className={cn(
                "h-4 w-4 transition-transform duration-500 group-hover:scale-110",
                sidebarCollapsed ? "rotate-0" : "rotate-180"
              )}
            />
            {!sidebarCollapsed && <span className="text-[10px] font-bold uppercase tracking-widest">Collapse Menu</span>}
          </button>
        </div>
      </aside>

      {/* Main content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Ultra-Modern Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200/50 bg-white/80 backdrop-blur-md px-6 sticky top-0 z-30 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-4">
            <button
              className="rounded-xl p-2.5 text-slate-500 bg-slate-50 hover:bg-slate-100 hover:text-slate-700 lg:hidden transition-all shadow-sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
               <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-100">
                  <Sparkles size={12} className="text-blue-600 animate-pulse" />
                  <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider">Live System</span>
               </div>
               <h1 className="text-sm font-extrabold text-slate-800 tracking-tight ml-1">
                 {pathname.split('/').pop()?.replace('-', ' ').toUpperCase() || 'Dashboard'}
               </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Bar with spotlight effect style */}
            <div className="relative hidden md:block group">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={14} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
               </div>
               <input 
                 type="text" 
                 placeholder="Search academic data..." 
                 className="w-64 h-10 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all duration-300"
               />
               <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                  <kbd className="text-[9px] font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md shadow-sm">⌘K</kbd>
               </div>
            </div>

            {/* Notification Center */}
            <div className="p-1 rounded-xl hover:bg-slate-50 transition-all">
               <NotificationBell role={role} />
            </div>

            <div className="h-8 w-[1px] bg-slate-200/60 mx-1 hidden md:block" />

            {/* Profile Center */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-3 pl-1.5 pr-3 py-1.5 rounded-2xl transition-all duration-300 hover:bg-slate-50 border border-transparent hover:border-slate-100"
              >
                <div className="relative">
                   <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-700 text-xs font-black text-white shadow-md border-2 border-white">
                     {profile.full_name?.charAt(0) || "U"}
                   </div>
                   <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
                </div>
                <div className="hidden text-left md:block">
                  <p className="text-xs font-extrabold text-slate-800 leading-none">
                    {profile.full_name?.split(' ')[0]}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
                    {config.label}
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    "hidden h-3.5 w-3.5 text-slate-400 transition-transform duration-500 md:block",
                    profileDropdownOpen && "rotate-180"
                  )}
                />
              </button>

              {/* High-End Dropdown menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="px-3 py-3 mb-1 bg-slate-50/50 rounded-xl border border-slate-100">
                    <p className="text-xs font-black text-slate-800">
                      {profile.full_name}
                    </p>
                    <p className="text-[10px] font-medium text-slate-400 truncate">
                      {profile.email}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <Link
                      href={`/${role}/profile`}
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-slate-600 rounded-xl transition-all hover:bg-slate-50 hover:text-blue-600"
                    >
                      <User size={16} />
                      Academic Profile
                    </Link>
                    <Link
                      href={`/${role}/settings`}
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-slate-600 rounded-xl transition-all hover:bg-slate-50 hover:text-blue-600"
                    >
                      <Settings size={16} />
                      System Settings
                    </Link>
                    <div className="h-[1px] bg-slate-100 my-1 mx-2" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-xs font-bold text-red-600 rounded-xl transition-all hover:bg-red-50 hover:text-red-700"
                    >
                      <LogOut size={16} />
                      End Session
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Area with refined spacing and entrance animation */}
        <main className="flex-1 overflow-auto bg-[#f8fafc]/50">
          <div className="p-6 lg:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-700 slide-in-from-bottom-2">
            {children}
          </div>
        </main>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
