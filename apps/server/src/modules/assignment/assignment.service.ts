import { query } from '../../config/database';

export const assignmentService = {
  async createAssignment(classroomId: string, data: any) {
    const result = await query(
      `INSERT INTO assignments (classroom_id, title, description, language, difficulty, marks, time_limit_minutes, due_date, concepts_covered)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [classroomId, data.title, data.description, data.language, data.difficulty, data.marks, data.timeLimitMinutes || null, data.dueDate ? data.dueDate : null, data.conceptsCovered || []]
    );
    const assignment = result.rows[0];

    // Insert visible test cases
    if (data.visibleTestCases && data.visibleTestCases.length > 0) {
      for (const tc of data.visibleTestCases) {
        await query(
          `INSERT INTO assignment_test_cases (assignment_id, input, expected_output, is_hidden) VALUES ($1, $2, $3, false)`,
          [assignment.id, tc.input, tc.expectedOutput]
        );
      }
    }

    // Insert hidden test cases
    if (data.hiddenTestCases && data.hiddenTestCases.length > 0) {
      for (const tc of data.hiddenTestCases) {
        await query(
          `INSERT INTO assignment_test_cases (assignment_id, input, expected_output, is_hidden) VALUES ($1, $2, $3, true)`,
          [assignment.id, tc.input, tc.expectedOutput]
        );
      }
    }

    // Insert hints
    if (data.hints && data.hints.length > 0) {
      for (const hint of data.hints) {
        await query(
          `INSERT INTO assignment_hints (assignment_id, level, hint_text) VALUES ($1, $2, $3)`,
          [assignment.id, hint.level, hint.text]
        );
      }
    }

    return this.getAssignmentById(assignment.id);
  },

  async updateAssignment(assignmentId: string, data: any) {
    await query(
      `UPDATE assignments 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           language = COALESCE($3, language),
           difficulty = COALESCE($4, difficulty),
           marks = COALESCE($5, marks),
           time_limit_minutes = COALESCE($6, time_limit_minutes),
           due_date = COALESCE($7, due_date),
           concepts_covered = COALESCE($8, concepts_covered),
           updated_at = NOW()
       WHERE id = $9`,
      [
        data.title || null,
        data.description || null,
        data.language || null,
        data.difficulty || null,
        data.marks || null,
        data.timeLimitMinutes || null,
        data.dueDate || null,
        data.conceptsCovered || null,
        assignmentId
      ]
    );

    if (data.visibleTestCases || data.hiddenTestCases) {
      await query(`DELETE FROM assignment_test_cases WHERE assignment_id = $1`, [assignmentId]);
      if (data.visibleTestCases && data.visibleTestCases.length > 0) {
        for (const tc of data.visibleTestCases) {
          await query(
            `INSERT INTO assignment_test_cases (assignment_id, input, expected_output, is_hidden) VALUES ($1, $2, $3, false)`,
            [assignmentId, tc.input, tc.expectedOutput]
          );
        }
      }
      if (data.hiddenTestCases && data.hiddenTestCases.length > 0) {
        for (const tc of data.hiddenTestCases) {
          await query(
            `INSERT INTO assignment_test_cases (assignment_id, input, expected_output, is_hidden) VALUES ($1, $2, $3, true)`,
            [assignmentId, tc.input, tc.expectedOutput]
          );
        }
      }
    }

    return this.getAssignmentById(assignmentId);
  },

  async publishAssignment(assignmentId: string) {
    await query(`UPDATE assignments SET is_published = true WHERE id = $1`, [assignmentId]);
    return { success: true };
  },

  async getAssignmentsByClassroom(classroomId: string) {
    const result = await query(
      `SELECT * FROM assignments WHERE classroom_id = $1 ORDER BY created_at DESC`,
      [classroomId]
    );
    return result.rows;
  },

  async deleteAssignment(assignmentId: string) {
    await query(`DELETE FROM assignments WHERE id = $1`, [assignmentId]);
    return { success: true };
  },

  async getAssignmentById(assignmentId: string) {
    const assignResult = await query(`SELECT * FROM assignments WHERE id = $1`, [assignmentId]);
    if (assignResult.rows.length === 0) return null;
    const assignment = assignResult.rows[0];

    const testCasesResult = await query(`SELECT id, input, expected_output, is_hidden FROM assignment_test_cases WHERE assignment_id = $1 ORDER BY created_at ASC`, [assignmentId]);
    const hintsResult = await query(`SELECT level, hint_text FROM assignment_hints WHERE assignment_id = $1 ORDER BY level ASC`, [assignmentId]);

    return {
      ...assignment,
      testCases: testCasesResult.rows,
      hints: hintsResult.rows
    };
  },

  async createSubmission(assignmentId: string, studentId: string, language: string, sourceCode: string) {
    const result = await query(
      `INSERT INTO assignment_submissions (assignment_id, student_id, language, source_code, status)
       VALUES ($1, $2, $3, $4, 'Pending')
       RETURNING *`,
      [assignmentId, studentId, language, sourceCode]
    );
    return result.rows[0];
  },

  async updateSubmissionStatus(submissionId: string, status: string, score: number, execTime: number, memoryKb: number) {
    await query(
      `UPDATE assignment_submissions SET status = $1, score = $2, execution_time_ms = $3, memory_used_kb = $4 WHERE id = $5`,
      [status, score, execTime, memoryKb, submissionId]
    );
  },

  async saveSubmissionResult(submissionId: string, testCaseId: string, passed: boolean, actualOutput: string) {
    await query(
      `INSERT INTO submission_results (submission_id, test_case_id, passed, actual_output) VALUES ($1, $2, $3, $4)`,
      [submissionId, testCaseId, passed, actualOutput]
    );
  },

  async saveAIRecommendation(assignmentId: string, studentId: string, text: string, gap: string) {
    await query(
      `INSERT INTO ai_recommendations (assignment_id, student_id, recommendation_text, concept_gap) VALUES ($1, $2, $3, $4)`,
      [assignmentId, studentId, text, gap]
    );
  },

  async getAnalytics(assignmentId: string) {
    const submissions = await query(
      `SELECT s.*, u.display_name as student_name
       FROM assignment_submissions s
       JOIN users u ON s.student_id = u.id
       WHERE s.assignment_id = $1 ORDER BY s.submitted_at DESC`,
      [assignmentId]
    );
    
    const recommendations = await query(
      `SELECT r.*, u.display_name as student_name
       FROM ai_recommendations r
       JOIN users u ON r.student_id = u.id
       WHERE r.assignment_id = $1`,
      [assignmentId]
    );

    return {
      submissions: submissions.rows,
      recommendations: recommendations.rows
    };
  }
};
