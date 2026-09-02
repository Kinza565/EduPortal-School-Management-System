"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/components/ui/card";

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  color?: "blue" | "green" | "amber" | "red" | "indigo";
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

const colorClasses = {
  blue: "bg-blue-500",
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  indigo: "bg-indigo-500",
};

export function ProgressBar({
  value,
  max = 100,
  size = "md",
  color = "blue",
  showLabel = false,
  animated = true,
  className = "",
}: ProgressBarProps) {
  const [width, setWidth] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  const percentage = Math.min((value / max) * 100, 100);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          setIsVisible(true);
          hasAnimated.current = true;
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion || !animated) {
      setWidth(percentage);
      return;
    }

    const timer = setTimeout(() => setWidth(percentage), 100);
    return () => clearTimeout(timer);
  }, [isVisible, percentage, animated]);

  return (
    <div ref={ref} className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-xs font-medium text-slate-600">Progress</span>
          <span className="text-xs font-medium text-slate-600">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div
        className={cn(
          "w-full rounded-full bg-slate-100 overflow-hidden",
          sizeClasses[size]
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000 ease-out",
            colorClasses[color],
            sizeClasses[size]
          )}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
