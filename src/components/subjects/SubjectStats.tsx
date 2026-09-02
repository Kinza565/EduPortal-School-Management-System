import { BookOpen, BookCheck, BookX, BookMarked, BookPlus } from "lucide-react";

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

interface SubjectStatsProps {
  total: number;
  active: number;
  inactive: number;
  assigned: number;
  unassigned: number;
}

export function SubjectStats({ total, active, inactive, assigned, unassigned }: SubjectStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard
        title="Total Subjects"
        value={total}
        icon={<BookOpen size={22} />}
        iconColor="text-blue-600"
        iconBg="bg-blue-50"
      />
      <StatCard
        title="Active Subjects"
        value={active}
        icon={<BookCheck size={22} />}
        iconColor="text-emerald-600"
        iconBg="bg-emerald-50"
        change={`${total > 0 ? Math.round((active / total) * 100) : 0}% of total`}
        changeType="positive"
      />
      <StatCard
        title="Inactive Subjects"
        value={inactive}
        icon={<BookX size={22} />}
        iconColor="text-red-600"
        iconBg="bg-red-50"
        change={`${total > 0 ? Math.round((inactive / total) * 100) : 0}% of total`}
        changeType={inactive > 0 ? "negative" : "neutral"}
      />
      <StatCard
        title="Assigned"
        value={assigned}
        icon={<BookMarked size={22} />}
        iconColor="text-amber-600"
        iconBg="bg-amber-50"
        change="Has teachers"
        changeType="neutral"
      />
      <StatCard
        title="Unassigned"
        value={unassigned}
        icon={<BookPlus size={22} />}
        iconColor="text-slate-600"
        iconBg="bg-slate-50"
        change="No teachers"
        changeType="neutral"
      />
    </div>
  );
}
