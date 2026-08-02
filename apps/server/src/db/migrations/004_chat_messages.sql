-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- the sender (null if system)
  content TEXT NOT NULL,
  is_ai BOOLEAN DEFAULT FALSE,
  ai_provider VARCHAR(50) DEFAULT NULL, -- 'openai', 'gemini', 'mock'
  requested_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- for AI messages
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_chat_classroom ON chat_messages(classroom_id, timestamp ASC);
