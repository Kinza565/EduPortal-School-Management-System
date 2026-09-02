import { ClipboardList, ClipboardCheck, Clock, AlertTriangle, Calendar } from "lucide-react";

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
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
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
        <div className={`rounded-xl p-3 ${iconBg}`}>
          <div className={iconColor}>{icon}</div>
        </div>
      </div>
    </div>
  );
}

interface AssignmentStatsProps {
  total: number;
  active: number;
  upcoming: number;
  dueToday: number;
  overdue: number;
}

export function AssignmentStats({ total, active, upcoming, dueToday, overdue }: AssignmentStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard
        title="Total Assignments"
        value={total}
        icon={<ClipboardList size={22} />}
        iconColor="text-blue-600"
        iconBg="bg-blue-50"
      />
      <StatCard
        title="Active"
        value={active}
        icon={<ClipboardCheck size={22} />}
        iconColor="text-emerald-600"
        iconBg="bg-emerald-50"
        change={`${total > 0 ? Math.round((active / total) * 100) : 0}% of total`}
        changeType="positive"
      />
      <StatCard
        title="Upcoming"
        value={upcoming}
        icon={<Calendar size={22} />}
        iconColor="text-purple-600"
        iconBg="bg-purple-50"
        change="Future due dates"
        changeType="neutral"
      />
      <StatCard
        title="Due Today"
        value={dueToday}
        icon={<Clock size={22} />}
        iconColor="text-amber-600"
        iconBg="bg-amber-50"
        change="Due now"
        changeType="neutral"
      />
      <StatCard
        title="Overdue"
        value={overdue}
        icon={<AlertTriangle size={22} />}
        iconColor="text-red-600"
        iconBg="bg-red-50"
        change={overdue > 0 ? "Needs attention" : "All clear"}
        changeType={overdue > 0 ? "negative" : "neutral"}
      />
    </div>
  );
}
