export type UserRole = "teacher" | "student" | "admin";

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
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
