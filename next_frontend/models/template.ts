// Define template config types
type ConfigType = "grid_based" | "cluster_based";

// Define template status
type TemplateStatus = "queued" | "processing" | "completed" | "failed";

interface Template {
  id: number;
  name: string;
  status: TemplateStatus;
  description?: string | null;
  config_type: ConfigType;
  configuration_file_id?: number | null;
  template_file_id?: number | null;
  num_questions: number;
  num_of_columns?: number | null;
  num_of_rows_per_column?: number[] | null;
  num_of_options_per_question: number;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  created_by: number;
}

export type { Template, TemplateStatus, ConfigType };