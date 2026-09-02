"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  totalRecords,
  pageSize,
  onPageChange,
  isLoading = false,
}: PaginationProps) {
  const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  const canGoPrevious = currentPage > 1 && !isLoading;
  const canGoNext = currentPage < totalPages && !isLoading;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      pages.push(totalPages);
    }

    return pages;
  };

  if (totalPages <= 1 && !isLoading) {
    return (
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 bg-slate-50/50">
        <p className="text-sm text-slate-500">
          Showing <span className="font-semibold text-slate-700">{totalRecords}</span>{" "}
          {totalRecords === 1 ? "record" : "records"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50">
      <p className="text-sm text-slate-500">
        Showing <span className="font-semibold text-slate-700">{startRecord}</span> to{" "}
        <span className="font-semibold text-slate-700">{endRecord}</span> of{" "}
        <span className="font-semibold text-slate-700">{totalRecords}</span> records
      </p>
      <nav className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={!canGoPrevious}
          className="rounded-xl p-2 text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent hover:scale-105"
          aria-label="First page"
        >
          <ChevronsLeft size={18} />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrevious}
          className="rounded-xl p-2 text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent hover:scale-105"
          aria-label="Previous page"
        >
          <ChevronLeft size={18} />
        </button>
        {getPageNumbers().map((page, index) =>
          page === "..." ? (
            <span
              key={`ellipsis-${index}`}
              className="px-2 py-1 text-sm text-slate-400"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              disabled={isLoading}
              className={`min-w-[36px] rounded-xl px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                page === currentPage
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:scale-105"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {page}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          className="rounded-xl p-2 text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent hover:scale-105"
          aria-label="Next page"
        >
          <ChevronRight size={18} />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={!canGoNext}
          className="rounded-xl p-2 text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent hover:scale-105"
          aria-label="Last page"
        >
          <ChevronsRight size={18} />
        </button>
      </nav>
    </div>
  );
}
