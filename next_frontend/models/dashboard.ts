export interface KeyStats {
  total_users: number;
  active_templates: number;
  completed_marking_jobs: number;
  completion_rate: number;
}

export interface RecentMarkingJob {
  id: number;
  name: string;
  status: string;
  priority: string;
  total_answer_sheets: number | null;
  processed_answer_sheets: number | null;
  failed_answer_sheets: number | null;
  progress_percentage: number;
  created_at: string;
  template_name: string;
}

export interface RecentTemplate {
  id: number;
  name: string;
  description: string | null;
  config_type: string;
  status: string;
  num_questions: number;
  created_at: string;
}

export interface ConfigTypeComparison {
  config_type: string;
  template_count: number;
  marking_job_count: number;
  completed_jobs: number;
  failed_jobs: number;
  completion_rate: number;
  avg_completion_time_seconds: number | null;
}

export interface UserActivity {
  activity_type: string;
  description: string;
  timestamp: string;
  related_id: number;
  related_name: string;
}

export interface DashboardStats {
  user_name: string;
  key_stats: KeyStats;
  recent_marking_jobs: RecentMarkingJob[];
  recent_templates: RecentTemplate[];
  config_type_comparison: ConfigTypeComparison[];
  user_activities: UserActivity[];
}
