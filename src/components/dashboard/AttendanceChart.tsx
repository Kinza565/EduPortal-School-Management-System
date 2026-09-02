"use client";

import { cn } from "@/components/ui/card";

interface AttendanceChartProps {
  present: number;
  absent: number;
  late: number;
  excused: number;
}

export function AttendanceChart({ present, absent, late, excused }: AttendanceChartProps) {
  const total = present + absent + late + excused;

  if (total === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-slate-400">
        No attendance data for today
      </div>
    );
  }

  const data = [
    { label: "Present", value: present, color: "bg-emerald-500", textColor: "text-emerald-600" },
    { label: "Absent", value: absent, color: "bg-red-500", textColor: "text-red-600" },
    { label: "Late", value: late, color: "bg-amber-500", textColor: "text-amber-600" },
    { label: "Excused", value: excused, color: "bg-blue-500", textColor: "text-blue-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Bar chart */}
      <div className="flex h-40 items-end gap-3">
        {data.map((item) => {
          const height = total > 0 ? (item.value / total) * 100 : 0;
          return (
            <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-sm font-semibold text-slate-700">{item.value}</span>
              <div className="relative w-full flex-1 rounded-t-lg bg-slate-100">
                <div
                  className={cn("absolute bottom-0 w-full rounded-t-lg transition-all duration-500", item.color)}
                  style={{ height: `${height}%` }}
                />
              </div>
              <span className="text-xs font-medium text-slate-500">{item.label}</span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4">
        {data.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={cn("h-3 w-3 rounded-full", item.color)} />
            <span className="text-sm text-slate-600">
              {item.label}: <span className={cn("font-semibold", item.textColor)}>{item.value}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
