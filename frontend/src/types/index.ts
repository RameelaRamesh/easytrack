export type UserRole = 'admin' | 'tl' | 'hr' | 'employee' | 'ceo' | 'operations_head';

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_owner?: boolean;
  finance_access?: boolean;
  has_finance_access?: boolean;
  display_role?: string;
  organization: string | null;
  organization_name: string | null;
  must_change_password: boolean;
}

export interface Organization {
  id: string;
  name: string;
  logo: string | null;
  industry: string;
  country: string;
  timezone: string;
  currency: string;
  working_days: string[];
  working_hours: { start: string; end: string };
  holiday_policy?: string;
  attendance_rules?: Record<string, any>;
  leave_rules?: Record<string, any>;
  incentive_rules?: Record<string, any>;
  overtime_rules?: Record<string, any>;
  departments?: string[];
  designations?: string[];
  task_types?: string[];
  workflows?: string[];
  custom_fields?: Record<string, any>;
  performance_metrics?: {
    efficiency_target?: number;
    accuracy_target?: number;
    daily_volume_target?: number;
    sla_compliance_target?: number;
    [key: string]: any;
  };
}

export interface EmployeeProfile {
  id: number;
  user_details: User;
  employee_id: string;
  department: string;
  designation: string;
  manager: string | null;
  manager_name: string | null;
  status: 'active' | 'inactive' | 'terminated';
  qa_enabled: boolean;
  mobile?: string | null;
  base_salary?: number | null;
  leave_balance: number;

  // 1. Personal Details
  start_date?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  address?: string | null;
  district_suburb?: string | null;
  state_postcode?: string | null;

  // 2. Position & Employment Details
  employment_type?: string | null;
  work_timing?: string | null;

  // 3. Educational Details
  highest_qualification?: string | null;
  specialization?: string | null;
  college_university?: string | null;
  graduation_year?: string | null;
  percentage_cgpa?: string | null;

  // 4. Bank Account Details
  bank_name?: string | null;
  branch_name?: string | null;
  account_holder?: string | null;
  account_number?: string | null;
  ifsc_code?: string | null;

  // 5. Documents Submitted
  doc_passport_photo?: boolean;
  doc_10th_marksheet?: boolean;
  doc_approved_id?: boolean;
  doc_12th_diploma?: boolean;
  doc_pan_card?: boolean;
  doc_degree_certificate?: boolean;
  doc_semester_marksheets?: boolean;

  // 6. Declaration & Signature
  declaration_candidate_name?: string | null;
  declaration_signature?: string | null;
  declaration_date?: string | null;
}

export interface Client {
  id: number;
  client_id: string;
  name: string;
  status: 'active' | 'inactive' | 'onboarding';
  industry?: string;
  ops_head?: string;
  ops_head_name?: string;
  tl?: string;
  tl_name?: string;
  sla?: Record<string, any>;
  working_hours?: Record<string, any>;
  notes?: string;
  custom_fields?: Record<string, any>;
}

export interface Process {
  id: number;
  process_id: string;
  name: string;
  client: number;
  client_name?: string;
  sop?: string;
  sla?: Record<string, any>;
  target: number;
  status: 'active' | 'inactive';
}

export interface Project {
  id: number;
  name: string;
  client: number;
  client_name: string;
  status: 'active' | 'inactive';
  description?: string;
}

export interface BillingWork {
  id: number;
  work_id: string;
  client: number;
  client_name: string;
  process: number;
  process_name: string;
  work_type: string;
  assigned_tl?: string;
  tl_name?: string;
  assigned_employee?: string;
  employee_name?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  sla_deadline?: string;
  target_quantity: number;
  actual_quantity: number;
  due_date?: string;
  estimated_effort_hours: number;
  actual_effort_hours: number;
  progress: number;
  completed_count?: number;
  target_count?: number;
  notes?: string;
  custom_fields?: Record<string, any>;
}

export interface TaskComment {
  id: number;
  author: string;
  author_name: string;
  text: string;
  timestamp: string;
}

export interface TaskActivity {
  action: string;
  actor: string;
  timestamp: string;
  details: string;
}

export interface TaskAttachment {
  name: string;
  url: string;
  size?: string;
  date?: string;
}

export interface Task {
  id: number;
  key: string;
  title: string;
  description?: string;
  status: 'todo' | 'backlog' | 'assigned' | 'in_progress' | 'review' | 'changes_requested' | 'completed' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'critical';
  flow_source?: 'management' | 'client_requirement';
  project?: number;
  project_name?: string;
  client?: number;
  client_name?: string;
  team?: string;
  team_lead?: string | number;
  team_lead_name?: string;
  assignee?: string | number;
  assignee_name?: string;
  reporter?: string | number;
  reporter_name?: string;
  due_date?: string;
  sla_hours: number;
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
  activity_history?: TaskActivity[];
  review_notes?: string;
}


export interface Conversation {
  id: number;
  is_group?: boolean;
  title?: string;
  participants: string[];
  participants_details: User[];
  last_message?: Message;
  unread_count: number;
  created_at: string;
}

export interface Message {
  id: number;
  conversation: number;
  sender: string;
  sender_name: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface AttendanceRecord {
  id: number;
  user: string;
  employee_name?: string;
  employee_id?: string;
  department?: string;
  designation?: string;
  role?: string;
  date: string;
  check_in?: string;
  check_out?: string;
  status: 'working' | 'on_break' | 'checked_out' | 'absent' | 'leave' | 'not_checked_in' | string;
  verification_status?: 'present' | 'absent' | 'not_informed' | 'half_day' | string;
  verified_by_id?: string;
  verified_by_name?: string;
  verified_at?: string;
  total_break_seconds: number;
  total_working_seconds: number;
  overtime_seconds: number;
  shift: string;
}
