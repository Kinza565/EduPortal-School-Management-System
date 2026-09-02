import { FileText, Calendar, Clock, CheckCircle, XCircle } from "lucide-react";

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

interface ExamStatsProps {
  total: number;
  upcoming: number;
  ongoing: number;
  completed: number;
  cancelled: number;
}

export function ExamStats({ total, upcoming, ongoing, completed, cancelled }: ExamStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard
        title="Total Exams"
        value={total}
        icon={<FileText size={22} />}
        iconColor="text-blue-600"
        iconBg="bg-blue-50"
      />
      <StatCard
        title="Upcoming"
        value={upcoming}
        icon={<Calendar size={22} />}
        iconColor="text-purple-600"
        iconBg="bg-purple-50"
        change="Scheduled"
        changeType="neutral"
      />
      <StatCard
        title="Ongoing"
        value={ongoing}
        icon={<Clock size={22} />}
        iconColor="text-amber-600"
        iconBg="bg-amber-50"
        change="In progress"
        changeType="neutral"
      />
      <StatCard
        title="Completed"
        value={completed}
        icon={<CheckCircle size={22} />}
        iconColor="text-emerald-600"
        iconBg="bg-emerald-50"
        change={`${total > 0 ? Math.round((completed / total) * 100) : 0}% of total`}
        changeType="positive"
      />
      <StatCard
        title="Cancelled"
        value={cancelled}
        icon={<XCircle size={22} />}
        iconColor="text-red-600"
        iconBg="bg-red-50"
        change={cancelled > 0 ? "Needs attention" : "None"}
        changeType={cancelled > 0 ? "negative" : "neutral"}
      />
    </div>
  );
}
