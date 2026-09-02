import { cn } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { CountUp } from "@/components/ui/CountUp";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
}

export function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "text-blue-600",
  iconBgColor = "bg-blue-50",
}: StatCardProps) {
  const numericValue = typeof value === "string" ? parseInt(value.replace(/,/g, ""), 10) || 0 : value;

  return (
    <div className="group relative rounded-[2rem] border border-slate-200/60 bg-white p-6 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.04)] hover:border-slate-300/80 hover:-translate-y-1">
      {/* Dynamic Background Glow on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2rem] pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
           <div className={cn(
            "rounded-2xl p-2.5 transition-all duration-500 group-hover:scale-110 group-hover:shadow-lg shadow-sm",
            iconBgColor
          )}>
            <Icon className={cn("h-5 w-5 transition-colors duration-300", iconColor)} />
          </div>
          {change && (
            <div className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-300",
              changeType === "positive" && "bg-emerald-50 text-emerald-600 border border-emerald-100",
              changeType === "negative" && "bg-red-50 text-red-600 border border-red-100",
              changeType === "neutral" && "bg-slate-50 text-slate-500 border border-slate-100"
            )}>
              {changeType === "positive" && (
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
              )}
              {changeType === "negative" && (
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              )}
              {change}
            </div>
          )}
        </div>
        
        <div className="space-y-0.5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{title}</p>
          <p className="text-3xl font-black text-slate-800 tracking-tight count-up">
            <CountUp end={numericValue} />
          </p>
        </div>

        {/* Progress-style indicator at the very bottom for visual flair */}
        <div className="mt-1 h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
           <div className={cn(
             "h-full rounded-full transition-all duration-1000 delay-300",
             iconColor.replace('text-', 'bg-')
           )} style={{ width: '65%', opacity: 0.4 }} />
        </div>
      </div>
    </div>
  );
}
