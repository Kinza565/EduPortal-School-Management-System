import { Users, UserCheck, UserX, Clock, UserMinus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
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

interface AttendanceStatsProps {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  percentage: number;
}

export function AttendanceStats({ total, present, absent, late, excused, percentage }: AttendanceStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard
        title="Total Students"
        value={total}
        icon={<Users size={22} />}
        iconColor="text-blue-600"
        iconBg="bg-blue-50"
      />
      <StatCard
        title="Present"
        value={present}
        icon={<UserCheck size={22} />}
        iconColor="text-emerald-600"
        iconBg="bg-emerald-50"
        change={total > 0 ? `${Math.round((present / total) * 100)}%` : "0%"}
        changeType="positive"
      />
      <StatCard
        title="Absent"
        value={absent}
        icon={<UserX size={22} />}
        iconColor="text-red-600"
        iconBg="bg-red-50"
        change={total > 0 ? `${Math.round((absent / total) * 100)}%` : "0%"}
        changeType={absent > 0 ? "negative" : "neutral"}
      />
      <StatCard
        title="Late"
        value={late}
        icon={<Clock size={22} />}
        iconColor="text-amber-600"
        iconBg="bg-amber-50"
        change={total > 0 ? `${Math.round((late / total) * 100)}%` : "0%"}
        changeType="neutral"
      />
      <StatCard
        title="Attendance"
        value={`${percentage}%`}
        icon={<UserMinus size={22} />}
        iconColor="text-purple-600"
        iconBg="bg-purple-50"
        change={excused > 0 ? `${excused} excused` : undefined}
        changeType="neutral"
      />
    </div>
  );
}
