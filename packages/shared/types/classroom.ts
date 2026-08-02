// ============================================
// Shared Classroom Types
// ============================================

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
  classroomId: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  joinedAt: string;
}

export interface CreateClassroomRequest {
  name: string;
  description?: string;
}

export interface JoinClassroomRequest {
  joinCode: string;
}
