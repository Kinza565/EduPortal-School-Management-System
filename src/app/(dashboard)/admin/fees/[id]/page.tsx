"use client";

import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { FeeDetails } from "@/components/fees/FeeDetails";

export default function FeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const feeId = params.id as string;

  const handleBack = () => {
    router.push("/admin/fees");
  };

  const handleRecordPayment = () => {
    // Payment is handled within FeeDetails component
  };

  return (
    <FeeDetails
      feeId={feeId}
      onBack={handleBack}
      onRecordPayment={handleRecordPayment}
      schoolId={profile?.school_id || ""}
    />
  );
}
