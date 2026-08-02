-- Assignments Table
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  language VARCHAR(50) NOT NULL,
  difficulty VARCHAR(20) NOT NULL,
  marks INTEGER NOT NULL,
  time_limit_minutes INTEGER,
  due_date TIMESTAMP,
  concepts_covered TEXT[],
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Assignment Test Cases Table
CREATE TABLE IF NOT EXISTS assignment_test_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  input TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Assignment Hints Table
CREATE TABLE IF NOT EXISTS assignment_hints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level IN (1, 2, 3)),
  hint_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Assignment Submissions Table
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_code TEXT NOT NULL,
  language VARCHAR(50) NOT NULL,
  execution_time_ms INTEGER,
  memory_used_kb INTEGER,
  status VARCHAR(20) NOT NULL, -- Passed, Failed, Error
  score INTEGER DEFAULT 0,
  submitted_at TIMESTAMP DEFAULT NOW()
);

-- Submission Results Table
CREATE TABLE IF NOT EXISTS submission_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES assignment_submissions(id) ON DELETE CASCADE,
  test_case_id UUID NOT NULL REFERENCES assignment_test_cases(id) ON DELETE CASCADE,
  actual_output TEXT,
  passed BOOLEAN NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Recommendations Table
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recommendation_text TEXT NOT NULL,
  concept_gap TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_assignments_classroom ON assignments(classroom_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_assignment ON assignment_test_cases(assignment_id);
CREATE INDEX IF NOT EXISTS idx_hints_assignment ON assignment_hints(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submission_results_submission ON submission_results(submission_id);
CREATE INDEX IF NOT EXISTS idx_ai_rec_assignment ON ai_recommendations(assignment_id);
CREATE INDEX IF NOT EXISTS idx_ai_rec_student ON ai_recommendations(student_id);
