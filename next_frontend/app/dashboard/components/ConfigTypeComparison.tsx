"use client";

import React from "react";
import { ChartBarIcon } from "@heroicons/react/24/outline";
import { ConfigComparisonBar } from "./ConfigComparisonBar";

interface ConfigComparison {
  config_type: string;
  template_count: number;
  marking_job_count: number;
  completion_rate: number;
  avg_completion_time_seconds: number | null;
  completed_jobs: number;
  failed_jobs: number;
}

interface ConfigTypeComparisonProps {
  comparisons: ConfigComparison[];
  isVisible: boolean;
}

const formatTime = (seconds: number | null) => {
  if (!seconds) return "N/A";
  if (seconds < 60) return `${seconds.toFixed(2)}s`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(2)}m`;
  return `${(seconds / 3600).toFixed(2)}h`;
};

export function ConfigTypeComparison({
  comparisons,
  isVisible,
}: ConfigTypeComparisonProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 p-6 transition-all duration-700 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <div className="flex items-center mb-6">
        <ChartBarIcon className="h-6 w-6 text-blue-600 mr-3" />
        <h3 className="text-xl font-semibold text-gray-900">
          Config Type Comparison
        </h3>
      </div>

      <div className="space-y-6">
        {comparisons.map((config, index) => (
          <div
            key={index}
            className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0"
          >
            <div className="flex items-center justify-between mb-4">
              <h4
                className={`text-lg font-bold ${
                  config.config_type === "grid_based"
                    ? "text-purple-600"
                    : "text-orange-600"
                }`}
              >
                {config.config_type.replace("_", " ").toUpperCase()}
              </h4>
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  config.config_type === "grid_based"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-orange-100 text-orange-800"
                }`}
              >
                {config.marking_job_count} jobs
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 font-medium">Templates</span>
                  <span className="text-gray-900 font-bold text-lg">
                    {config.template_count}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 font-medium">Jobs</span>
                  <span className="text-gray-900 font-bold text-lg">
                    {config.marking_job_count}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-green-700 font-medium">
                    Success Rate
                  </span>
                  <span className="text-green-800 font-bold text-lg">
                    {config.completion_rate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-blue-700 font-medium">Avg Time</span>
                  <span className="text-blue-800 font-bold text-lg">
                    {formatTime(config.avg_completion_time_seconds)}
                  </span>
                </div>
              </div>
            </div>

            {/* Visual comparison bar */}
            <ConfigComparisonBar
              completedJobs={config.completed_jobs}
              failedJobs={config.failed_jobs}
              delay={index * 200}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
