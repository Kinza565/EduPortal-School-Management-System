import type { Grade, ResultStatus } from "@/types/database";

export function calculatePercentage(obtainedMarks: number, totalMarks: number): number {
  if (totalMarks <= 0) return 0;
  const percentage = (obtainedMarks / totalMarks) * 100;
  return Math.round(percentage * 100) / 100;
}

export function calculateGrade(percentage: number): Grade {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  return "F";
}

export function calculateStatus(obtainedMarks: number, passingMarks: number): ResultStatus {
  return obtainedMarks >= passingMarks ? "pass" : "fail";
}

export function calculateResult(
  obtainedMarks: number,
  totalMarks: number,
  passingMarks: number
): { percentage: number; grade: Grade; status: ResultStatus } {
  const percentage = calculatePercentage(obtainedMarks, totalMarks);
  const grade = calculateGrade(percentage);
  const status = calculateStatus(obtainedMarks, passingMarks);
  return { percentage, grade, status };
}

export function getGradeColor(grade: Grade): string {
  switch (grade) {
    case "A+":
      return "bg-emerald-100 text-emerald-800 ring-emerald-600/20";
    case "A":
      return "bg-green-100 text-green-800 ring-green-600/20";
    case "B":
      return "bg-blue-100 text-blue-800 ring-blue-600/20";
    case "C":
      return "bg-amber-100 text-amber-800 ring-amber-600/20";
    case "D":
      return "bg-orange-100 text-orange-800 ring-orange-600/20";
    case "F":
      return "bg-red-100 text-red-800 ring-red-600/20";
    default:
      return "bg-slate-100 text-slate-800 ring-slate-600/20";
  }
}

export function getStatusColor(status: ResultStatus): string {
  return status === "pass"
    ? "bg-emerald-100 text-emerald-800 ring-emerald-600/20"
    : "bg-red-100 text-red-800 ring-red-600/20";
}
