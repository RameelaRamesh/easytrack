export type UserRole = 'ceo' | 'operations_head' | 'hr' | 'tl' | 'employee';

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
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
  mobile?: string;
  base_salary?: number;
  leave_balance: number;
}

export interface Client {
  id: number;
  client_id: string;
  name: string;
  status: 'active' | 'inactive' | 'onboarding';
  ops_head?: string;
  ops_head_name?: string;
  tl?: string;
  tl_name?: string;
  sla?: Record<string, any>;
  working_hours?: Record<string, any>;
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
}

export interface Task {
  id: number;
  key: string;
  title: string;
  description?: string;
  status: 'backlog' | 'assigned' | 'in_progress' | 'review' | 'completed' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  assignee_name?: string;
  reporter?: string;
  reporter_name?: string;
  due_date?: string;
  sla_hours: number;
}

export interface Conversation {
  id: number;
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
  date: string;
  check_in?: string;
  check_out?: string;
  status: 'working' | 'on_break' | 'checked_out' | 'absent' | 'leave';
  total_break_seconds: number;
  total_working_seconds: number;
  overtime_seconds: number;
  shift: string;
}
