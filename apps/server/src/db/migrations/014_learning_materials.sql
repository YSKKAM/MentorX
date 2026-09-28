-- Learning Materials Module Migration
CREATE TABLE IF NOT EXISTS learning_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  extracted_text TEXT,
  processing_status VARCHAR(50) DEFAULT 'Processing', -- 'Uploading', 'Processing', 'Extracting Content', 'Identifying Topics', 'Ready', 'Failed'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Material Topics Table
CREATE TABLE IF NOT EXISTS material_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES learning_materials(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  concept_summary TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Generated Questions Table
CREATE TABLE IF NOT EXISTS generated_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES learning_materials(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES material_topics(id) ON DELETE SET NULL,
  topic_name VARCHAR(255),
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL DEFAULT 'mcq', -- 'mcq', 'multiple_correct', 'true_false', 'short_answer'
  options JSONB,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  difficulty VARCHAR(20) DEFAULT 'Medium', -- 'Easy', 'Medium', 'Hard'
  status VARCHAR(20) DEFAULT 'Draft', -- 'Draft', 'Approved', 'Rejected'
  assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Non-breaking additions to assignments table
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS assignment_type VARCHAR(20) DEFAULT 'coding';
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS source_material_id UUID REFERENCES learning_materials(id) ON DELETE SET NULL;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS total_questions INTEGER DEFAULT 0;

-- Non-breaking additions to assignment_submissions table
ALTER TABLE assignment_submissions ALTER COLUMN source_code DROP NOT NULL;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS answers JSONB;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS quiz_results JSONB;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_learning_materials_classroom ON learning_materials(classroom_id);
CREATE INDEX IF NOT EXISTS idx_material_topics_material ON material_topics(material_id);
CREATE INDEX IF NOT EXISTS idx_generated_questions_material ON generated_questions(material_id);
CREATE INDEX IF NOT EXISTS idx_generated_questions_assignment ON generated_questions(assignment_id);
