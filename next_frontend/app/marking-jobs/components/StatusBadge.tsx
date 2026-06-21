import React from "react";
import {
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  XCircleIcon,
  QueueListIcon,
} from "@heroicons/react/24/outline";
import { MarkingJobStatus } from "../types/types";

interface StatusBadgeProps {
  status: MarkingJobStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case MarkingJobStatus.QUEUED:
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
          <QueueListIcon className="h-3 w-3 mr-1" />
          Queued
        </span>
      );
    case MarkingJobStatus.PROCESSING:
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
          <ArrowPathIcon className="h-3 w-3 mr-1 animate-spin" />
          Processing
        </span>
      );
    case MarkingJobStatus.COMPLETED:
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium bg-green-100 text-green-800 border border-green-200">
          <CheckCircleIcon className="h-3 w-3 mr-1" />
          Completed
        </span>
      );
    case MarkingJobStatus.FAILED:
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium bg-red-100 text-red-800 border border-red-200">
          <XCircleIcon className="h-3 w-3 mr-1" />
          Failed
        </span>
      );
    // All other statuses show as Pending
    case MarkingJobStatus.INITIALIZED:
    case MarkingJobStatus.MARKING_SCHEME_CONFIGURED:
    case MarkingJobStatus.MARKING_SCHEME_VERIFIED:
    case MarkingJobStatus.ANSWER_SHEETS_ATTACHED:
    case MarkingJobStatus.CANCELLED:
    default:
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
          <ClockIcon className="h-3 w-3 mr-1" />
          Pending
        </span>
      );
  }
}
