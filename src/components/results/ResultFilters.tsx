"use client";

import { Search, Filter, X } from "lucide-react";
import type { Grade } from "@/types/database";

interface ResultFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  gradeFilter: string;
  onGradeChange: (value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const GRADES: Grade[] = ["A+", "A", "B", "C", "D", "F"];

export function ResultFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  gradeFilter,
  onGradeChange,
  onClearFilters,
  hasActiveFilters,
}: ResultFiltersProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search by student name, ID, or roll number..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <span className="text-xs font-medium text-slate-500">Filters:</span>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All Status</option>
            <option value="pass">Passed</option>
            <option value="fail">Failed</option>
            <option value="pending">Pending</option>
          </select>

          {/* Grade Filter */}
          <select
            value={gradeFilter}
            onChange={(e) => onGradeChange(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All Grades</option>
            {GRADES.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <X size={14} />
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
