import { DollarSign, CheckCircle, Clock, AlertTriangle, TrendingUp } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
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

interface FeeStatsProps {
  totalFees: number;
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
  outstandingBalance: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function FeeStats({
  totalFees,
  totalCollected,
  totalPending,
  totalOverdue,
  outstandingBalance,
}: FeeStatsProps) {
  const collectionRate = totalFees > 0 ? Math.round((totalCollected / totalFees) * 100) : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard
        title="Total Fees"
        value={formatCurrency(totalFees)}
        icon={<DollarSign size={22} />}
        iconColor="text-blue-600"
        iconBg="bg-blue-50"
      />
      <StatCard
        title="Collected"
        value={formatCurrency(totalCollected)}
        icon={<CheckCircle size={22} />}
        iconColor="text-emerald-600"
        iconBg="bg-emerald-50"
        change={`${collectionRate}% collected`}
        changeType="positive"
      />
      <StatCard
        title="Pending"
        value={formatCurrency(totalPending)}
        icon={<Clock size={22} />}
        iconColor="text-amber-600"
        iconBg="bg-amber-50"
      />
      <StatCard
        title="Overdue"
        value={formatCurrency(totalOverdue)}
        icon={<AlertTriangle size={22} />}
        iconColor="text-red-600"
        iconBg="bg-red-50"
        change={totalOverdue > 0 ? "Needs attention" : "None"}
        changeType={totalOverdue > 0 ? "negative" : "neutral"}
      />
      <StatCard
        title="Outstanding"
        value={formatCurrency(outstandingBalance)}
        icon={<TrendingUp size={22} />}
        iconColor="text-purple-600"
        iconBg="bg-purple-50"
      />
    </div>
  );
}
