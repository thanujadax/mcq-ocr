export enum UserRoles {
  SUPERADMIN = "Super User",
  FACULTYADMIN = "Faculty Admin",
  BASIC = "Basic User",
}

export enum VerifyStatus {
  NONE = "none",
  EMAILVERIFIED = "email_verified",
  ADMINVERIFIED = "admin_verified",
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRoles;
  verify_status: VerifyStatus;
  faculty_id?: number;
  faculty?: {
    id: number;
    name: string;
  };
  last_login?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FilterOption {
  value: string;
  label: string;
}
