import { getDb } from './connection';

export const SCHEMA_SQL = `
-- Core Tables for Tectranz LMS

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('student', 'mentor', 'admin', 'reviewer', 'supervisor', 'finance')),
  mfa_enabled INTEGER NOT NULL DEFAULT 0,
  mfa_secret TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS student_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  college_name TEXT,
  graduation_year INTEGER,
  semester TEXT,
  degree_branch TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  consent_signed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS mentor_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  headline TEXT,
  bio TEXT,
  company TEXT,
  expertise_tracks TEXT,
  max_students INTEGER NOT NULL DEFAULT 20,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS partner_organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  industry TEXT NOT NULL,
  website TEXT,
  contact_email TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tracks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  duration_weeks INTEGER NOT NULL DEFAULT 16,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price_inr INTEGER NOT NULL,
  mode TEXT NOT NULL CHECK(mode IN ('online', 'hybrid', 'in-office')),
  description TEXT NOT NULL,
  weekly_hours INTEGER NOT NULL DEFAULT 15,
  includes_office_access INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS policy_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version_tag TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  min_attendance_percent REAL NOT NULL DEFAULT 75.0,
  min_engagement_hours REAL NOT NULL DEFAULT 120.0,
  required_projects_count INTEGER NOT NULL DEFAULT 2,
  required_reports_count INTEGER NOT NULL DEFAULT 4,
  passing_grade_percent REAL NOT NULL DEFAULT 60.0,
  late_penalty_per_day REAL NOT NULL DEFAULT 5.0,
  resubmission_allowed INTEGER NOT NULL DEFAULT 1,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cohorts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  track_id INTEGER NOT NULL REFERENCES tracks(id),
  policy_version_id INTEGER NOT NULL REFERENCES policy_versions(id),
  name TEXT NOT NULL UNIQUE,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  lead_mentor_id INTEGER REFERENCES users(id),
  max_capacity INTEGER NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK(status IN ('upcoming', 'in_progress', 'completed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS enrolments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  registration_id TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  cohort_id INTEGER NOT NULL REFERENCES cohorts(id),
  plan_id INTEGER NOT NULL REFERENCES plans(id),
  policy_version_id INTEGER NOT NULL REFERENCES policy_versions(id),
  partner_id INTEGER REFERENCES partner_organizations(id),
  assigned_mentor_id INTEGER REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('pending_payment', 'active', 'paused', 'completed', 'withdrawn')),
  payment_status TEXT NOT NULL DEFAULT 'paid' CHECK(payment_status IN ('pending', 'paid', 'refunded', 'disputed')),
  onboarding_completed INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL UNIQUE,
  transaction_ref TEXT UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  enrolment_id INTEGER REFERENCES enrolments(id),
  plan_id INTEGER NOT NULL REFERENCES plans(id),
  amount_inr INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  provider TEXT NOT NULL DEFAULT 'razorpay',
  status TEXT NOT NULL DEFAULT 'successful' CHECK(status IN ('pending', 'successful', 'failed', 'refunded', 'disputed')),
  raw_payload TEXT,
  verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS curriculum_phases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  track_id INTEGER NOT NULL REFERENCES tracks(id),
  phase_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_week INTEGER NOT NULL,
  end_week INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS curriculum_modules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phase_id INTEGER NOT NULL REFERENCES curriculum_phases(id),
  module_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  week_number INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS curriculum_lessons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module_id INTEGER NOT NULL REFERENCES curriculum_modules(id),
  title TEXT NOT NULL,
  lesson_type TEXT NOT NULL CHECK(lesson_type IN ('recorded', 'practical_lab', 'quiz', 'reading')),
  duration_minutes INTEGER NOT NULL DEFAULT 45,
  video_url TEXT,
  transcript_text TEXT,
  resources_json TEXT,
  order_index INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS lesson_completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enrolment_id INTEGER NOT NULL REFERENCES enrolments(id),
  lesson_id INTEGER NOT NULL REFERENCES curriculum_lessons(id),
  status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('in_progress', 'completed')),
  progress_seconds INTEGER NOT NULL DEFAULT 0,
  completion_evidence TEXT,
  completed_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(enrolment_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS live_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cohort_id INTEGER NOT NULL REFERENCES cohorts(id),
  title TEXT NOT NULL,
  session_type TEXT NOT NULL CHECK(session_type IN ('lecture', 'office_hours', 'review', 'viva')),
  instructor_id INTEGER NOT NULL REFERENCES users(id),
  scheduled_start TEXT NOT NULL,
  scheduled_end TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  meeting_link TEXT NOT NULL,
  is_required INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'rescheduled', 'cancelled', 'completed')),
  recording_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enrolment_id INTEGER NOT NULL REFERENCES enrolments(id),
  live_session_id INTEGER NOT NULL REFERENCES live_sessions(id),
  status TEXT NOT NULL CHECK(status IN ('present', 'absent', 'late', 'excused', 'pending_verification')),
  verified_by_id INTEGER REFERENCES users(id),
  notes TEXT,
  marked_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(enrolment_id, live_session_id)
);

CREATE TABLE IF NOT EXISTS attendance_corrections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  attendance_record_id INTEGER NOT NULL REFERENCES attendance_records(id),
  enrolment_id INTEGER NOT NULL REFERENCES enrolments(id),
  requested_status TEXT NOT NULL CHECK(requested_status IN ('present', 'excused')),
  reason TEXT NOT NULL,
  evidence_url TEXT,
  decision TEXT NOT NULL DEFAULT 'pending' CHECK(decision IN ('pending', 'approved', 'rejected')),
  reviewer_id INTEGER REFERENCES users(id),
  reviewer_notes TEXT,
  resolved_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cohort_id INTEGER NOT NULL REFERENCES cohorts(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  instructions TEXT NOT NULL,
  rubric_json TEXT NOT NULL,
  max_points INTEGER NOT NULL DEFAULT 100,
  due_date TEXT NOT NULL,
  late_allowed INTEGER NOT NULL DEFAULT 1,
  order_index INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS assignment_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id INTEGER NOT NULL REFERENCES assignments(id),
  enrolment_id INTEGER NOT NULL REFERENCES enrolments(id),
  version_number INTEGER NOT NULL DEFAULT 1,
  github_repo_url TEXT,
  demo_url TEXT,
  submission_text TEXT,
  file_attachments_json TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted', 'under_review', 'changes_requested', 'resubmitted', 'graded')),
  score REAL,
  reviewer_id INTEGER REFERENCES users(id),
  reviewer_feedback TEXT,
  submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
  graded_at TEXT
);

CREATE TABLE IF NOT EXISTS project_catalogue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  track_id INTEGER NOT NULL REFERENCES tracks(id),
  title TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK(difficulty IN ('beginner', 'intermediate', 'advanced')),
  partner_id INTEGER REFERENCES partner_organizations(id),
  problem_statement TEXT NOT NULL,
  scope_details TEXT NOT NULL,
  deliverables_json TEXT NOT NULL,
  reviewer_capacity INTEGER NOT NULL DEFAULT 10
);

CREATE TABLE IF NOT EXISTS student_projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enrolment_id INTEGER NOT NULL REFERENCES enrolments(id),
  catalogue_project_id INTEGER REFERENCES project_catalogue(id),
  title TEXT NOT NULL,
  project_type TEXT NOT NULL CHECK(project_type IN ('minor', 'capstone')),
  partner_id INTEGER REFERENCES partner_organizations(id),
  mentor_id INTEGER REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'approved' CHECK(status IN ('proposed', 'approved', 'in_progress', 'submitted', 'changes_requested', 'accepted')),
  repo_url TEXT,
  demo_url TEXT,
  documentation_url TEXT,
  viva_status TEXT DEFAULT 'pending' CHECK(viva_status IN ('pending', 'scheduled', 'passed', 'failed')),
  viva_score REAL,
  approved_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS project_milestones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_project_id INTEGER NOT NULL REFERENCES student_projects(id) ON DELETE CASCADE,
  milestone_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  due_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_review', 'completed')),
  feedback TEXT
);

CREATE TABLE IF NOT EXISTS activity_logbook (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enrolment_id INTEGER NOT NULL REFERENCES enrolments(id),
  log_date TEXT NOT NULL,
  activity_category TEXT NOT NULL CHECK(activity_category IN ('learning', 'coding', 'debugging', 'mentoring', 'project_work')),
  duration_minutes INTEGER NOT NULL,
  learning_outcome TEXT NOT NULL,
  blockers TEXT,
  evidence_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'approved', 'changes_requested')),
  approved_by_id INTEGER REFERENCES users(id),
  approved_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS periodic_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enrolment_id INTEGER NOT NULL REFERENCES enrolments(id),
  report_type TEXT NOT NULL CHECK(report_type IN ('weekly', 'fortnightly', 'final')),
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  summary_text TEXT NOT NULL,
  challenges_text TEXT,
  planned_next_text TEXT,
  metrics_snapshot_json TEXT,
  mentor_feedback TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('draft', 'submitted', 'approved', 'changes_requested')),
  approved_by_id INTEGER REFERENCES users(id),
  approved_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS certificates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  certificate_id TEXT NOT NULL UNIQUE,
  enrolment_id INTEGER NOT NULL UNIQUE REFERENCES enrolments(id),
  recipient_name TEXT NOT NULL,
  track_name TEXT NOT NULL,
  partner_name TEXT NOT NULL,
  issue_date TEXT NOT NULL,
  completion_grade TEXT NOT NULL,
  total_hours_completed REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'issued' CHECK(status IN ('issued', 'revoked', 'replaced')),
  revoked_reason TEXT,
  reissue_id TEXT,
  qr_code_data TEXT NOT NULL,
  public_verification_token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enrolment_id INTEGER NOT NULL REFERENCES enrolments(id),
  doc_type TEXT NOT NULL CHECK(doc_type IN ('receipt', 'enrolment_letter', 'partner_offer', 'progress_report', 'completion_certificate')),
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL DEFAULT 'application/pdf',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  enrolment_id INTEGER REFERENCES enrolments(id),
  category TEXT NOT NULL CHECK(category IN ('technical', 'academic', 'mentor', 'payment', 'attendance', 'general')),
  subject TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS support_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  attachments_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL CHECK(notification_type IN ('info', 'deadline', 'feedback', 'approval', 'session')),
  read_status INTEGER NOT NULL DEFAULT 0,
  action_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS background_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued', 'processing', 'completed', 'failed')),
  retries INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  last_error TEXT,
  scheduled_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  metadata_json TEXT,
  ip_address TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Performance & Integrity Indexes
CREATE INDEX IF NOT EXISTS idx_enrolments_user ON enrolments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrolments_cohort ON enrolments(cohort_id);
CREATE INDEX IF NOT EXISTS idx_enrolments_reg_id ON enrolments(registration_id);
CREATE INDEX IF NOT EXISTS idx_attendance_enrolment ON attendance_records(enrolment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_enrolment ON assignment_submissions(enrolment_id);
CREATE INDEX IF NOT EXISTS idx_logbook_enrolment ON activity_logbook(enrolment_id);
CREATE INDEX IF NOT EXISTS idx_reports_enrolment ON periodic_reports(enrolment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read_status);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON background_jobs(status);
`;

export function initSchema(): void {
  const db = getDb();
  db.exec(SCHEMA_SQL);
}
