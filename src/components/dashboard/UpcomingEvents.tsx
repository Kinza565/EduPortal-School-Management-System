import { cn } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  type: "exam" | "meeting" | "holiday" | "event";
  typeColor: string;
}

const defaultEvents: Event[] = [
  {
    id: "1",
    title: "Mid-Term Exams",
    date: "Sep 15, 2026",
    time: "09:00 AM",
    type: "exam",
    typeColor: "bg-red-100 text-red-700",
  },
  {
    id: "2",
    title: "Parent-Teacher Meeting",
    date: "Sep 20, 2026",
    time: "10:00 AM",
    type: "meeting",
    typeColor: "bg-blue-100 text-blue-700",
  },
  {
    id: "3",
    title: "Independence Day",
    date: "Sep 23, 2026",
    time: "All Day",
    type: "holiday",
    typeColor: "bg-emerald-100 text-emerald-700",
  },
  {
    id: "4",
    title: "Annual Sports Day",
    date: "Oct 05, 2026",
    time: "08:00 AM",
    type: "event",
    typeColor: "bg-amber-100 text-amber-700",
  },
];

interface UpcomingEventsProps {
  events?: Event[];
}

export function UpcomingEvents({ events = defaultEvents }: UpcomingEventsProps) {
  return (
    <div className="space-y-3">
      {events.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">No upcoming events</p>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-4 rounded-lg border border-slate-100 p-3 transition-colors hover:bg-slate-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                <CalendarDays className="h-5 w-5 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700">{event.title}</p>
                <p className="text-xs text-slate-400">{event.date} &bull; {event.time}</p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                  event.typeColor
                )}
              >
                {event.type}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
