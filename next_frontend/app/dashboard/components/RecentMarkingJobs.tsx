"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { AnimatedProgressBar } from "./AnimatedProgressBar";

interface MarkingJob {
  id: number;
  name: string;
  status: string;
  template_name: string;
  created_at: string;
  total_answer_sheets?: number;
  processed_answer_sheets?: number;
  failed_answer_sheets?: number;
  progress_percentage: number;
}

interface RecentMarkingJobsProps {
  jobs: MarkingJob[];
  isVisible: boolean;
}

const getStatusConfig = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
      return {
        bg: "bg-green-50",
        icon: CheckCircleIcon,
        iconColor: "text-green-600",
        badgeColor: "bg-green-100 text-green-800",
        progressColor: "bg-green-500",
      };
    case "processing":
      return {
        bg: "bg-blue-50",
        icon: ArrowPathIcon,
        iconColor: "text-blue-600",
        badgeColor: "bg-blue-100 text-blue-800",
        progressColor: "bg-blue-500",
      };
    case "failed":
      return {
        bg: "bg-red-50",
        icon: ExclamationTriangleIcon,
        iconColor: "text-red-600",
        badgeColor: "bg-red-100 text-red-800",
        progressColor: "bg-red-500",
      };
    case "queued":
    default:
      return {
        bg: "bg-amber-50",
        icon: ClockIcon,
        iconColor: "text-amber-600",
        badgeColor: "bg-amber-100 text-amber-800",
        progressColor: "bg-amber-500",
      };
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export function RecentMarkingJobs({ jobs, isVisible }: RecentMarkingJobsProps) {
  const router = useRouter();

  if (jobs.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          Recent Marking Jobs
        </h3>
        <div className="text-center py-12">
          <ClockIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No marking jobs yet</p>
          <p className="text-gray-400 text-sm mt-2">
            Your recent marking jobs will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 p-6 transition-all duration-700 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          Recent Marking Jobs
        </h3>
        <button
          onClick={() => router.push("/marking-jobs")}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline transition-colors"
        >
          View all
        </button>
      </div>

      <div className="space-y-4">
        {jobs.map((job, index) => {
          const statusConfig = getStatusConfig(job.status);
          const IconComponent = statusConfig.icon;

          return (
            <div
              key={job.id}
              onClick={() => router.push("/marking-jobs")}
              className="group p-5 hover:bg-gray-50 rounded-xl transition-all duration-300 border border-gray-100 cursor-pointer hover:shadow-lg hover:border-gray-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${statusConfig.bg} group-hover:scale-110 transition-transform duration-300`}
                  >
                    <IconComponent
                      className={`h-6 w-6 ${statusConfig.iconColor} ${
                        job.status === "processing" ? "animate-spin" : ""
                      }`}
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {job.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Template: {job.template_name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${statusConfig.badgeColor}`}
                  >
                    {job.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-2">
                    {formatDate(job.created_at)}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              {job.total_answer_sheets && job.total_answer_sheets > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Progress: {job.processed_answer_sheets || 0} /{" "}
                      {job.total_answer_sheets}
                    </span>
                    <span className="text-gray-600 font-medium">
                      {job.progress_percentage.toFixed(0)}%
                    </span>
                  </div>
                  <AnimatedProgressBar
                    percentage={job.progress_percentage}
                    color={statusConfig.progressColor}
                    delay={index * 100}
                  />
                  {job.failed_answer_sheets && job.failed_answer_sheets > 0 && (
                    <p className="text-xs text-red-600 font-medium">
                      {job.failed_answer_sheets} failed
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
