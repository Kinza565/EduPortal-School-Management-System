import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { BarChart3 } from "lucide-react";
import type { Class, Section, Student, AttendanceRecord } from "@/types/database";

type StudentYearlyStats = {
  student: Student;
  present: number;
  absent: number;
  late: number;
  excused: number;
  totalDays: number;
  percentage: number;
  monthlyBreakdown: { month: string; percentage: number }[];
};

export default async function AdminYearlyAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; class?: string; section?: string }>;
}) {
  const params = await searchParams;
  const currentDate = new Date();
  const currentYear = params.year || currentDate.getFullYear().toString();
  const selectedClassId = params.class || "";
  const selectedSectionId = params.section || "";

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, school_id")
    .eq("id", session.user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return null;
  }

  const [classesRes, sectionsRes] = await Promise.all([
    supabase
      .from("classes")
      .select("*")
      .eq("school_id", profile.school_id)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("sections")
      .select("*")
      .eq("school_id", profile.school_id)
      .eq("is_active", true)
      .order("name"),
  ]);

  const classes = (classesRes.data || []) as Class[];
  const sections = (sectionsRes.data || []) as Section[];

  const filteredSections = selectedClassId
    ? sections.filter((s) => s.class_id === selectedClassId)
    : sections;

  let studentStats: StudentYearlyStats[] = [];
  let totalSchoolDays = 0;

  if (selectedClassId && selectedSectionId) {
    const startDate = `${currentYear}-01-01`;
    const endDate = `${currentYear}-12-31`;

    const [studentsRes, attendanceRes] = await Promise.all([
      supabase
        .from("students")
        .select("*")
        .eq("class_id", selectedClassId)
        .eq("section_id", selectedSectionId)
        .eq("status", "active")
        .order("roll_number"),
      supabase
        .from("attendance_records")
        .select("*")
        .eq("class_id", selectedClassId)
        .eq("section_id", selectedSectionId)
        .gte("attendance_date", startDate)
        .lte("attendance_date", endDate),
    ]);

    const students = (studentsRes.data || []) as Student[];
    const attendanceRecords = (attendanceRes.data || []) as AttendanceRecord[];

    const uniqueDates = new Set(attendanceRecords.map((r) => r.attendance_date));
    totalSchoolDays = uniqueDates.size;

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    studentStats = students.map((student) => {
      const studentRecords = attendanceRecords.filter((r) => r.student_id === student.id);
      const present = studentRecords.filter((r) => r.status === "present").length;
      const absent = studentRecords.filter((r) => r.status === "absent").length;
      const late = studentRecords.filter((r) => r.status === "late").length;
      const excused = studentRecords.filter((r) => r.status === "excused").length;
      const totalDays = present + absent + late;
      const percentage = totalDays > 0 ? Math.round((present / totalDays) * 100 * 10) / 10 : 0;

      const monthlyBreakdown = months.map((month, index) => {
        const monthStr = (index + 1).toString().padStart(2, "0");
        const monthRecords = studentRecords.filter((r) => r.attendance_date.substring(5, 7) === monthStr);
        const monthPresent = monthRecords.filter((r) => r.status === "present").length;
        const monthTotal = monthRecords.filter((r) => ["present", "absent", "late"].includes(r.status)).length;
        const monthPercentage = monthTotal > 0 ? Math.round((monthPresent / monthTotal) * 100 * 10) / 10 : 0;
        return { month, percentage: monthPercentage };
      });

      return {
        student,
        present,
        absent,
        late,
        excused,
        totalDays,
        percentage,
        monthlyBreakdown,
      };
    });
  }

  const years = Array.from({ length: 5 }, (_, i) => (currentDate.getFullYear() - 2 + i).toString());

  const classAverage = studentStats.length > 0
    ? Math.round((studentStats.reduce((sum, s) => sum + s.percentage, 0) / studentStats.length) * 10) / 10
    : 0;

  const updateFilters = (updates: Record<string, string>) => {
    const url = new URL(window.location.href);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    });
    window.location.href = url.toString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Yearly Attendance Report</h1>
        <p className="text-muted-foreground">
          View yearly attendance summary with monthly breakdown.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 size={20} />
            Select Academic Year and Class
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              updateFilters({
                year: formData.get("year") as string,
                class: formData.get("class") as string,
                section: formData.get("section") as string,
              });
            }}
            className="grid gap-4 md:grid-cols-3"
          >
            <div className="space-y-2">
              <Label htmlFor="year">Academic Year</Label>
              <select
                id="year"
                name="year"
                defaultValue={currentYear}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="class">Class</Label>
              <select
                id="class"
                name="class"
                defaultValue={selectedClassId}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <select
                id="section"
                name="section"
                defaultValue={selectedSectionId}
                disabled={!selectedClassId}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">All Sections</option>
                {filteredSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>{sec.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end md:col-span-3">
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Generate Report
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {selectedClassId && selectedSectionId && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total School Days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSchoolDays}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Yearly Class Average
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{classAverage}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{studentStats.length}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {classes.find((c) => c.id === selectedClassId)?.name} - {sections.find((s) => s.id === selectedSectionId)?.name}
              </CardTitle>
              <CardDescription>
                Year {currentYear} - Yearly Attendance Summary
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {studentStats.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No students found in this section.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                          Roll No.
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                          Student
                        </th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                          Present
                        </th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                          Absent
                        </th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                          Late
                        </th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                          Excused
                        </th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                          Year %
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentStats.map((item) => (
                        <tr key={item.student.id} className="border-b last:border-b-0">
                          <td className="px-4 py-4 font-mono text-xs">
                            {item.student.roll_number || "—"}
                          </td>
                          <td className="px-4 py-4 font-medium">
                            {item.student.full_name}
                          </td>
                          <td className="px-4 py-4 text-center text-green-600 font-medium">
                            {item.present}
                          </td>
                          <td className="px-4 py-4 text-center text-red-600 font-medium">
                            {item.absent}
                          </td>
                          <td className="px-4 py-4 text-center text-yellow-600 font-medium">
                            {item.late}
                          </td>
                          <td className="px-4 py-4 text-center text-blue-600 font-medium">
                            {item.excused}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              item.percentage >= 75
                                ? "bg-green-100 text-green-800"
                                : item.percentage >= 50
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}>
                              {item.percentage}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {studentStats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Monthly Breakdown</CardTitle>
                <CardDescription>
                  Attendance percentage by month for each student
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                          Student
                        </th>
                        <th className="px-2 py-3 text-center font-medium text-muted-foreground">Jan</th>
                        <th className="px-2 py-3 text-center font-medium text-muted-foreground">Feb</th>
                        <th className="px-2 py-3 text-center font-medium text-muted-foreground">Mar</th>
                        <th className="px-2 py-3 text-center font-medium text-muted-foreground">Apr</th>
                        <th className="px-2 py-3 text-center font-medium text-muted-foreground">May</th>
                        <th className="px-2 py-3 text-center font-medium text-muted-foreground">Jun</th>
                        <th className="px-2 py-3 text-center font-medium text-muted-foreground">Jul</th>
                        <th className="px-2 py-3 text-center font-medium text-muted-foreground">Aug</th>
                        <th className="px-2 py-3 text-center font-medium text-muted-foreground">Sep</th>
                        <th className="px-2 py-3 text-center font-medium text-muted-foreground">Oct</th>
                        <th className="px-2 py-3 text-center font-medium text-muted-foreground">Nov</th>
                        <th className="px-2 py-3 text-center font-medium text-muted-foreground">Dec</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentStats.map((item) => (
                        <tr key={item.student.id} className="border-b last:border-b-0">
                          <td className="px-4 py-3 font-medium whitespace-nowrap">
                            {item.student.full_name}
                          </td>
                          {item.monthlyBreakdown.map((month) => (
                            <td key={month.month} className="px-2 py-3 text-center">
                              {month.percentage > 0 ? (
                                <span className={`inline-flex rounded px-1 py-0.5 text-xs ${
                                  month.percentage >= 75
                                    ? "bg-green-100 text-green-800"
                                    : month.percentage >= 50
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}>
                                  {month.percentage}%
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!selectedClassId && !selectedSectionId && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Select a class and section to generate the yearly attendance report.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
