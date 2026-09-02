"use client";

import { useState, useCallback, useEffect } from "react";

interface UsePaginationOptions {
  initialPage?: number;
  pageSize?: number;
  totalRecords?: number;
}

interface UsePaginationReturn {
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setTotalRecords: (total: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  resetPage: () => void;
}

export function usePagination({
  initialPage = 1,
  pageSize = 20,
  totalRecords = 0,
}: UsePaginationOptions = {}): UsePaginationReturn {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [currentPageSize, setPageSize] = useState(pageSize);
  const [currentTotalRecords, setTotalRecords] = useState(totalRecords);

  const totalPages = Math.max(1, Math.ceil(currentTotalRecords / currentPageSize));
  const startIndex = (currentPage - 1) * currentPageSize;
  const endIndex = startIndex + currentPageSize;

  const setPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const previousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const resetPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return {
    currentPage,
    pageSize: currentPageSize,
    totalRecords: currentTotalRecords,
    totalPages,
    startIndex,
    endIndex,
    setPage,
    setPageSize,
    setTotalRecords,
    nextPage,
    previousPage,
    resetPage,
  };
}
