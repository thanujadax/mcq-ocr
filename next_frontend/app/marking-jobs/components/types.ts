import { MarkingJobStatus } from "@/app/marking-jobs/create/components/types";

export interface MarkingJobBasic {
  id: number;
  name: string;
  status: MarkingJobStatus;
  priority: string;
  template_name: string;
  created_at: string;
  updated_at: string;
  created_by: number;

  completed: number;
  total: number;
}

export interface ReviewQuestion {
  id: number;
  question: string;
  options: string[];
  markedAnswer: string;
  suggestedAnswer: string;
  issue: string;
}

export interface StatusFilterOption {
  value: string;
  label: string;
}
