-- Create a new table for dynamic private chat rooms
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  join_code VARCHAR(8) UNIQUE NOT NULL,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for looking up chat rooms by join code
CREATE INDEX IF NOT EXISTS idx_chat_rooms_join_code ON chat_rooms(join_code);

-- Add chat_room_id to chat_messages table to link messages to a private chat room
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS chat_room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE;

-- Index for looking up chat messages by chat room
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_room ON chat_messages(chat_room_id, timestamp ASC);
