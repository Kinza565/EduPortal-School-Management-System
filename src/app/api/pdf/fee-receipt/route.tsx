import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderToStream } from "@react-pdf/renderer";
import { FeeReceiptPDF } from "@/lib/pdf/FeeReceiptPDF";

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

    // Get feeId from query params
    const { searchParams } = new URL(request.url);
    const feeId = searchParams.get("feeId");
    const paymentId = searchParams.get("paymentId");

    if (!feeId) {
      return NextResponse.json({ error: "feeId is required" }, { status: 400 });
    }

    // Fetch fee data
    const { data: feeData } = await supabase
      .from("student_fees")
      .select(
        `
        *,
        students(*),
        fee_categories(*),
        classes(*),
        sections(*)
      `
      )
      .eq("id", feeId)
      .eq("school_id", profile.school_id)
      .single();

    if (!feeData) {
      return NextResponse.json({ error: "Fee record not found" }, { status: 404 });
    }

    // Verify parent access
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
        .eq("student_id", feeData.student_id)
        .single();

      if (!parentStudent) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
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

    // Fetch all payments for this fee
    const { data: allPayments } = await supabase
      .from("fee_payments")
      .select(
        `
        *,
        received_by_profile:profiles(full_name)
      `
      )
      .eq("student_fee_id", feeId)
      .order("payment_date", { ascending: true });

    // Get current payment (specified or latest)
    let currentPaymentData = null;
    if (paymentId) {
      currentPaymentData = allPayments?.find((p) => p.id === paymentId) || null;
    }
    if (!currentPaymentData && allPayments && allPayments.length > 0) {
      currentPaymentData = allPayments[allPayments.length - 1];
    }

    if (!currentPaymentData) {
      return NextResponse.json({ error: "No payment found" }, { status: 404 });
    }

    // Calculate totals
    const totalPaid = (allPayments || []).reduce((sum, p) => sum + Number(p.amount), 0);
    const totalPaidBefore = totalPaid - Number(currentPaymentData.amount);
    const balance = Number(feeData.amount) - totalPaid;

    // Format payments for history (excluding current)
    const paymentHistory = (allPayments || [])
      .filter((p) => p.id !== currentPaymentData.id)
      .map((p) => ({
        payment_date: p.payment_date,
        amount: Number(p.amount),
        payment_method: p.payment_method,
        reference_number: p.reference_number,
        received_by_name: p.received_by_profile?.full_name || null,
      }));

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
        full_name: feeData.students?.full_name || "",
        student_id: feeData.students?.student_id || "",
        roll_number: feeData.students?.roll_number || null,
        class_name: feeData.classes?.name || "Unknown",
        section_name: feeData.sections?.name || "Unknown",
      },
      fee: {
        id: feeData.id,
        category_name: feeData.fee_categories?.name || "Unknown",
        description: feeData.description,
        amount: Number(feeData.amount),
        due_date: feeData.due_date,
        status: feeData.status,
      },
      payments: paymentHistory,
      currentPayment: {
        amount: Number(currentPaymentData.amount),
        payment_date: currentPaymentData.payment_date,
        payment_method: currentPaymentData.payment_method,
        reference_number: currentPaymentData.reference_number,
        received_by_name: currentPaymentData.received_by_profile?.full_name || null,
      },
      summary: {
        total_fee: Number(feeData.amount),
        total_paid_before: totalPaidBefore,
        current_payment: Number(currentPaymentData.amount),
        total_paid: totalPaid,
        balance: balance,
      },
    };

    // Generate PDF outside try/catch to avoid React error boundary issues
    const pdfDocument = (
      <FeeReceiptPDF
        school={pdfData.school}
        student={pdfData.student}
        fee={pdfData.fee}
        payments={pdfData.payments}
        currentPayment={pdfData.currentPayment}
        summary={pdfData.summary}
      />
    );

    const stream = await renderToStream(pdfDocument);

    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set(
      "Content-Disposition",
      `attachment; filename="fee-receipt-${feeData.id.slice(0, 8)}.pdf"`
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
