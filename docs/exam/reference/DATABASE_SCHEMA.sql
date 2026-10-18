-- Online Examination Platform - relational schema reference
--
-- Canonical executable migrations live in backend/src/migrations.js.
-- This file is a review/export snapshot for the local SQLite schema.
-- Apply changes with: cd backend && DATABASE_FILE=/path/exam.sqlite npm run migrate

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS candidates (
  id TEXT PRIMARY KEY,
  external_subject TEXT UNIQUE NOT NULL,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS administrators (
  id TEXT PRIMARY KEY,
  external_subject TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS exams (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  exam_date TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  passing_percentage REAL NOT NULL CHECK (passing_percentage BETWEEN 0 AND 100),
  passing_mode TEXT NOT NULL DEFAULT 'PERCENTAGE',
  passing_marks REAL,
  status TEXT NOT NULL,
  result_published INTEGER NOT NULL DEFAULT 0,
  questions_json TEXT NOT NULL,
  answer_keys_json TEXT NOT NULL,
  eligible_candidates_json TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  question_type TEXT NOT NULL DEFAULT 'SINGLE_CHOICE',
  prompt TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS question_options (
  id TEXT NOT NULL,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  is_correct INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL,
  PRIMARY KEY (question_id, id),
  UNIQUE (question_id, position)
);

CREATE TABLE IF NOT EXISTS exam_questions (
  exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id),
  position INTEGER NOT NULL,
  marks REAL NOT NULL,
  PRIMARY KEY (exam_id, question_id),
  UNIQUE (exam_id, position)
);

CREATE TABLE IF NOT EXISTS exam_eligibility (
  exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  candidate_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (exam_id, candidate_id)
);

CREATE TABLE IF NOT EXISTS attempts (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL REFERENCES exams(id),
  candidate_id TEXT NOT NULL,
  state TEXT NOT NULL,
  started_at TEXT NOT NULL,
  deadline_at TEXT NOT NULL,
  warning_count INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 0,
  answers_json TEXT NOT NULL DEFAULT '{}',
  question_order_json TEXT NOT NULL DEFAULT '[]',
  option_orders_json TEXT NOT NULL DEFAULT '{}',
  active_session_id TEXT,
  finalized_at TEXT,
  finalization_reason TEXT,
  UNIQUE (exam_id, candidate_id)
);

CREATE TABLE IF NOT EXISTS attempt_questions (
  attempt_id TEXT NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id),
  position INTEGER NOT NULL,
  option_order_json TEXT NOT NULL,
  PRIMARY KEY (attempt_id, question_id),
  UNIQUE (attempt_id, position)
);

CREATE TABLE IF NOT EXISTS answers (
  attempt_id TEXT NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id),
  selected_option_id TEXT NOT NULL,
  saved_at TEXT NOT NULL,
  revision INTEGER NOT NULL,
  PRIMARY KEY (attempt_id, question_id)
);

CREATE TABLE IF NOT EXISTS results (
  attempt_id TEXT PRIMARY KEY REFERENCES attempts(id),
  score REAL NOT NULL,
  total_marks REAL NOT NULL,
  qualification TEXT NOT NULL,
  published INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS monitoring_events (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  warning_count INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  attempt_id TEXT,
  event_type TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  metadata_json TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  actor_id TEXT
);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  scope_key TEXT PRIMARY KEY,
  response_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS attempts_expiry_idx ON attempts(state, deadline_at);
CREATE INDEX IF NOT EXISTS exam_questions_position_idx ON exam_questions(exam_id, position);
CREATE INDEX IF NOT EXISTS eligibility_candidate_idx ON exam_eligibility(candidate_id, exam_id);
CREATE INDEX IF NOT EXISTS attempt_questions_position_idx ON attempt_questions(attempt_id, position);
CREATE INDEX IF NOT EXISTS monitoring_attempt_idx ON monitoring_events(attempt_id, occurred_at);
