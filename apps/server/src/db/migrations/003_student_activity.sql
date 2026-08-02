-- Student activity tracking table
CREATE TABLE IF NOT EXISTS student_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  language VARCHAR(50) DEFAULT 'unknown',
  status VARCHAR(20) NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'coding', 'debugging', 'away', 'offline')),
  current_file TEXT DEFAULT '',
  errors JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_activity_student ON student_activity(student_id);
CREATE INDEX IF NOT EXISTS idx_activity_classroom ON student_activity(classroom_id);
CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON student_activity(timestamp DESC);

-- Composite index for getting latest activity per student in a classroom
CREATE INDEX IF NOT EXISTS idx_activity_student_classroom ON student_activity(student_id, classroom_id, timestamp DESC);
