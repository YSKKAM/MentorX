export type UserRole = "teacher" | "student" | "admin";

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  avatarUrl?: string;
  googleId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
  
export interface Classroom {  
  id: string;  
  name: string;  
  description: string;  
  joinCode: string;  
  teacherId: string;  
  teacherName?: string;  
  isActive: boolean;  
  studentCount?: number;  
  createdAt: string;  
  updatedAt: string;  
}  
  
export interface ClassroomStudent {  
  id: string;  
  studentName: string;  
  studentEmail: string;  
  joinedAt: string;  
} 

export interface MaterialTopic {
  id: string;
  material_id: string;
  name: string;
  description?: string;
  concept_summary?: string;
  created_at: string;
}

export interface GeneratedQuestion {
  id: string;
  material_id: string;
  topic_name: string;
  question_text: string;
  question_type: 'mcq' | 'multiple_correct' | 'true_false' | 'short_answer';
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'Draft' | 'Approved' | 'Rejected';
  assignment_id?: string;
  created_at: string;
  updated_at: string;
}

export interface LearningMaterial {
  id: string;
  classroom_id: string;
  title: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  extracted_text?: string;
  processing_status: 'Uploading' | 'Processing' | 'Extracting Content' | 'Identifying Topics' | 'Ready' | 'Failed';
  error_message?: string;
  topic_count?: number;
  question_count?: number;
  approved_question_count?: number;
  topics?: MaterialTopic[];
  created_at: string;
  updated_at: string;
}
