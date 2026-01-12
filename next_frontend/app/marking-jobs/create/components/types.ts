import { IconDefinition } from "@fortawesome/free-solid-svg-icons";

export type JobPriority = "normal" | "urgent";

export enum MarkingJobStatus {
  PENDING = "pending",
  MARKING_SCHEME_CONFIGURED = "marking_scheme_configured",
  ANSWER_SHEETS_ATTACHED = "answer_sheets_attached",
  QUEUED = "queued",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export interface MarkingJobForm {
  name: string;
  description: string;
  priority: JobPriority;
  template_id: string;
  markingSchemeFile: File | null;
  answerSheetsFile: File | null;
  save_intermediate_results: boolean;
}

export interface MarkingJob {
  id: number | null;
  name: string | null;
  description: string | null;
  status: MarkingJobStatus | null;
  priority: string | null;
  template_id: number | null;
  marking_scheme_id: number | null;
  marking_config_id: number | null;
  answer_sheets_folder_id: number | null;
  save_intermediate_results: boolean | null;
  total_answer_sheets: number | null;
  processed_answer_sheets: number | null;
  failed_answer_sheets: number | null;
  processing_started_at: string | null;
  processing_completed_at: string | null;
  error_message: string | null;
  error_details: string | null;
  results_summary: string | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: number | null;
  // Frontend-specific fields
  markingSchemeFile: File | null;
  answerSheetsFile: File | null;
}

export interface Step {
  id: number;
  title: string;
  description: string;
  icon: IconDefinition;
}
export interface Bubble {
  marked: boolean;
  x: number;
  y: number;
}
