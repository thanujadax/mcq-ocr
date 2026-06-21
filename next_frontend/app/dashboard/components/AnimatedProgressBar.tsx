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

interface AnimatedProgressBarProps {
  percentage: number;
  color: string;
  delay?: number;
}

export function AnimatedProgressBar({
  percentage,
  color,
  delay = 0,
}: AnimatedProgressBarProps) {
  const [width, setWidth] = useState(0);
  const [ref, isVisible] = useIntersectionObserver();

  useEffect(() => {
    if (isVisible) {
      setTimeout(() => {
        setWidth(percentage);
      }, delay);
    }
  }, [isVisible, percentage, delay]);

  return (
    <div
      ref={ref}
      className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden"
    >
      <div
        className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${color}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
