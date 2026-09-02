"use client";

import { ResultEntryTable } from "@/components/results";

export default function ResultsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Results & Marks</h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter, manage, and review student examination results.
        </p>
      </div>

      {/* Result Entry */}
      <ResultEntryTable />
    </div>
  );
}
