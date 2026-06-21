"use client";

import React from "react";
import { ChartBarIcon } from "@heroicons/react/24/outline";

interface WelcomeSectionProps {
  userName: string;
  isVisible: boolean;
}

export function WelcomeSection({ userName, isVisible }: WelcomeSectionProps) {
  return (
    <div
      className={`bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 text-white transform transition-all duration-700 shadow-lg ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome, {userName}! 👋</h1>
          <p className="text-lg opacity-90">
            Here&apos;s what&apos;s happening with your MCQ marking system
            today.
          </p>
        </div>
        <div className="hidden md:block">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
            <ChartBarIcon className="h-10 w-10 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
