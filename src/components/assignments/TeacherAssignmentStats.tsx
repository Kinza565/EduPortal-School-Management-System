import { ClipboardList, Users, BookOpen, Layers, Award } from "lucide-react";

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

interface TeacherAssignmentStatsProps {
  total: number;
  activeTeachers: number;
  subjectsAssigned: number;
  classesCovered: number;
  classTeachers: number;
}

export function TeacherAssignmentStats({
  total,
  activeTeachers,
  subjectsAssigned,
  classesCovered,
  classTeachers,
}: TeacherAssignmentStatsProps) {
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
        title="Teachers Assigned"
        value={activeTeachers}
        icon={<Users size={22} />}
        iconColor="text-emerald-600"
        iconBg="bg-emerald-50"
        change="Active teachers"
        changeType="positive"
      />
      <StatCard
        title="Subjects Assigned"
        value={subjectsAssigned}
        icon={<BookOpen size={22} />}
        iconColor="text-purple-600"
        iconBg="bg-purple-50"
        change="Unique subjects"
        changeType="neutral"
      />
      <StatCard
        title="Classes Covered"
        value={classesCovered}
        icon={<Layers size={22} />}
        iconColor="text-amber-600"
        iconBg="bg-amber-50"
        change="Unique classes"
        changeType="neutral"
      />
      <StatCard
        title="Class Teachers"
        value={classTeachers}
        icon={<Award size={22} />}
        iconColor="text-rose-600"
        iconBg="bg-rose-50"
        change="Designated"
        changeType="neutral"
      />
    </div>
  );
}
