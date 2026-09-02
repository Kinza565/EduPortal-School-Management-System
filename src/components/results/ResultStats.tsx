import { Users, FileCheck, Clock, CheckCircle, XCircle, TrendingUp } from "lucide-react";

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

interface ResultStatsProps {
  totalStudents: number;
  resultsEntered: number;
  pendingResults: number;
  passed: number;
  failed: number;
  averagePercentage: number;
}

export function ResultStats({
  totalStudents,
  resultsEntered,
  pendingResults,
  passed,
  failed,
  averagePercentage,
}: ResultStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard
        title="Total Students"
        value={totalStudents}
        icon={<Users size={22} />}
        iconColor="text-blue-600"
        iconBg="bg-blue-50"
      />
      <StatCard
        title="Results Entered"
        value={resultsEntered}
        icon={<FileCheck size={22} />}
        iconColor="text-purple-600"
        iconBg="bg-purple-50"
        change={totalStudents > 0 ? `${Math.round((resultsEntered / totalStudents) * 100)}%` : "0%"}
        changeType="neutral"
      />
      <StatCard
        title="Pending"
        value={pendingResults}
        icon={<Clock size={22} />}
        iconColor="text-amber-600"
        iconBg="bg-amber-50"
        change={pendingResults > 0 ? "Needs attention" : "All done"}
        changeType={pendingResults > 0 ? "negative" : "positive"}
      />
      <StatCard
        title="Passed"
        value={passed}
        icon={<CheckCircle size={22} />}
        iconColor="text-emerald-600"
        iconBg="bg-emerald-50"
        change={resultsEntered > 0 ? `${Math.round((passed / resultsEntered) * 100)}%` : "0%"}
        changeType="positive"
      />
      <StatCard
        title="Failed"
        value={failed}
        icon={<XCircle size={22} />}
        iconColor="text-red-600"
        iconBg="bg-red-50"
        change={resultsEntered > 0 ? `${Math.round((failed / resultsEntered) * 100)}%` : "0%"}
        changeType={failed > 0 ? "negative" : "neutral"}
      />
      <StatCard
        title="Average"
        value={`${averagePercentage}%`}
        icon={<TrendingUp size={22} />}
        iconColor="text-indigo-600"
        iconBg="bg-indigo-50"
      />
    </div>
  );
}
