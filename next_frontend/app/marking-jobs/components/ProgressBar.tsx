import React from "react";
import { MarkingJobBasic } from "./types";
import { MarkingJobStatus } from "../create/components/types";

interface ProgressBarProps {
  job: MarkingJobBasic;
}

export function ProgressBar({ job }: ProgressBarProps) {
  let percentage =
    job.total > 0 ? (job.completed / job.total) * 100 : 0;

  switch (job.status) {
    case MarkingJobStatus.COMPLETED:
      percentage = 100;
      break;
    case MarkingJobStatus.MARKING_SCHEME_CONFIGURED:
    case MarkingJobStatus.ANSWER_SHEETS_ATTACHED:
    case MarkingJobStatus.QUEUED:
      percentage = 10;
      break;
    case MarkingJobStatus.FAILED:
      percentage = 100;
      break;
    case MarkingJobStatus.PENDING:
      percentage = 0;
      break;
    case MarkingJobStatus.CANCELLED:
      percentage = 100;
      break;
  }
  percentage += (job.total > 0 ? (job.completed / job.total) * (100 - percentage) : 0);

  const getProgressBarColor = () => {
    switch (job.status) {
      case MarkingJobStatus.COMPLETED:
        return "bg-green-500";
      case MarkingJobStatus.PROCESSING:
        return "bg-amber-500";
      case MarkingJobStatus.MARKING_SCHEME_CONFIGURED:
        return "bg-yellow-500";
      case MarkingJobStatus.ANSWER_SHEETS_ATTACHED:
        return "bg-blue-500";
      case MarkingJobStatus.FAILED:
        return "bg-red-500";
      case MarkingJobStatus.QUEUED:
        return "bg-purple-500";
      case MarkingJobStatus.PENDING:
        return "bg-gray-400";
      case MarkingJobStatus.CANCELLED:
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span>
          {job.total > 0 && <span>{job.completed} / {job.total}</span>}
        </span>
        <span>{Math.round(percentage)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${getProgressBarColor()}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}
