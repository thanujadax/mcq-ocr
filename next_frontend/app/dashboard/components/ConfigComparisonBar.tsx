"use client";

import React, { useState, useEffect, useRef } from "react";

// Custom hook for intersection observer
const useIntersectionObserver = (options = {}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, options);

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [options]);

  return [elementRef, isVisible] as const;
};

interface ConfigComparisonBarProps {
  completedJobs: number;
  failedJobs: number;
  delay?: number;
}

export function ConfigComparisonBar({
  completedJobs,
  failedJobs,
  delay = 0,
}: ConfigComparisonBarProps) {
  const [completedWidth, setCompletedWidth] = useState(0);
  const [failedWidth, setFailedWidth] = useState(0);
  const [ref, isVisible] = useIntersectionObserver();

  const totalJobs = completedJobs + failedJobs;
  const completedPercentage =
    totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;
  const failedPercentage = totalJobs > 0 ? (failedJobs / totalJobs) * 100 : 0;

  useEffect(() => {
    if (isVisible) {
      setTimeout(() => {
        setCompletedWidth(completedPercentage);
        setFailedWidth(failedPercentage);
      }, delay);
    }
  }, [isVisible, completedPercentage, failedPercentage, delay]);

  return (
    <div ref={ref} className="mt-4">
      <div className="flex justify-between text-sm mb-2">
        <span className="text-green-600 font-medium">
          Completed: {completedJobs}
        </span>
        <span className="text-red-600 font-medium">Failed: {failedJobs}</span>
      </div>
      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-green-500 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${completedWidth}%` }}
        />
        <div
          className="absolute right-0 top-0 h-full bg-red-500 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${failedWidth}%` }}
        />
      </div>
    </div>
  );
}
