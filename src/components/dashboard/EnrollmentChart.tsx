"use client";

interface EnrollmentChartProps {
  data?: { month: string; count: number }[];
}

const defaultData = [
  { month: "Mar", count: 45 },
  { month: "Apr", count: 52 },
  { month: "May", count: 48 },
  { month: "Jun", count: 61 },
  { month: "Jul", count: 55 },
  { month: "Aug", count: 67 },
];

export function EnrollmentChart({ data = defaultData }: EnrollmentChartProps) {
  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <div className="space-y-4">
      <div className="flex h-44 items-end gap-4">
        {data.map((item) => {
          const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
          return (
            <div key={item.month} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">{item.count}</span>
              <div className="relative w-full flex-1 rounded-t-lg bg-slate-100">
                <div
                  className="absolute bottom-0 w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-500"
                  style={{ height: `${height}%` }}
                />
              </div>
              <span className="text-xs font-medium text-slate-500">{item.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
