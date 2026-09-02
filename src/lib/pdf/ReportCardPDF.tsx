import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1e293b",
  },
  header: {
    borderBottom: 2,
    borderBottomColor: "#1e293b",
    paddingBottom: 16,
    marginBottom: 20,
    alignItems: "center",
  },
  schoolHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 12,
    objectFit: "contain",
  },
  schoolName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    textTransform: "uppercase",
  },
  schoolInfo: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 2,
  },
  titleSection: {
    alignItems: "center",
    marginVertical: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  examInfo: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 4,
  },
  studentInfo: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 8,
    color: "#334155",
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  infoItem: {
    width: "50%",
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 8,
    color: "#64748b",
  },
  infoValue: {
    fontSize: 10,
    fontWeight: "bold",
  },
  resultsTable: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 2,
    borderBottomColor: "#cbd5e1",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  tableHeaderCell: {
    fontWeight: "bold",
    fontSize: 9,
    textTransform: "uppercase",
    color: "#475569",
  },
  tableCell: {
    fontSize: 9,
  },
  colSubject: { width: "28%" },
  colTotal: { width: "12%", textAlign: "center" },
  colPassing: { width: "12%", textAlign: "center" },
  colObtained: { width: "12%", textAlign: "center" },
  colPercentage: { width: "12%", textAlign: "center" },
  colGrade: { width: "12%", textAlign: "center" },
  colStatus: { width: "12%", textAlign: "center" },
  summarySection: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  summaryItem: {
    width: "50%",
    marginBottom: 4,
  },
  passStatus: {
    color: "#16a34a",
    fontWeight: "bold",
  },
  failStatus: {
    color: "#dc2626",
    fontWeight: "bold",
  },
  attendanceSection: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  signatureSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 40,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  signatureBox: {
    width: "30%",
    alignItems: "center",
  },
  signatureLine: {
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#94a3b8",
    marginBottom: 4,
    height: 30,
  },
  signatureLabel: {
    fontSize: 9,
    color: "#64748b",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#94a3b8",
  },
});

interface SubjectResult {
  subject_name: string;
  subject_code: string;
  total_marks: number;
  passing_marks: number;
  obtained_marks: number;
  percentage: number;
  grade: string;
  status: string;
}

interface ReportCardPDFProps {
  school: {
    name: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    logo_url: string | null;
  };
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
    total_days: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    percentage: number;
  } | null;
}

export function ReportCardPDF({ school, student, exam, results, summary, attendance }: ReportCardPDFProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* School Header */}
        <View style={styles.header}>
          <View style={styles.schoolHeader}>
            {school.logo_url && <Image src={school.logo_url} style={styles.logo} />}
            <View>
              <Text style={styles.schoolName}>{school.name}</Text>
              <Text style={styles.schoolInfo}>
                {school.address}, {school.city}
              </Text>
              <Text style={styles.schoolInfo}>
                Phone: {school.phone} | Email: {school.email}
              </Text>
            </View>
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Student Report Card</Text>
          <Text style={styles.examInfo}>
            {exam.name} ({exam.exam_type.replace("_", " ").toUpperCase()})
          </Text>
          <Text style={styles.examInfo}>
            {formatDate(exam.start_date)} - {formatDate(exam.end_date)}
          </Text>
        </View>

        {/* Student Information */}
        <View style={styles.studentInfo}>
          <Text style={styles.sectionTitle}>Student Information</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{student.full_name}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Student ID:</Text>
              <Text style={styles.infoValue}>{student.student_id}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Roll No:</Text>
              <Text style={styles.infoValue}>{student.roll_number || "-"}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Father/Guardian:</Text>
              <Text style={styles.infoValue}>
                {student.father_name || student.guardian_name || "-"}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Class:</Text>
              <Text style={styles.infoValue}>{student.class_name}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Section:</Text>
              <Text style={styles.infoValue}>{student.section_name}</Text>
            </View>
          </View>
        </View>

        {/* Results Table */}
        <View style={styles.resultsTable}>
          <Text style={styles.sectionTitle}>Academic Performance</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colSubject]}>Subject</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
            <Text style={[styles.tableHeaderCell, styles.colPassing]}>Passing</Text>
            <Text style={[styles.tableHeaderCell, styles.colObtained]}>Obtained</Text>
            <Text style={[styles.tableHeaderCell, styles.colPercentage]}>%</Text>
            <Text style={[styles.tableHeaderCell, styles.colGrade]}>Grade</Text>
            <Text style={[styles.tableHeaderCell, styles.colStatus]}>Status</Text>
          </View>
          {results.map((result, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colSubject]}>
                {result.subject_name}
                {result.subject_code ? ` (${result.subject_code})` : ""}
              </Text>
              <Text style={[styles.tableCell, styles.colTotal]}>{result.total_marks}</Text>
              <Text style={[styles.tableCell, styles.colPassing]}>{result.passing_marks}</Text>
              <Text style={[styles.tableCell, styles.colObtained]}>{result.obtained_marks}</Text>
              <Text style={[styles.tableCell, styles.colPercentage]}>{result.percentage}%</Text>
              <Text style={[styles.tableCell, styles.colGrade]}>{result.grade}</Text>
              <Text
                style={[
                  styles.tableCell,
                  styles.colStatus,
                  result.status === "pass" ? styles.passStatus : styles.failStatus,
                ]}
              >
                {result.status === "pass" ? "PASS" : "FAIL"}
              </Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.infoLabel}>Total Subjects:</Text>
              <Text style={styles.infoValue}>{summary.total_subjects}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.infoLabel}>Passed:</Text>
              <Text style={[styles.infoValue, styles.passStatus]}>{summary.subjects_passed}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.infoLabel}>Failed:</Text>
              <Text style={[styles.infoValue, styles.failStatus]}>{summary.subjects_failed}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.infoLabel}>Total Marks:</Text>
              <Text style={styles.infoValue}>{summary.total_marks}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.infoLabel}>Obtained Marks:</Text>
              <Text style={styles.infoValue}>{summary.obtained_marks}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.infoLabel}>Percentage:</Text>
              <Text style={styles.infoValue}>{summary.percentage}%</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.infoLabel}>Grade:</Text>
              <Text style={styles.infoValue}>{summary.grade}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.infoLabel}>Result:</Text>
              <Text
                style={[
                  styles.infoValue,
                  summary.status === "pass" ? styles.passStatus : styles.failStatus,
                ]}
              >
                {summary.status === "pass" ? "PASS" : "FAIL"}
              </Text>
            </View>
          </View>
        </View>

        {/* Attendance */}
        {attendance && (
          <View style={styles.attendanceSection}>
            <Text style={styles.sectionTitle}>Attendance Summary (Exam Period)</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.infoLabel}>Total Days:</Text>
                <Text style={styles.infoValue}>{attendance.total_days}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.infoLabel}>Present:</Text>
                <Text style={styles.infoValue}>{attendance.present}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.infoLabel}>Late:</Text>
                <Text style={styles.infoValue}>{attendance.late}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.infoLabel}>Absent:</Text>
                <Text style={styles.infoValue}>{attendance.absent}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.infoLabel}>Attendance %:</Text>
                <Text style={styles.infoValue}>{attendance.percentage}%</Text>
              </View>
            </View>
          </View>
        )}

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Class Teacher</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Principal</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>School Stamp</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Generated on {new Date().toLocaleDateString()}</Text>
          <Text>EduPortal School Management System</Text>
        </View>
      </Page>
    </Document>
  );
}
