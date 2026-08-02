import { query } from '../../config/database';

export interface ActivityData {
  student_id: string;
  classroom_id: string;
  language?: string;
  status?: string;
  current_file?: string;
  errors?: any[];
  metadata?: any;
}

/**
 * Record a new student activity event
 */
export const recordActivity = async (data: ActivityData) => {
  const result = await query(
    `INSERT INTO student_activity (student_id, classroom_id, language, status, current_file, errors, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      data.student_id,
      data.classroom_id,
      data.language || null,
      data.status || 'online',
      data.current_file || null,
      data.errors ? JSON.stringify(data.errors) : null,
      data.metadata ? JSON.stringify(data.metadata) : null,
    ]
  );
  return result.rows[0];
};

/**
 * Get the latest activity for each student in a classroom
 */
export const getLatestActivityByClassroom = async (classroomId: string) => {
  const result = await query(
    `SELECT DISTINCT ON (sa.student_id)
       sa.student_id,
       u.display_name,
       u.email,
       sa.language,
       sa.status,
       sa.current_file,
       sa.errors,
       sa.timestamp
     FROM student_activity sa
     JOIN users u ON sa.student_id = u.id
     WHERE sa.classroom_id = $1
     ORDER BY sa.student_id, sa.timestamp DESC`,
    [classroomId]
  );
  return result.rows;
};

/**
 * Get history of activities for a specific student in a classroom
 */
export const getActivityHistory = async (studentId: string, classroomId: string, limit: number = 50) => {
  const result = await query(
    `SELECT * FROM student_activity
     WHERE student_id = $1 AND classroom_id = $2
     ORDER BY timestamp DESC
     LIMIT $3`,
    [studentId, classroomId, limit]
  );
  return result.rows;
};
