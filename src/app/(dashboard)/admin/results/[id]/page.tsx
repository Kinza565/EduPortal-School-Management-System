"use client";

import { useParams, useRouter } from "next/navigation";
import { ResultDetails } from "@/components/results";

export default function ResultDetailPage() {
  const params = useParams();
  const router = useRouter();
  const resultId = params.id as string;

  const handleBack = () => {
    router.push("/admin/results");
  };

  return <ResultDetails resultId={resultId} onBack={handleBack} />;
}
