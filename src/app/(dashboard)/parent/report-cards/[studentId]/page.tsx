"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loader2, AlertCircle, Printer, ArrowLeft, Download } from "lucide-react";
import Link from "next/link";

interface SubjectResult {
  subject_name: string;
  subject_code: string;
  total_marks: number;
  passing_marks: number;
  obtained_marks: number;
  percentage: number;
  grade: string;
  status: string;
  remarks: string | null;
}

interface ReportCardData {
  student: {
    full_name: string;
    student_id: string;
    roll_number: string | null;
    father_name: string | null;
    guardian_name: string | null;
    class_name: string;
    section_name: string;
  };
  exam: {
    name: string;
    exam_type: string;
    start_date: string;
    end_date: string;
  };
  school: {
    name: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    logo_url: string | null;
  };
  results: SubjectResult[];
  summary: {
    total_subjects: number;
    subjects_passed: number;
    subjects_failed: number;
    total_marks: number;
    obtained_marks: number;
    percentage: number;
    grade: string;
    status: string;
  };
  attendance: {
    available: boolean;
    total_days: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    percentage: number;
  } | null;
}

export default function ParentReportCardViewPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { profile } = useAuth();
  const reportRef = useRef<HTMLDivElement>(null);
  const [studentId, setStudentId] = useState<string>("");
  const [examId, setExamId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [reportData, setReportData] = useState<ReportCardData | null>(null);
  const [exams, setExams] = useState<{ id: string; name: string; exam_type: string }[]>([]);

  useEffect(() => {
    (async () => {
      const { studentId: sid } = await params;
      setStudentId(sid);
    })();
  }, [params]);

  useEffect(() => {
    if (!studentId || !profile?.id) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      setUnauthorized(false);

      try {
        const supabase = createClient();
        const parentId = profile.id;

        // Verify parent has access to this student
        const { data: parentData } = await supabase
          .from("parents")
          .select("id")
          .eq("profile_id", parentId)
          .single();

        if (!parentData) {
          if (!cancelled) {
            setUnauthorized(true);
            setLoading(false);
          }
          return;
        }

        const { data: parentStudentLink } = await supabase
          .from("parent_student")
          .select("id")
          .eq("parent_id", parentData.id)
          .eq("student_id", studentId)
          .single();

        if (!parentStudentLink) {
          if (!cancelled) {
            setUnauthorized(true);
            setLoading(false);
          }
          return;
        }

        // Get student details
        const { data: studentData } = await supabase
          .from("students")
          .select("id, full_name, student_id, roll_number, father_name, guardian_name, class_id, section_id")
          .eq("id", studentId)
          .single();

        if (!studentData) {
          if (!cancelled) {
            setError("Student not found");
            setLoading(false);
          }
          return;
        }

        // Get class and section
        const [classRes, sectionRes] = await Promise.all([
          supabase.from("classes").select("name").eq("id", studentData.class_id).single(),
          supabase.from("sections").select("name").eq("id", studentData.section_id).single(),
        ]);

        // Get available exams for this student
        const { data: resultsData } = await supabase
          .from("results")
          .select("exam_id")
          .eq("student_id", studentId);

        if (cancelled) return;

        const examIds = [...new Set(resultsData?.map((r) => r.exam_id) || [])];

        if (examIds.length === 0) {
          if (!cancelled) {
            setExams([]);
            setLoading(false);
          }
          return;
        }

        const { data: examsData } = await supabase
          .from("exams")
          .select("id, name, exam_type")
          .in("id", examIds)
          .order("start_date", { ascending: false });

        if (cancelled) return;

        setExams(examsData || []);

        // Use first exam if none selected
        const selectedExamId = examId || examsData?.[0]?.id || "";
        if (!examId && examsData?.[0]) {
          setExamId(examsData[0].id);
        }

        if (!selectedExamId) {
          setLoading(false);
          return;
        }

        // Get exam details
        const { data: examData } = await supabase
          .from("exams")
          .select("*")
          .eq("id", selectedExamId)
          .single();

        // Get school
        const { data: schoolData } = await supabase
          .from("schools")
          .select("*")
          .eq("id", profile.school_id)
          .single();

        // Get results
        const { data: studentResults } = await supabase
          .from("results")
          .select("obtained_marks, total_marks, passing_marks, percentage, grade, status, remarks, exam_subject_id")
          .eq("student_id", studentId)
          .eq("exam_id", selectedExamId);

        if (cancelled) return;

        const examSubjectIds = [...new Set(studentResults?.map((r) => r.exam_subject_id) || [])];

        // Get exam subjects first
        const { data: examSubjectsRes } = await supabase
          .from("exam_subjects")
          .select("id, subject_id")
          .in("id", examSubjectIds);

        // Then get subjects
        const subjectIds = [...new Set(examSubjectsRes?.map((es) => es.subject_id) || [])];
        const { data: subjectsRes } = await supabase
          .from("subjects")
          .select("id, name, code")
          .in("id", subjectIds);

        const examSubjectMap = new Map(examSubjectsRes?.map((es) => [es.id, es.subject_id]) || []);
        const subjectMap = new Map(subjectsRes?.map((s) => [s.id, s]) || []);

        const results: SubjectResult[] = studentResults?.map((r) => {
          const subjectId = examSubjectMap.get(r.exam_subject_id);
          const subject = subjectId ? subjectMap.get(subjectId) : null;

          return {
            subject_name: subject?.name || "Unknown",
            subject_code: subject?.code || "",
            total_marks: Number(r.total_marks),
            passing_marks: Number(r.passing_marks),
            obtained_marks: Number(r.obtained_marks),
            percentage: Number(r.percentage),
            grade: r.grade,
            status: r.status,
            remarks: r.remarks,
          };
        }) || [];

        const totalMarks = results.reduce((sum, r) => sum + r.total_marks, 0);
        const obtainedMarks = results.reduce((sum, r) => sum + r.obtained_marks, 0);
        const percentage = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 10000) / 100 : 0;
        const subjectsPassed = results.filter((r) => r.status === "pass").length;
        const subjectsFailed = results.length - subjectsPassed;

        let overallGrade = "A+";
        if (percentage >= 90) overallGrade = "A+";
        else if (percentage >= 80) overallGrade = "A";
        else if (percentage >= 70) overallGrade = "B";
        else if (percentage >= 60) overallGrade = "C";
        else if (percentage >= 50) overallGrade = "D";
        else overallGrade = "F";

        // Get attendance
        const { data: attendanceData } = await supabase
          .from("attendance_records")
          .select("status")
          .eq("student_id", studentId)
          .gte("attendance_date", examData?.start_date)
          .lte("attendance_date", examData?.end_date);

        let attendance: ReportCardData["attendance"] = null;
        if (attendanceData && attendanceData.length > 0) {
          const present = attendanceData.filter((a) => a.status === "present").length;
          const late = attendanceData.filter((a) => a.status === "late").length;
          const absent = attendanceData.filter((a) => a.status === "absent").length;
          const excused = attendanceData.filter((a) => a.status === "excused").length;
          const total = attendanceData.length;
          const attPercentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

          attendance = {
            available: true,
            total_days: total,
            present,
            absent,
            late,
            excused,
            percentage: attPercentage,
          };
        }

        setReportData({
          student: {
            full_name: studentData.full_name,
            student_id: studentData.student_id,
            roll_number: studentData.roll_number,
            father_name: studentData.father_name,
            guardian_name: studentData.guardian_name,
            class_name: classRes.data?.name || "Unknown",
            section_name: sectionRes.data?.name || "Unknown",
          },
          exam: {
            name: examData?.name || "",
            exam_type: examData?.exam_type || "",
            start_date: examData?.start_date || "",
            end_date: examData?.end_date || "",
          },
          school: {
            name: schoolData?.name || "",
            address: schoolData?.address || "",
            city: schoolData?.city || "",
            phone: schoolData?.phone || "",
            email: schoolData?.email || "",
            logo_url: schoolData?.logo_url || null,
          },
          results,
          summary: {
            total_subjects: results.length,
            subjects_passed: subjectsPassed,
            subjects_failed: subjectsFailed,
            total_marks: totalMarks,
            obtained_marks: obtainedMarks,
            percentage,
            grade: overallGrade,
            status: subjectsFailed === 0 ? "pass" : "fail",
          },
          attendance,
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load report card");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [studentId, examId, profile?.id, profile?.school_id]);

  const handlePrint = () => {
    window.print();
  };

  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadPDF = async () => {
    if (!studentId || !examId) return;

    setDownloadingPdf(true);
    try {
      const response = await fetch(
        `/api/pdf/report-card?studentId=${studentId}&examId=${examId}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-card-${studentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to download PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (unauthorized) {
    return (
      <DashboardLayout allowedRoles={["parent"]}>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle size={32} className="mx-auto mb-3 text-red-500" />
          <h3 className="text-lg font-semibold text-red-700">Access Denied</h3>
          <p className="mt-1 text-sm text-red-600">
            You are not authorized to view this report card.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout allowedRoles={["parent"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between print:hidden">
          <div>
            <Link
              href="/parent/report-cards"
              className="mb-2 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft size={16} />
              Back to Report Cards
            </Link>
            <h1 className="text-2xl font-bold text-slate-800">Report Card</h1>
          </div>
          <div className="flex gap-2">
            {exams.length > 1 && (
              <select
                value={examId}
                onChange={(e) => setExamId(e.target.value)}
                className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.name}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPdf}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              <Download size={18} />
              {downloadingPdf ? "Generating..." : "Download PDF"}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <Printer size={18} />
              Print
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 print:hidden">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <span className="ml-3 text-slate-600">Loading report card...</span>
          </div>
        ) : reportData ? (
          <div ref={reportRef} className="print-area">
            <style jsx global>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                .print-area,
                .print-area * {
                  visibility: visible;
                }
                .print-area {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  padding: 20mm;
                }
                .print\\:hidden {
                  display: none !important;
                }
              }
            `}</style>

            <div className="mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm print:border-none print:shadow-none">
              {/* School Header */}
              <div className="border-b-2 border-slate-800 pb-6 text-center">
                {reportData.school.logo_url && (
                  <img
                    src={reportData.school.logo_url}
                    alt="School Logo"
                    className="mx-auto mb-3 h-16 w-16 object-contain"
                  />
                )}
                <h1 className="text-2xl font-bold uppercase tracking-wide text-slate-900">
                  {reportData.school.name}
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  {reportData.school.address}, {reportData.school.city}
                </p>
                <p className="text-sm text-slate-600">
                  Phone: {reportData.school.phone} | Email: {reportData.school.email}
                </p>
              </div>

              {/* Report Card Title */}
              <div className="my-6 text-center">
                <h2 className="text-xl font-bold uppercase tracking-wider text-slate-800">
                  Student Report Card
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-600">
                  {reportData.exam.name} ({reportData.exam.exam_type.replace("_", " ").toUpperCase()})
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(reportData.exam.start_date).toLocaleDateString()} -{" "}
                  {new Date(reportData.exam.end_date).toLocaleDateString()}
                </p>
              </div>

              {/* Student Information */}
              <div className="mb-6 rounded-lg bg-slate-50 p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase text-slate-700">
                  Student Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
                  <div>
                    <span className="text-slate-500">Name:</span>{" "}
                    <span className="font-medium">{reportData.student.full_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Student ID:</span>{" "}
                    <span className="font-medium">{reportData.student.student_id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Roll No:</span>{" "}
                    <span className="font-medium">{reportData.student.roll_number || "-"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Father/Guardian:</span>{" "}
                    <span className="font-medium">
                      {reportData.student.father_name || reportData.student.guardian_name || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Class:</span>{" "}
                    <span className="font-medium">{reportData.student.class_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Section:</span>{" "}
                    <span className="font-medium">{reportData.student.section_name}</span>
                  </div>
                </div>
              </div>

              {/* Subject-wise Results */}
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-semibold uppercase text-slate-700">
                  Academic Performance
                </h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-300 bg-slate-100">
                      <th className="px-3 py-2 text-left">Subject</th>
                      <th className="px-3 py-2 text-center">Total Marks</th>
                      <th className="px-3 py-2 text-center">Passing Marks</th>
                      <th className="px-3 py-2 text-center">Obtained</th>
                      <th className="px-3 py-2 text-center">Percentage</th>
                      <th className="px-3 py-2 text-center">Grade</th>
                      <th className="px-3 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.results.map((result, index) => (
                      <tr key={index} className="border-b border-slate-200">
                        <td className="px-3 py-2">
                          <div>
                            <span className="font-medium">{result.subject_name}</span>
                            {result.subject_code && (
                              <span className="ml-1 text-xs text-slate-500">({result.subject_code})</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">{result.total_marks}</td>
                        <td className="px-3 py-2 text-center">{result.passing_marks}</td>
                        <td className="px-3 py-2 text-center font-medium">{result.obtained_marks}</td>
                        <td className="px-3 py-2 text-center">{result.percentage}%</td>
                        <td className="px-3 py-2 text-center">
                          <span className="inline-flex items-center rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                            {result.grade}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                              result.status === "pass"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {result.status === "pass" ? "PASS" : "FAIL"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="mb-6 rounded-lg bg-slate-50 p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase text-slate-700">Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                  <div>
                    <span className="text-slate-500">Total Subjects:</span>{" "}
                    <span className="font-medium">{reportData.summary.total_subjects}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Passed:</span>{" "}
                    <span className="font-medium text-emerald-600">{reportData.summary.subjects_passed}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Failed:</span>{" "}
                    <span className="font-medium text-red-600">{reportData.summary.subjects_failed}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Total Marks:</span>{" "}
                    <span className="font-medium">{reportData.summary.total_marks}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Obtained Marks:</span>{" "}
                    <span className="font-medium">{reportData.summary.obtained_marks}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Percentage:</span>{" "}
                    <span className="font-medium">{reportData.summary.percentage}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Grade:</span>{" "}
                    <span className="font-medium text-blue-600">{reportData.summary.grade}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Result:</span>{" "}
                    <span
                      className={`font-bold ${
                        reportData.summary.status === "pass" ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {reportData.summary.status === "pass" ? "PASS" : "FAIL"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Attendance Summary */}
              {reportData.attendance?.available && (
                <div className="mb-6 rounded-lg bg-slate-50 p-4">
                  <h3 className="mb-3 text-sm font-semibold uppercase text-slate-700">
                    Attendance Summary (Exam Period)
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-5">
                    <div>
                      <span className="text-slate-500">Total Days:</span>{" "}
                      <span className="font-medium">{reportData.attendance.total_days}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Present:</span>{" "}
                      <span className="font-medium text-emerald-600">{reportData.attendance.present}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Late:</span>{" "}
                      <span className="font-medium text-amber-600">{reportData.attendance.late}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Absent:</span>{" "}
                      <span className="font-medium text-red-600">{reportData.attendance.absent}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Attendance %:</span>{" "}
                      <span className="font-medium">{reportData.attendance.percentage}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="mt-8 border-t border-slate-300 pt-4">
                <div className="flex justify-between text-xs text-slate-500">
                  <div>
                    <p>Date: {new Date().toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="mb-8">Authorized Signature</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <AlertCircle size={48} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-700">No Results Found</h3>
            <p className="mt-1 text-sm text-slate-500">
              No exam results found for this student.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
