import React from "react";
import { Button } from "../../../components/UI/Button";
import {
  TrashIcon,
  EyeIcon,
  StopIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { MarkingJobBasic, MarkingJobStatus } from "../types/types";

interface JobActionsProps {
  job: MarkingJobBasic;
  onStop: (jobId: number) => void;
  onEdit: (job: MarkingJobBasic) => void;
  onViewResults: (job: MarkingJobBasic) => void;
  onDelete: (jobId: number) => void;
}

export function JobActions({
  job,
  onStop,
  onEdit,
  onViewResults,
  onDelete,
}: JobActionsProps) {
  return (
    <div className="flex space-x-2 justify-end">
      {job.status === MarkingJobStatus.PROCESSING ? (
        <Button
          variant="outline"
          size="sm"
          icon={<StopIcon className="h-4 w-4" />}
          onClick={() => onStop(job.id)}
        >
          Stop
        </Button>
      ) : job.status === MarkingJobStatus.COMPLETED ? (
        <Button
          variant="outline"
          size="sm"
          icon={<EyeIcon className="h-4 w-4" />}
          onClick={() => onViewResults(job)}
        >
          View Results
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          icon={<PencilIcon className="h-4 w-4" />}
          onClick={() => onEdit(job)}
        >
          Continue
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        icon={<TrashIcon className="h-4 w-4" />}
        onClick={() => onDelete(job.id)}
      />
    </div>
  );
}
