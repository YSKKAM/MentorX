-- Make classroom_id nullable to support global chat messages
ALTER TABLE chat_messages ALTER COLUMN classroom_id DROP NOT NULL;
