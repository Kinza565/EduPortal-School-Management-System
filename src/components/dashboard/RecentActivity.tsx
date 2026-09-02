import { cn } from "@/components/ui/card";
import { UserPlus, UserCheck, ClipboardCheck, DollarSign, FileText } from "lucide-react";

interface Activity {
  id: string;
  icon: typeof UserPlus;
  iconColor: string;
  iconBg: string;
  description: string;
  time: string;
}

const defaultActivities: Activity[] = [
  {
    id: "1",
    icon: UserPlus,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
    description: "New student registered: Ahmed Ali",
    time: "2 hours ago",
  },
  {
    id: "2",
    icon: UserCheck,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
    description: "Teacher added: Sara Khan",
    time: "4 hours ago",
  },
  {
    id: "3",
    icon: ClipboardCheck,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50",
    description: "Attendance marked for Grade 7-A",
    time: "5 hours ago",
  },
  {
    id: "4",
    icon: DollarSign,
    iconColor: "text-purple-600",
    iconBg: "bg-purple-50",
    description: "Fee payment received: Rs. 15,000",
    time: "6 hours ago",
  },
  {
    id: "5",
    icon: FileText,
    iconColor: "text-rose-600",
    iconBg: "bg-rose-50",
    description: "Exam result published: Grade 8",
    time: "1 day ago",
  },
];

interface RecentActivityProps {
  activities?: Activity[];
}

export function RecentActivity({ activities = defaultActivities }: RecentActivityProps) {
  return (
    <div className="space-y-4">
      {activities.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">No recent activity</p>
      ) : (
        <div className="space-y-1">
          {activities.map((activity) => {
            const Icon = activity.icon;
            return (
              <div
                key={activity.id}
                className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-slate-50"
              >
                <div className={cn("rounded-lg p-2", activity.iconBg)}>
                  <Icon className={cn("h-4 w-4", activity.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{activity.description}</p>
                  <p className="text-xs text-slate-400">{activity.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
