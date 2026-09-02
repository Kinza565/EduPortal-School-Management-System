"use client";

import { Search, Filter, X } from "lucide-react";

interface ExamFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  examTypeFilter: string;
  onExamTypeChange: (value: string) => void;
  classFilter: string;
  onClassChange: (value: string) => void;
  sectionFilter: string;
  onSectionChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  classes: { id: string; name: string }[];
  sections: { id: string; name: string }[];
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function ExamFilters({
  searchQuery,
  onSearchChange,
  examTypeFilter,
  onExamTypeChange,
  classFilter,
  onClassChange,
  sectionFilter,
  onSectionChange,
  statusFilter,
  onStatusChange,
  classes,
  sections,
  onClearFilters,
  hasActiveFilters,
}: ExamFiltersProps) {
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
            placeholder="Search by exam name or type..."
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

          {/* Exam Type Filter */}
          <select
            value={examTypeFilter}
            onChange={(e) => onExamTypeChange(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All Types</option>
            <option value="unit_test">Unit Test</option>
            <option value="mid_term">Mid Term</option>
            <option value="final">Final</option>
            <option value="quarterly">Quarterly</option>
            <option value="half_yearly">Half Yearly</option>
            <option value="annual">Annual</option>
            <option value="other">Other</option>
          </select>

          {/* Class Filter */}
          <select
            value={classFilter}
            onChange={(e) => {
              onClassChange(e.target.value);
              onSectionChange("all");
            }}
            className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All Classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>

          {/* Section Filter */}
          <select
            value={sectionFilter}
            onChange={(e) => onSectionChange(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All Sections</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
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
