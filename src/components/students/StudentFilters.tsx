"use client";

import { Search, Filter, X, SlidersHorizontal } from "lucide-react";

interface ClassOption {
  id: string;
  name: string;
}

interface SectionOption {
  id: string;
  name: string;
  class_id: string;
}

interface StudentFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  classFilter: string;
  onClassChange: (value: string) => void;
  sectionFilter: string;
  onSectionChange: (value: string) => void;
  classes: ClassOption[];
  sections: SectionOption[];
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function StudentFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  classFilter,
  onClassChange,
  sectionFilter,
  onSectionChange,
  classes,
  sections,
  onClearFilters,
  hasActiveFilters,
}: StudentFiltersProps) {
  const filteredSections = classFilter === "all"
    ? sections
    : sections.filter((s) => s.class_id === classFilter);

  const handleClassChange = (value: string) => {
    onClassChange(value);
    onSectionChange("all");
  };

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search by name, student ID, or roll number..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all duration-200"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-slate-500">
            <SlidersHorizontal size={14} />
            <span className="text-xs font-medium">Filters:</span>
          </div>

          {/* Class Filter */}
          <select
            value={classFilter}
            onChange={(e) => handleClassChange(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-sm text-slate-600 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all duration-200 hover:bg-slate-100"
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
            className="h-9 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-sm text-slate-600 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all duration-200 hover:bg-slate-100"
          >
            <option value="all">All Sections</option>
            {filteredSections.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-sm text-slate-600 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all duration-200 hover:bg-slate-100"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="graduated">Graduated</option>
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium text-red-600 transition-all duration-200 hover:bg-red-50 hover:scale-105"
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
