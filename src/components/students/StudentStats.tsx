import { GraduationCap, UserCheck, UserX, UserPlus, BookOpen, Layers } from "lucide-react";
import { CountUp } from "@/components/ui/CountUp";

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
}

function StatCard({ title, value, icon, iconColor, iconBg, change, changeType = "neutral" }: StatCardProps) {
  return (
    <div className="group rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
          <p className="mt-1 text-2xl font-bold text-slate-800 count-up">
            <CountUp end={value} />
          </p>
          {change && (
            <p
              className={`mt-1 text-xs font-medium ${
                changeType === "positive"
                  ? "text-emerald-600"
                  : changeType === "negative"
                  ? "text-red-600"
                  : "text-slate-500"
              }`}
            >
              {change}
            </p>
          )}
        </div>
        <div className={`rounded-xl p-3 ${iconBg} transition-transform duration-300 group-hover:scale-110`}>
          <div className={iconColor}>{icon}</div>
        </div>
      </div>
    </div>
  );
}

interface StudentStatsProps {
  total: number;
  active: number;
  inactive: number;
  graduated: number;
  totalClasses: number;
  totalSections: number;
}

export function StudentStats({ total, active, inactive, graduated, totalClasses, totalSections }: StudentStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 stagger-children">
      <StatCard
        title="Total Students"
        value={total}
        icon={<GraduationCap size={22} />}
        iconColor="text-blue-600"
        iconBg="bg-gradient-to-br from-blue-50 to-blue-100"
      />
      <StatCard
        title="Active"
        value={active}
        icon={<UserCheck size={22} />}
        iconColor="text-emerald-600"
        iconBg="bg-gradient-to-br from-emerald-50 to-emerald-100"
        change={`${total > 0 ? Math.round((active / total) * 100) : 0}% of total`}
        changeType="positive"
      />
      <StatCard
        title="Inactive"
        value={inactive}
        icon={<UserX size={22} />}
        iconColor="text-red-600"
        iconBg="bg-gradient-to-br from-red-50 to-red-100"
        change={`${total > 0 ? Math.round((inactive / total) * 100) : 0}% of total`}
        changeType={inactive > 0 ? "negative" : "neutral"}
      />
      <StatCard
        title="Graduated"
        value={graduated}
        icon={<UserPlus size={22} />}
        iconColor="text-purple-600"
        iconBg="bg-gradient-to-br from-purple-50 to-purple-100"
        change={`${total > 0 ? Math.round((graduated / total) * 100) : 0}% of total`}
        changeType="neutral"
      />
      <StatCard
        title="Classes"
        value={totalClasses}
        icon={<BookOpen size={22} />}
        iconColor="text-amber-600"
        iconBg="bg-gradient-to-br from-amber-50 to-amber-100"
      />
      <StatCard
        title="Sections"
        value={totalSections}
        icon={<Layers size={22} />}
        iconColor="text-indigo-600"
        iconBg="bg-gradient-to-br from-indigo-50 to-indigo-100"
      />
    </div>
  );
}
