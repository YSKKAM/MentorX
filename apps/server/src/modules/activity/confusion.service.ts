import { query } from '../../config/database';
import { GoogleGenAI } from '@google/genai';

export interface ConfusionAlert {
  errorType: string;
  count: number;
  affectedStudents: { id: string; name: string }[];
  aiSuggestion: string;
}

const suggestionCache: Record<string, { suggestion: string; timestamp: number }> = {};

export const getConfusionAlertsForClassroom = async (classroomId: string): Promise<ConfusionAlert[]> => {
  const sql = `
    SELECT 
      sa.student_id,
      u.display_name,
      sa.errors
    FROM student_activity sa
    JOIN users u ON sa.student_id = u.id
    WHERE sa.classroom_id = $1 
      AND sa.errors IS NOT NULL 
      AND sa.timestamp > NOW() - INTERVAL '15 minutes'
    ORDER BY sa.timestamp DESC;
  `;

  const result = await query(sql, [classroomId]);
  const errorMap: Record<string, { count: number; students: Map<string, string> }> = {};

  result.rows.forEach((row: any) => {
    let errors: any[] = [];
    try {
      errors = typeof row.errors === 'string' ? JSON.parse(row.errors) : row.errors;
    } catch (e) {
      errors = [];
    }

    if (!Array.isArray(errors)) return;

    errors.forEach((err: any) => {
      const msg = (err?.message || err || '').toString();
      if (!msg) return;

      let category = 'Syntax Error';
      const lower = msg.toLowerCase();

      if (lower.includes('cannot find symbol') || lower.includes('undefined variable') || lower.includes('not defined')) {
        category = 'Missing Variable / Symbol';
      } else if (lower.includes('arrayindexoutofbounds') || lower.includes('index out of range')) {
        category = 'Array Index Out of Bounds';
      } else if (lower.includes('nullpointer') || lower.includes('none type') || lower.includes('cannot read property of null')) {
        category = 'Null Pointer Dereference';
      } else if (lower.includes('incompatible types') || lower.includes('type mismatch') || lower.includes('cannot convert')) {
        category = 'Type Mismatch';
      } else if (lower.includes('expected') || lower.includes('semicolon')) {
        category = 'Syntax & Semicolon Missing';
      }

      if (!errorMap[category]) {
        errorMap[category] = { count: 0, students: new Map() };
      }
      errorMap[category].count += 1;
      errorMap[category].students.set(row.student_id, row.display_name || 'Student');
    });
  });

  const alerts: ConfusionAlert[] = [];

  for (const [category, data] of Object.entries(errorMap)) {
    if (data.students.size >= 1) {
      let suggestion = 'Review code structure and check syntax.';

      const cached = suggestionCache[category];
      if (cached && Date.now() - cached.timestamp < 1000 * 60 * 10) {
        suggestion = cached.suggestion;
      } else if (process.env.GEMINI_API_KEY) {
        try {
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          const response = await ai.models.generateContent({
            model: 'gemini-flash-latest',
            contents: `You are an expert computer science teacher mentor. Multiple students are stuck on the following compiler/runtime error category: "${category}". Provide a 1-2 sentence actionable instruction for the teacher to quickly announce to the class to resolve this confusion.`,
          });
          if (response.text) {
            suggestion = response.text.trim();
            suggestionCache[category] = { suggestion, timestamp: Date.now() };
          }
        } catch (err) {
          console.warn('Gemini API confusion suggestion error:', err);
        }
      }

      alerts.push({
        errorType: category,
        count: data.students.size,
        affectedStudents: Array.from(data.students.entries()).map(([id, name]) => ({ id, name })),
        aiSuggestion: suggestion,
      });
    }
  }

  alerts.sort((a, b) => b.count - a.count);
  return alerts;
};
