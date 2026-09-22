import { query } from '../../config/database';
import crypto from 'crypto';

async function generateJoinCode(): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  while (true) {
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const result = await query('SELECT 1 FROM classrooms WHERE join_code = $1', [code]);
    if (result.rows.length === 0) {
      return code;
    }
  }
}

export const classroomService = {
  async createClassroom(teacherId: string, name: string, description?: string) {
    const joinCode = await generateJoinCode();
    const result = await query(
      `INSERT INTO classrooms (teacher_id, name, description, join_code)
       VALUES ($1, $2, $3, $4)
       RETURNING id, teacher_id, name, description, join_code, created_at, updated_at`,
      [teacherId, name, description || '', joinCode]
    );
    return result.rows[0];
  },

  async getClassroomsByTeacher(teacherId: string) {
    const result = await query(
      `SELECT c.*, COUNT(cs.student_id) as student_count
       FROM classrooms c
       LEFT JOIN classroom_students cs ON c.id = cs.classroom_id
       WHERE c.teacher_id = $1
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [teacherId]
    );
    return result.rows;
  },

  async getClassroomsByStudent(studentId: string) {
    const result = await query(
      `SELECT c.*, u.display_name as teacher_name
       FROM classrooms c
       JOIN classroom_students cs ON c.id = cs.classroom_id
       JOIN users u ON c.teacher_id = u.id
       WHERE cs.student_id = $1
       ORDER BY c.created_at DESC`,
      [studentId]
    );
    return result.rows;
  },

  async getClassroomById(classroomId: string) {
    const classroomResult = await query(
      `SELECT * FROM classrooms WHERE id = $1`,
      [classroomId]
    );
    if (classroomResult.rows.length === 0) return null;

    const studentsResult = await query(
      `SELECT u.id, u.display_name, u.email, cs.joined_at
       FROM classroom_students cs
       JOIN users u ON cs.student_id = u.id
       WHERE cs.classroom_id = $1
       ORDER BY cs.joined_at DESC`,
      [classroomId]
    );

    return {
      ...classroomResult.rows[0],
      students: studentsResult.rows
    };
  },

  async joinClassroom(studentId: string, joinCode: string) {
    const classroomResult = await query(
      `SELECT id FROM classrooms WHERE join_code = $1`,
      [joinCode]
    );
    if (classroomResult.rows.length === 0) {
      return { error: 'NOT_FOUND', message: 'Classroom not found' };
    }
    const classroomId = classroomResult.rows[0].id;

    const enrolledResult = await query(
      `SELECT 1 FROM classroom_students WHERE classroom_id = $1 AND student_id = $2`,
      [classroomId, studentId]
    );
    if (enrolledResult.rows.length > 0) {
      return { error: 'ALREADY_ENROLLED', message: 'Already enrolled in this classroom' };
    }

    await query(
      `INSERT INTO classroom_students (classroom_id, student_id) VALUES ($1, $2)`,
      [classroomId, studentId]
    );
    
    return { success: true, classroomId };
  },

  async deleteClassroom(classroomId: string) {
    await query(
      `DELETE FROM classrooms WHERE id = $1`,
      [classroomId]
    );
    return { success: true };
  },

  async updateStrictMode(classroomId: string, settings: {
    strict_mode_enabled?: boolean;
    block_paste?: boolean;
    block_copy?: boolean;
    block_cut?: boolean;
    record_restricted_events?: boolean;
  }) {
    const result = await query(
      `UPDATE classrooms
       SET strict_mode_enabled = COALESCE($2, strict_mode_enabled),
           block_paste = COALESCE($3, block_paste),
           block_copy = COALESCE($4, block_copy),
           block_cut = COALESCE($5, block_cut),
           record_restricted_events = COALESCE($6, record_restricted_events),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, strict_mode_enabled, block_paste, block_copy, block_cut, record_restricted_events`,
      [
        classroomId,
        settings.strict_mode_enabled !== undefined ? settings.strict_mode_enabled : null,
        settings.block_paste !== undefined ? settings.block_paste : null,
        settings.block_copy !== undefined ? settings.block_copy : null,
        settings.block_cut !== undefined ? settings.block_cut : null,
        settings.record_restricted_events !== undefined ? settings.record_restricted_events : null,
      ]
    );
    return result.rows[0];
  }
};
