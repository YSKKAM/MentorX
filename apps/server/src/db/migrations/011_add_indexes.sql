-- Add indexes on foreign keys to optimize query performance
CREATE INDEX IF NOT EXISTS idx_student_activity_classroom ON student_activity(classroom_id);
CREATE INDEX IF NOT EXISTS idx_student_activity_student ON student_activity(student_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_classroom ON chat_messages(classroom_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_room ON chat_messages(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_classroom ON assignments(classroom_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student ON assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_assignment ON ai_recommendations(assignment_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_student ON ai_recommendations(student_id);
