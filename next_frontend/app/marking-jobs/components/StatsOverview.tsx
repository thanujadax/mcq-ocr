import React from "react";
import {
  ClipboardDocumentCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { MarkingJobBasic, MarkingJobStatus } from "../types/types";

interface StatsOverviewProps {
  jobs: MarkingJobBasic[];
}

export function StatsOverview({ jobs }: StatsOverviewProps) {
  const completedJobs = jobs.filter(
    (job) => job.status === MarkingJobStatus.COMPLETED
  );
  const processingJobs = jobs.filter(
    (job) => job.status === MarkingJobStatus.PROCESSING
  );
  const failedJobs = jobs.filter(
    (job) => job.status === MarkingJobStatus.FAILED
  );

  const stats = [
    {
      name: "Total Jobs",
      value: jobs.length.toString(),
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      icon: <ClipboardDocumentCheckIcon className="h-6 w-6" />,
    },
    {
      name: "Completed",
      value: completedJobs.length.toString(),
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      icon: <CheckCircleIcon className="h-6 w-6" />,
    },
    {
      name: "Processing",
      value: processingJobs.length.toString(),
      bgColor: "bg-yellow-50",
      iconColor: "text-yellow-600",
      icon: <ClockIcon className="h-6 w-6" />,
    },
    {
      name: "Failed",
      value: failedJobs.length.toString(),
      bgColor: "bg-red-50",
      iconColor: "text-red-600",
      icon: <ExclamationTriangleIcon className="h-6 w-6" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">
                {stat.name}
              </p>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">
                  {stat.value}
                </p>
              </div>
            </div>
            <div className={`p-3 rounded-full ${stat.bgColor}`}>
              <div className={stat.iconColor}>{stat.icon}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
