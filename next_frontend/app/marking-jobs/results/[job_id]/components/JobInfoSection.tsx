import React from "react";
import {
  CalendarIcon,
  FlagIcon,
  ChartBarIcon,
  ClockIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { StatusBadge } from "@/app/marking-jobs/components/StatusBadge";
import { JobInfo, MarkingJobStatus } from "@/app/marking-jobs/types/types";

interface JobInfoSectionProps {
  jobInfo: JobInfo;
}

export function JobInfoSection({ jobInfo }: JobInfoSectionProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getProcessingDuration = () => {
    if (jobInfo.processing_started_at && jobInfo.processing_completed_at) {
      const start = new Date(jobInfo.processing_started_at);
      const end = new Date(jobInfo.processing_completed_at);
      const duration = Math.round((end.getTime() - start.getTime()) / 1000);
      return `${duration}s`;
    }
    return "N/A";
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Job Information
            </h2>
            <p className="text-sm text-gray-600">
              Processing details and statistics
            </p>
          </div>
        </div>
        <StatusBadge status={jobInfo.status as MarkingJobStatus} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Basic Info */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-blue-500 p-2 rounded-xl">
              <DocumentTextIcon className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">
              Basic Information
            </h3>
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500">Job Name:</span>
              <p className="text-sm font-medium text-gray-900">
                {jobInfo.name}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Template:</span>
              <p className="text-sm font-medium text-gray-900">
                {jobInfo.template_name}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Priority:</span>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium ml-2 border ${
                  jobInfo.priority === "high"
                    ? "bg-red-100 text-red-800 border-red-200"
                    : jobInfo.priority === "medium"
                    ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                    : "bg-green-100 text-green-800 border-green-200"
                }`}
              >
                <FlagIcon className="h-3 w-3 mr-1" />
                {jobInfo.priority}
              </span>
            </div>
          </div>
        </div>

        {/* Timing Info */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-2xl p-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-green-500 p-2 rounded-xl">
              <ClockIcon className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">
              Timing Information
            </h3>
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500 flex items-center">
                <CalendarIcon className="h-3 w-3 mr-2" />
                Created:
              </span>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(jobInfo.created_at)}
              </p>
            </div>
            {jobInfo.processing_started_at && (
              <div>
                <span className="text-sm text-gray-500">Started:</span>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(jobInfo.processing_started_at)}
                </p>
              </div>
            )}
            {jobInfo.processing_completed_at && (
              <div>
                <span className="text-sm text-gray-500">Completed:</span>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(jobInfo.processing_completed_at)}
                </p>
              </div>
            )}
          </div>
        </div>
        {/* Duration Info */}
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-purple-500 p-2 rounded-xl">
              <ChartBarIcon className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">Performance</h3>
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500 flex items-center">
                <ClockIcon className="h-3 w-3 mr-2" />
                Duration:
              </span>
              <p className="text-sm font-medium text-gray-900">
                {getProcessingDuration()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
