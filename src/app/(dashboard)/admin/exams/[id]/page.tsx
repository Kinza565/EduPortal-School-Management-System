"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ExamDetails } from "@/components/exams/ExamDetails";
import { ExamForm } from "@/components/exams/ExamForm";
import { ExamSubjectForm } from "@/components/exams/ExamSubjectForm";

export default function ExamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;

  const [showEditForm, setShowEditForm] = useState(false);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEdit = useCallback(() => {
    setShowEditForm(true);
  }, []);

  const handleManageSubjects = useCallback(() => {
    setShowSubjectForm(true);
  }, []);

  const handleBack = useCallback(() => {
    router.push("/admin/exams");
  }, [router]);

  const handleFormSuccess = useCallback(() => {
    setShowEditForm(false);
    setRefreshKey((k) => k + 1);
  }, []);

  const handleSubjectFormSuccess = useCallback(() => {
    setShowSubjectForm(false);
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="space-y-6">
      <ExamDetails
        key={refreshKey}
        examId={examId}
        onBack={handleBack}
        onEdit={handleEdit}
        onManageSubjects={handleManageSubjects}
      />

      {showEditForm && (
        <ExamForm
          exam={null}
          onClose={() => setShowEditForm(false)}
          onSuccess={handleFormSuccess}
        />
      )}

      {showSubjectForm && (
        <ExamSubjectForm
          examId={examId}
          onClose={() => setShowSubjectForm(false)}
          onSuccess={handleSubjectFormSuccess}
        />
      )}
    </div>
  );
}
