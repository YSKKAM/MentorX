-- AI Chat Extensions table modifications

-- Add columns to support threading and AI generation metadata
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS prompt TEXT,
ADD COLUMN IF NOT EXISTS generated_image TEXT,
ADD COLUMN IF NOT EXISTS message_type VARCHAR(50) DEFAULT 'text';

-- Index for querying replies if needed
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to ON chat_messages(reply_to_id);
