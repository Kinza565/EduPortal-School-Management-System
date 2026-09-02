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
  receiptNumber: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 4,
  },
  section: {
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
  paymentTable: {
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
  colDate: { width: "20%" },
  colAmount: { width: "15%", textAlign: "right" },
  colMethod: { width: "20%" },
  colReference: { width: "25%" },
  colReceived: { width: "20%" },
  summarySection: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 10,
    color: "#64748b",
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: "bold",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: "#cbd5e1",
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: 12,
    fontWeight: "bold",
  },
  balancePaid: {
    color: "#16a34a",
  },
  balanceDue: {
    color: "#dc2626",
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
    width: "45%",
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
  watermark: {
    position: "absolute",
    top: "40%",
    left: "20%",
    transform: "rotate(-45deg)",
    fontSize: 60,
    color: "rgba(0, 0, 0, 0.03)",
    fontWeight: "bold",
  },
});

interface Payment {
  payment_date: string;
  amount: number;
  payment_method: string;
  reference_number: string | null;
  received_by_name: string | null;
}

interface FeeReceiptPDFProps {
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
    class_name: string;
    section_name: string;
  };
  fee: {
    id: string;
    category_name: string;
    description: string | null;
    amount: number;
    due_date: string;
    status: string;
  };
  payments: Payment[];
  currentPayment: {
    amount: number;
    payment_date: string;
    payment_method: string;
    reference_number: string | null;
    received_by_name: string | null;
  };
  summary: {
    total_fee: number;
    total_paid_before: number;
    current_payment: number;
    total_paid: number;
    balance: number;
  };
}

export function FeeReceiptPDF({
  school,
  student,
  fee,
  payments,
  currentPayment,
  summary,
}: FeeReceiptPDFProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const receiptNumber = `RCP-${fee.id.slice(0, 8).toUpperCase()}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark for paid */}
        {fee.status === "paid" && <Text style={styles.watermark}>PAID</Text>}

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
          <Text style={styles.title}>Fee Receipt</Text>
          <Text style={styles.receiptNumber}>Receipt No: {receiptNumber}</Text>
        </View>

        {/* Student Information */}
        <View style={styles.section}>
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
              <Text style={styles.infoLabel}>Class:</Text>
              <Text style={styles.infoValue}>
                {student.class_name} - {student.section_name}
              </Text>
            </View>
          </View>
        </View>

        {/* Fee Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fee Information</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Category:</Text>
              <Text style={styles.infoValue}>{fee.category_name}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Due Date:</Text>
              <Text style={styles.infoValue}>{formatDate(fee.due_date)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Fee Amount:</Text>
              <Text style={styles.infoValue}>{formatCurrency(fee.amount)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Status:</Text>
              <Text style={styles.infoValue}>{fee.status.toUpperCase()}</Text>
            </View>
          </View>
          {fee.description && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.infoLabel}>Description:</Text>
              <Text style={styles.infoValue}>{fee.description}</Text>
            </View>
          )}
        </View>

        {/* Current Payment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Payment</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Amount Paid:</Text>
              <Text style={styles.infoValue}>{formatCurrency(currentPayment.amount)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Payment Date:</Text>
              <Text style={styles.infoValue}>{formatDate(currentPayment.payment_date)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Payment Method:</Text>
              <Text style={styles.infoValue}>
                {currentPayment.payment_method.replace("_", " ").toUpperCase()}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Reference:</Text>
              <Text style={styles.infoValue}>{currentPayment.reference_number || "-"}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Received By:</Text>
              <Text style={styles.infoValue}>{currentPayment.received_by_name || "-"}</Text>
            </View>
          </View>
        </View>

        {/* Payment History */}
        {payments.length > 0 && (
          <View style={styles.paymentTable}>
            <Text style={styles.sectionTitle}>Payment History</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colDate]}>Date</Text>
              <Text style={[styles.tableHeaderCell, styles.colAmount]}>Amount</Text>
              <Text style={[styles.tableHeaderCell, styles.colMethod]}>Method</Text>
              <Text style={[styles.tableHeaderCell, styles.colReference]}>Reference</Text>
              <Text style={[styles.tableHeaderCell, styles.colReceived]}>Received By</Text>
            </View>
            {payments.map((payment, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.colDate]}>
                  {formatDate(payment.payment_date)}
                </Text>
                <Text style={[styles.tableCell, styles.colAmount]}>
                  {formatCurrency(payment.amount)}
                </Text>
                <Text style={[styles.tableCell, styles.colMethod]}>
                  {payment.payment_method.replace("_", " ").toUpperCase()}
                </Text>
                <Text style={[styles.tableCell, styles.colReference]}>
                  {payment.reference_number || "-"}
                </Text>
                <Text style={[styles.tableCell, styles.colReceived]}>
                  {payment.received_by_name || "-"}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Fee:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.total_fee)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Paid (Before):</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.total_paid_before)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Current Payment:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.current_payment)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Paid:</Text>
            <Text style={styles.totalValue}>{formatCurrency(summary.total_paid)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Remaining Balance:</Text>
            <Text
              style={[
                styles.totalValue,
                summary.balance <= 0 ? styles.balancePaid : styles.balanceDue,
              ]}
            >
              {formatCurrency(summary.balance)}
            </Text>
          </View>
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Received By</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Authorized Signature</Text>
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
