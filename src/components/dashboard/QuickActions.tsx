import Link from "next/link";
import { cn } from "@/components/ui/card";
import { UserPlus, UserCheck, BookOpen, ClipboardCheck, FileText, Plus } from "lucide-react";

interface QuickAction {
  label: string;
  icon: typeof UserPlus;
  href: string;
  color: string;
  bgColor: string;
  shadowColor: string;
}

const quickActions: QuickAction[] = [
  {
    label: "Register Student",
    icon: UserPlus,
    href: "/admin/students/new",
    color: "text-blue-600",
    bgColor: "bg-blue-50/50 hover:bg-blue-600",
    shadowColor: "shadow-blue-600/10",
  },
  {
    label: "Faculty Intake",
    icon: UserCheck,
    href: "/admin/teachers",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50/50 hover:bg-emerald-600",
    shadowColor: "shadow-emerald-600/10",
  },
  {
    label: "Academic Class",
    icon: BookOpen,
    href: "/admin/classes",
    color: "text-amber-600",
    bgColor: "bg-amber-50/50 hover:bg-amber-600",
    shadowColor: "shadow-amber-600/10",
  },
  {
    label: "Presence Check",
    icon: ClipboardCheck,
    href: "/admin/attendance",
    color: "text-purple-600",
    bgColor: "bg-purple-50/50 hover:bg-purple-600",
    shadowColor: "shadow-purple-600/10",
  },
  {
    label: "Schedule Exam",
    icon: FileText,
    href: "/admin/exams",
    color: "text-rose-600",
    bgColor: "bg-rose-50/50 hover:bg-rose-600",
    shadowColor: "shadow-rose-600/10",
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {quickActions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.label}
            href={action.href}
            className={cn(
              "group flex flex-col items-center justify-center gap-4 rounded-[2rem] p-6 transition-all duration-500 border border-slate-100 hover:border-transparent hover:-translate-y-2 hover:shadow-2xl shadow-sm",
              action.bgColor,
              action.shadowColor
            )}
          >
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 bg-white shadow-sm group-hover:scale-110 group-hover:rotate-6",
              action.color
            )}>
               <Icon size={24} />
            </div>
            <div className="space-y-1 text-center">
               <span className="text-xs font-black text-slate-800 uppercase tracking-widest group-hover:text-white transition-colors">{action.label}</span>
               <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                  <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Initiate</span>
                  <Plus size={10} className="text-white" />
               </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
