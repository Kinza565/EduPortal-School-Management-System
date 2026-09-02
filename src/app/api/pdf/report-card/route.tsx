import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderToStream } from "@react-pdf/renderer";
import { ReportCardPDF } from "@/lib/pdf/ReportCardPDF";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, school_id, role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Get studentId and examId from query params
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const examId = searchParams.get("examId");

    if (!studentId || !examId) {
      return NextResponse.json(
        { error: "studentId and examId are required" },
        { status: 400 }
      );
    }

    // Verify student access
    if (profile.role === "parent") {
      const { data: parentData } = await supabase
        .from("parents")
        .select("id")
        .eq("profile_id", user.id)
        .single();

      if (!parentData) {
        return NextResponse.json({ error: "Parent not found" }, { status: 404 });
      }

      const { data: parentStudent } = await supabase
        .from("parent_student")
        .select("id")
        .eq("parent_id", parentData.id)
        .eq("student_id", studentId)
        .single();

      if (!parentStudent) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Fetch student data
    const { data: studentData } = await supabase
      .from("students")
      .select("id, full_name, student_id, roll_number, father_name, guardian_name, class_id, section_id")
      .eq("id", studentId)
      .eq("school_id", profile.school_id)
      .single();

    if (!studentData) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Fetch exam data
    const { data: examData } = await supabase
      .from("exams")
      .select("*")
      .eq("id", examId)
      .eq("school_id", profile.school_id)
      .single();

    if (!examData) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Fetch school data
    const { data: schoolData } = await supabase
      .from("schools")
      .select("*")
      .eq("id", profile.school_id)
      .single();

    if (!schoolData) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Fetch class and section
    const [classRes, sectionRes] = await Promise.all([
      supabase.from("classes").select("name").eq("id", studentData.class_id).single(),
      supabase.from("sections").select("name").eq("id", studentData.section_id).single(),
    ]);

    // Fetch results
    const { data: resultsData } = await supabase
      .from("results")
      .select("obtained_marks, total_marks, passing_marks, percentage, grade, status, exam_subject_id")
      .eq("student_id", studentId)
      .eq("exam_id", examId);

    // Get exam subjects and subjects
    const examSubjectIds = [...new Set(resultsData?.map((r) => r.exam_subject_id) || [])];

    const { data: examSubjectsRes } = await supabase
      .from("exam_subjects")
      .select("id, subject_id")
      .in("id", examSubjectIds);

    const subjectIds = [...new Set(examSubjectsRes?.map((es) => es.subject_id) || [])];
    const { data: subjectsRes } = await supabase
      .from("subjects")
      .select("id, name, code")
      .in("id", subjectIds);

    const examSubjectMap = new Map(examSubjectsRes?.map((es) => [es.id, es.subject_id]) || []);
    const subjectMap = new Map(subjectsRes?.map((s) => [s.id, s]) || []);

    const results = resultsData?.map((r) => {
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

    // Fetch attendance
    const { data: attendanceData } = await supabase
      .from("attendance_records")
      .select("status")
      .eq("student_id", studentId)
      .gte("attendance_date", examData.start_date)
      .lte("attendance_date", examData.end_date);

    let attendance = null;
    if (attendanceData && attendanceData.length > 0) {
      const present = attendanceData.filter((a) => a.status === "present").length;
      const late = attendanceData.filter((a) => a.status === "late").length;
      const absent = attendanceData.filter((a) => a.status === "absent").length;
      const excused = attendanceData.filter((a) => a.status === "excused").length;
      const total = attendanceData.length;
      const attPercentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

      attendance = {
        total_days: total,
        present,
        absent,
        late,
        excused,
        percentage: attPercentage,
      };
    }

    // Prepare PDF data
    const pdfData = {
      school: {
        name: schoolData.name,
        address: schoolData.address,
        city: schoolData.city,
        phone: schoolData.phone,
        email: schoolData.email,
        logo_url: schoolData.logo_url,
      },
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
        name: examData.name,
        exam_type: examData.exam_type,
        start_date: examData.start_date,
        end_date: examData.end_date,
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
    };

    // Generate PDF outside try/catch to avoid React error boundary issues
    const pdfDocument = (
      <ReportCardPDF
        school={pdfData.school}
        student={pdfData.student}
        exam={pdfData.exam}
        results={pdfData.results}
        summary={pdfData.summary}
        attendance={pdfData.attendance}
      />
    );

    const stream = await renderToStream(pdfDocument);

    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set(
      "Content-Disposition",
      `attachment; filename="report-card-${studentData.student_id}-${examData.name.replace(/\s+/g, "-")}.pdf"`
    );

    return new Response(stream as unknown as ReadableStream, {
      headers,
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
