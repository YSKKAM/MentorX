-- Add Strict Mode columns to classrooms table
ALTER TABLE classrooms
ADD COLUMN IF NOT EXISTS strict_mode_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS block_paste BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS block_copy BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS block_cut BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS record_restricted_events BOOLEAN DEFAULT true;

-- Create restricted_action_events table to log restricted action attempts without storing clipboard data
CREATE TABLE IF NOT EXISTS restricted_action_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- e.g., 'blocked_paste', 'blocked_copy', 'blocked_cut', 'multiple_attempts'
  file_context VARCHAR(255) DEFAULT 'unknown',
  attempt_count INT DEFAULT 1,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Index for fast queries by classroom and student
CREATE INDEX IF NOT EXISTS idx_restricted_events_classroom ON restricted_action_events(classroom_id);
CREATE INDEX IF NOT EXISTS idx_restricted_events_student ON restricted_action_events(student_id);
