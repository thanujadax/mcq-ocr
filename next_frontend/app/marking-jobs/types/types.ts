import { ComponentType, SVGProps } from "react";

type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type JobPriority = "normal" | "urgent";

export enum MarkingJobStatus {
  INITIALIZED = "initialized",
  MARKING_SCHEME_CONFIGURED = "marking_scheme_configured",
  MARKING_SCHEME_VERIFIED = "marking_scheme_verified",
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
  icon: HeroIcon;
}
export interface Bubble {
  marked: boolean;
  coordinates: [number, number];
}

export interface StudentResult {
  row_number: number;
  index_number: string;
  correct: number[];
  incorrect: number[];
  more_than_one_marked: number[];
  not_marked: number[];
  // columnwise_total: number[];
  score: number;
  flag: boolean;
  flag_reason: string;
  answer_sheet_path: string;
  labeled_points: Bubble[][];
  is_resolved: boolean;
}

export interface JobInfo {
  id: number;
  name: string;
  template_name: string;
  priority: string;
  status: string;
  marking_config_id: number;
  save_intermediate_results: boolean;
  result_sheet_file_id: number;
  created_at: string;
  updated_at: string;
  processing_started_at?: string;
  processing_completed_at?: string;
}

export interface ResultsData {
  job_info: JobInfo;
  marking_scheme: Bubble[][];
  results: StudentResult[];
  total_answer_sheets: number;
  processed_answer_sheets: number;
  failed_answer_sheets: number;
}

export interface MarkingJobBasic {
  id: number;
  name: string;
  status: MarkingJobStatus;
  priority: string;
  template_name: string;
  total_answer_sheets?: number;
  processed_answer_sheets?: number;
  created_at: string;
  updated_at: string;
  created_by: number;
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
