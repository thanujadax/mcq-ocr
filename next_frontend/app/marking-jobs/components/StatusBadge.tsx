import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faClock,
  faFileAlt,
  faList,
  faSpinner,
  faTimesCircle,
  faBan,
  faClipboardCheck,
} from "@fortawesome/free-solid-svg-icons";
import { MarkingJobStatus } from "../create/components/types";

interface StatusBadgeProps {
  status: MarkingJobStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case MarkingJobStatus.PENDING:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <FontAwesomeIcon icon={faClock} className="h-3 w-3 mr-1" />
          Pending
        </span>
      );
    case MarkingJobStatus.MARKING_SCHEME_CONFIGURED:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <FontAwesomeIcon icon={faClipboardCheck} className="h-3 w-3 mr-1" />
          Marking Scheme Configured
        </span>
      );
    case MarkingJobStatus.ANSWER_SHEETS_ATTACHED:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <FontAwesomeIcon icon={faFileAlt} className="h-3 w-3 mr-1" />
          Answers Attached
        </span>
      );
    case MarkingJobStatus.QUEUED:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <FontAwesomeIcon icon={faList} className="h-3 w-3 mr-1" />
          Queued
        </span>
      );
    case MarkingJobStatus.PROCESSING:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <FontAwesomeIcon
            icon={faSpinner}
            className="h-3 w-3 mr-1 animate-spin"
          />
          Processing
        </span>
      );
    case MarkingJobStatus.COMPLETED:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <FontAwesomeIcon icon={faCheckCircle} className="h-3 w-3 mr-1" />
          Completed
        </span>
      );
    case MarkingJobStatus.FAILED:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <FontAwesomeIcon icon={faTimesCircle} className="h-3 w-3 mr-1" />
          Failed
        </span>
      );
    case MarkingJobStatus.CANCELLED:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <FontAwesomeIcon icon={faBan} className="h-3 w-3 mr-1" />
          Cancelled
        </span>
      );
    default:
      return null;
  }
}
