import path from 'path';
import { query } from '../../config/database';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import mammoth from 'mammoth';
const pdfParse = require('pdf-parse');

const questionSchema = z.object({
  question: z.string().min(3),
  type: z.enum(['mcq', 'multiple_correct', 'true_false', 'short_answer']).default('mcq'),
  options: z.array(z.string()).optional().default([]),
  correctAnswer: z.string().min(1),
  explanation: z.string().optional().default(''),
  topic: z.string().optional().default('General'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).default('Medium'),
});

export const learningMaterialsService = {
  /**
   * Save uploaded material and trigger background processing
   */
  async createMaterial(classroomId: string, file: Express.Multer.File) {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.pdf', '.docx'];
    if (!allowed.includes(ext)) {
      throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
    }

    const title = path.basename(file.originalname, ext);
    const result = await query(
      `INSERT INTO learning_materials 
        (classroom_id, title, file_name, file_path, file_type, file_size, processing_status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Processing')
       RETURNING *`,
      [classroomId, title, file.originalname, `memory://${file.originalname}`, file.mimetype || ext.slice(1), file.size]
    );

    const material = result.rows[0];

    // Process using the in-memory buffer directly (no disk I/O needed)
    const buffer = file.buffer;
    setImmediate(() => {
      this.processMaterial(material.id, buffer, ext).catch((err) => {
        console.error(`Error processing material ${material.id}:`, err);
      });
    });

    return material;
  },

  /**
   * Extract text and identify core topics using AI
   */
  async processMaterial(materialId: string, buffer: Buffer, ext: string) {
    try {
      await query(
        `UPDATE learning_materials SET processing_status = 'Extracting Content' WHERE id = $1`,
        [materialId]
      );

      let extractedText = '';

      if (ext === '.pdf') {
        try {
          const parsed = await pdfParse(buffer);
          extractedText = parsed.text || '';
        } catch (pdfErr: any) {
          console.error(`pdf-parse failed for material ${materialId}:`, pdfErr.message);
          // Fallback: try to extract any readable text from the buffer
          const rawText = buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s{3,}/g, ' ').trim();
          if (rawText.length > 50) {
            extractedText = rawText;
          } else {
            throw new Error('Could not extract text from this PDF. It may be image-based or encrypted.');
          }
        }
      } else if (ext === '.docx') {
        const parsed = await mammoth.extractRawText({ buffer });
        extractedText = parsed.value || '';
      }

      extractedText = extractedText.trim();
      if (!extractedText || extractedText.length < 20) {
        throw new Error('Unable to extract readable text from this document. It may be image-based, empty, or encrypted.');
      }

      await query(
        `UPDATE learning_materials 
         SET extracted_text = $1, processing_status = 'Identifying Topics' 
         WHERE id = $2`,
        [extractedText, materialId]
      );

      // Extract topics using Gemini
      const topics = await this.extractTopicsWithAI(extractedText);

      // Insert topics into material_topics
      for (const t of topics) {
        await query(
          `INSERT INTO material_topics (material_id, name, description, concept_summary)
           VALUES ($1, $2, $3, $4)`,
          [materialId, t.name, t.description || '', t.conceptSummary || '']
        );
      }

      await query(
        `UPDATE learning_materials 
         SET processing_status = 'Ready', error_message = NULL, updated_at = NOW() 
         WHERE id = $1`,
        [materialId]
      );
    } catch (err: any) {
      const errorMsg = err.message || 'Unknown processing error';
      console.error(`Failed to process material ${materialId}:`, errorMsg, err.stack);
      await query(
        `UPDATE learning_materials 
         SET processing_status = 'Failed', 
             error_message = $1, 
             updated_at = NOW() 
         WHERE id = $2`,
        [errorMsg, materialId]
      );
    }
  },

  /**
   * Extract 4 to 8 key topics/concepts from extracted text
   */
  async extractTopicsWithAI(text: string): Promise<Array<{ name: string; description: string; conceptSummary: string }>> {
    const textSnippet = text.slice(0, 12000);

    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `You are an educational curriculum architect. Analyze the following learning material and extract 4 to 8 distinct, key concepts or topics covered in the text.
Return ONLY a valid JSON array of objects with the exact schema:
[
  {
    "name": "<Short topic title, 1-4 words>",
    "description": "<1-2 sentence description of this concept>",
    "conceptSummary": "<Key formula, definition, or summary from the text>"
  }
]

Do not include markdown or backticks. Return raw JSON.
Material text:
${textSnippet}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: prompt,
        });

        let responseText = response.text || '';
        const start = responseText.indexOf('[');
        const end = responseText.lastIndexOf(']');
        if (start !== -1 && end !== -1) {
          responseText = responseText.substring(start, end + 1);
          const parsed = JSON.parse(responseText);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((item: any) => ({
              name: String(item.name || 'Concept').trim(),
              description: String(item.description || ''),
              conceptSummary: String(item.conceptSummary || ''),
            }));
          }
        }
      } catch (err) {
        console.warn('Gemini topic extraction failed, falling back to heuristic parsing:', err);
      }
    }

    // Heuristic fallback if Gemini is not available or errors
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 3 && l.length < 50);
    const candidateTopics = Array.from(new Set(lines)).slice(0, 6);
    if (candidateTopics.length >= 2) {
      return candidateTopics.map((topic, idx) => ({
        name: topic.replace(/^[0-9.\-*\s]+/, ''),
        description: `Key concept identified in document section ${idx + 1}.`,
        conceptSummary: `Found in core curriculum material.`,
      }));
    }

    return [
      { name: 'Core Principles', description: 'Fundamental theory and foundations', conceptSummary: 'Introduced in opening sections.' },
      { name: 'Key Concepts & Definitions', description: 'Essential definitions and terminology', conceptSummary: 'Found throughout the document.' },
      { name: 'Methodologies & Procedures', description: 'Practical processes and step-by-step techniques', conceptSummary: 'Key procedures outlined in text.' },
      { name: 'Applications & Case Studies', description: 'Real-world problem solving and applications', conceptSummary: 'Demonstrated in exercises.' },
    ];
  },

  /**
   * Get all materials for a classroom with topic and question counts
   */
  async getMaterialsByClassroom(classroomId: string) {
    const result = await query(
      `SELECT lm.*,
        COUNT(DISTINCT mt.id)::int AS topic_count,
        COUNT(DISTINCT gq.id)::int AS question_count,
        COUNT(DISTINCT CASE WHEN gq.status = 'Approved' THEN gq.id END)::int AS approved_question_count
       FROM learning_materials lm
       LEFT JOIN material_topics mt ON mt.material_id = lm.id
       LEFT JOIN generated_questions gq ON gq.material_id = lm.id
       WHERE lm.classroom_id = $1
       GROUP BY lm.id
       ORDER BY lm.created_at DESC`,
      [classroomId]
    );
    return result.rows;
  },

  /**
   * Get single material with topics
   */
  async getMaterialById(id: string) {
    const matResult = await query(
      `SELECT lm.*,
        COUNT(DISTINCT mt.id)::int AS topic_count,
        COUNT(DISTINCT gq.id)::int AS question_count
       FROM learning_materials lm
       LEFT JOIN material_topics mt ON mt.material_id = lm.id
       LEFT JOIN generated_questions gq ON gq.material_id = lm.id
       WHERE lm.id = $1
       GROUP BY lm.id`,
      [id]
    );

    if (matResult.rows.length === 0) return null;
    const material = matResult.rows[0];

    const topicsResult = await query(
      `SELECT * FROM material_topics WHERE material_id = $1 ORDER BY created_at ASC`,
      [id]
    );

    return {
      ...material,
      topics: topicsResult.rows,
    };
  },

  /**
   * Delete material and associated file
   */
  async deleteMaterial(id: string) {
    await query(`DELETE FROM learning_materials WHERE id = $1`, [id]);
    return { success: true };
  },

  /**
   * Generate structured questions from material using Gemini
   */
  async generateQuestions(materialId: string, config: {
    topics?: string[];
    questionType?: string; // 'mcq', 'multiple_correct', 'true_false', 'short_answer', 'mixed'
    difficulty?: string; // 'Easy', 'Medium', 'Hard', 'Mixed'
    count?: number;
    includeExplanations?: boolean;
  }) {
    const mat = await this.getMaterialById(materialId);
    if (!mat) throw new Error('Material not found');
    if (!mat.extracted_text) throw new Error('Material has no extracted content yet. Please wait until ready.');

    const count = Math.min(Math.max(config.count || 10, 1), 25);
    const selectedTopics = config.topics && config.topics.length > 0
      ? config.topics
      : (mat.topics || []).map((t: any) => t.name);
    const questionType = config.questionType || 'mixed';
    const difficulty = config.difficulty || 'Mixed';

    const textSnippet = mat.extracted_text.slice(0, 14000);

    let rawQuestions: any[] = [];

    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `You are a high-level academic assessment generator for MentorX. 
Generate exactly ${count} structured assessment questions based STRICTLY on the extracted document content below.

SOURCE DOCUMENT CONTENT:
"""
${textSnippet}
"""

TARGET SPECIFICATIONS:
- Allowed Topics: ${selectedTopics.join(', ')}
- Question Type: ${questionType} (if 'mixed', include a diverse blend of mcq, multiple_correct, true_false, and short_answer)
- Difficulty Level: ${difficulty} (if 'Mixed', distribute evenly across Easy, Medium, and Hard)
- Include Explanations: ${config.includeExplanations !== false ? 'Yes' : 'No'}

STRICT SCHEMA RULES:
1. Return ONLY a valid JSON array of objects. No markdown formatting, no commentary.
2. For each question object:
   - "question": string
   - "type": "mcq" | "multiple_correct" | "true_false" | "short_answer"
   - "options": array of strings (e.g. ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"] for mcq and multiple_correct; ["True", "False"] for true_false; [] for short_answer)
   - "correctAnswer": string (e.g., "A" or "B. Full Option" for mcq; "A, C" for multiple_correct; "True" or "False" for true_false; the exact answer text for short_answer)
   - "explanation": string (explain why the answer is correct referencing the text)
   - "topic": string (one of the selected topics: ${selectedTopics.join(', ')})
   - "difficulty": "Easy" | "Medium" | "Hard"

Output format:
[
  {
    "question": "What is...",
    "type": "mcq",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correctAnswer": "A",
    "explanation": "According to the document...",
    "topic": "${selectedTopics[0] || 'Core'}",
    "difficulty": "Easy"
  }
]`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: prompt,
        });

        let responseText = response.text || '';
        const start = responseText.indexOf('[');
        const end = responseText.lastIndexOf(']');
        if (start !== -1 && end !== -1) {
          responseText = responseText.substring(start, end + 1);
          rawQuestions = JSON.parse(responseText);
        }
      } catch (err) {
        console.error('Gemini question generation error:', err);
      }
    }

    // Fallback if AI response was empty or malformed
    if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
      rawQuestions = this.generateFallbackQuestions(selectedTopics, count, difficulty, questionType);
    }

    // Validate and insert each question into generated_questions table
    const savedQuestions = [];
    for (const q of rawQuestions) {
      try {
        const validated = questionSchema.parse(q);
        const res = await query(
          `INSERT INTO generated_questions 
            (material_id, topic_name, question_text, question_type, options, correct_answer, explanation, difficulty, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Draft')
           RETURNING *`,
          [
            materialId,
            validated.topic,
            validated.question,
            validated.type,
            JSON.stringify(validated.options || []),
            validated.correctAnswer,
            validated.explanation || '',
            validated.difficulty,
          ]
        );
        savedQuestions.push(res.rows[0]);
      } catch (validationErr) {
        console.warn('Skipping question that failed schema validation:', validationErr);
      }
    }

    return savedQuestions;
  },

  /**
   * Fallback question generator when external AI is unavailable
   */
  generateFallbackQuestions(topics: string[], count: number, difficulty: string, questionType: string) {
    const list = [];
    const diffs = ['Easy', 'Medium', 'Hard'];

    for (let i = 0; i < count; i++) {
      const topic = topics[i % topics.length] || 'Core Concept';
      const curDiff = difficulty === 'Mixed' ? diffs[i % 3] : difficulty;
      const curType = questionType === 'mixed' ? (i % 3 === 0 ? 'mcq' : i % 3 === 1 ? 'true_false' : 'multiple_correct') : questionType;

      if (curType === 'true_false') {
        list.push({
          question: `Regarding ${topic}, this fundamental principle directly influences the overall outcome described in the study material.`,
          type: 'true_false',
          options: ['True', 'False'],
          correctAnswer: 'True',
          explanation: `This statement aligns with the foundational principles of ${topic} outlined in the material.`,
          topic,
          difficulty: curDiff,
        });
      } else if (curType === 'multiple_correct') {
        list.push({
          question: `Which of the following aspects are critical components of ${topic}?`,
          type: 'multiple_correct',
          options: [
            `A. Foundational definition and structure`,
            `B. Arbitrary unrelated factor`,
            `C. Practical verification and implementation`,
            `D. Systematic performance evaluation`
          ],
          correctAnswer: 'A, C, D',
          explanation: `A, C, and D are valid characteristics of ${topic} detailed in the learning material.`,
          topic,
          difficulty: curDiff,
        });
      } else if (curType === 'short_answer') {
        list.push({
          question: `In one or two words, state the primary metric associated with ${topic}.`,
          type: 'short_answer',
          options: [],
          correctAnswer: topic,
          explanation: `The material defines ${topic} as the primary focal area.`,
          topic,
          difficulty: curDiff,
        });
      } else {
        list.push({
          question: `Which of the following best defines the primary objective of ${topic}?`,
          type: 'mcq',
          options: [
            `A. Establishing core principles and accurate measurements`,
            `B. Disregarding systemic variances`,
            `C. Minimizing verifiable performance outcomes`,
            `D. Completely replacing standard protocols`
          ],
          correctAnswer: 'A',
          explanation: `Option A accurately captures the primary role of ${topic} based on the document text.`,
          topic,
          difficulty: curDiff,
        });
      }
    }
    return list;
  },

  /**
   * Get all generated questions for a material
   */
  async getQuestions(materialId: string) {
    const result = await query(
      `SELECT * FROM generated_questions WHERE material_id = $1 ORDER BY created_at ASC`,
      [materialId]
    );
    return result.rows;
  },

  /**
   * Update question content
   */
  async updateQuestion(id: string, data: any) {
    const result = await query(
      `UPDATE generated_questions
       SET question_text = COALESCE($1, question_text),
           options = COALESCE($2, options),
           correct_answer = COALESCE($3, correct_answer),
           explanation = COALESCE($4, explanation),
           topic_name = COALESCE($5, topic_name),
           difficulty = COALESCE($6, difficulty),
           status = COALESCE($7, status),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        data.questionText || data.question_text || null,
        data.options ? JSON.stringify(data.options) : null,
        data.correctAnswer || data.correct_answer || null,
        data.explanation !== undefined ? data.explanation : null,
        data.topicName || data.topic_name || null,
        data.difficulty || null,
        data.status || null,
        id,
      ]
    );
    return result.rows[0];
  },

  /**
   * Regenerate ONLY a single question
   */
  async regenerateQuestion(questionId: string) {
    const qResult = await query(`SELECT * FROM generated_questions WHERE id = $1`, [questionId]);
    if (qResult.rows.length === 0) throw new Error('Question not found');
    const oldQ = qResult.rows[0];

    const mat = await this.getMaterialById(oldQ.material_id);
    if (!mat || !mat.extracted_text) throw new Error('Source material text unavailable');

    const topic = oldQ.topic_name || 'General';
    const difficulty = oldQ.difficulty || 'Medium';
    const type = oldQ.question_type || 'mcq';
    const textSnippet = mat.extracted_text.slice(0, 10000);

    let newQ: any = null;

    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `Based strictly on the following text, generate ONE new and distinct educational assessment question.
It MUST be different from this previous question: "${oldQ.question_text}".

SOURCE TEXT:
${textSnippet}

REQUIREMENTS:
- Topic: ${topic}
- Question Type: ${type}
- Difficulty: ${difficulty}

Return ONLY a valid JSON object (no markdown, no arrays):
{
  "question": "...",
  "type": "${type}",
  "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "correctAnswer": "...",
  "explanation": "...",
  "topic": "${topic}",
  "difficulty": "${difficulty}"
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: prompt,
        });

        let responseText = response.text || '';
        const start = responseText.indexOf('{');
        const end = responseText.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
          newQ = JSON.parse(responseText.substring(start, end + 1));
        }
      } catch (err) {
        console.error('Gemini single question regeneration error:', err);
      }
    }

    if (!newQ || !newQ.question) {
      const fallback = this.generateFallbackQuestions([topic], 1, difficulty, type)[0];
      newQ = fallback;
      newQ.question = `[Updated] ${fallback.question}`;
    }

    const validated = questionSchema.parse(newQ);
    const updated = await query(
      `UPDATE generated_questions
       SET question_text = $1,
           question_type = $2,
           options = $3,
           correct_answer = $4,
           explanation = $5,
           topic_name = $6,
           difficulty = $7,
           status = 'Draft',
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        validated.question,
        validated.type,
        JSON.stringify(validated.options || []),
        validated.correctAnswer,
        validated.explanation || '',
        validated.topic,
        validated.difficulty,
        questionId,
      ]
    );

    return updated.rows[0];
  },

  /**
   * Delete a question
   */
  async deleteQuestion(id: string) {
    await query(`DELETE FROM generated_questions WHERE id = $1`, [id]);
    return { success: true };
  },

  /**
   * Convert approved questions into a Quiz Assignment in the existing assignment system
   */
  async createQuizAssignment(classroomId: string, materialId: string, data: {
    title?: string;
    description?: string;
    timeLimitMinutes?: number;
    marks?: number;
    questionIds?: string[];
  }) {
    const mat = await this.getMaterialById(materialId);
    if (!mat) throw new Error('Material not found');

    // Get approved questions for this material
    let questionsQuery = `SELECT * FROM generated_questions WHERE material_id = $1 AND status = 'Approved'`;
    let queryParams: any[] = [materialId];

    if (data.questionIds && data.questionIds.length > 0) {
      questionsQuery += ` AND id = ANY($2)`;
      queryParams.push(data.questionIds);
    }

    const qResult = await query(questionsQuery, queryParams);
    const approvedQuestions = qResult.rows;

    if (approvedQuestions.length === 0) {
      throw new Error('No approved questions found. Please approve at least one question before creating a quiz.');
    }

    const title = data.title || `${mat.title} — Quiz`;
    const description = data.description || `Assessment generated from "${mat.title}". Complete all questions before the timer expires.`;
    const marks = data.marks || approvedQuestions.length * 2;
    const timeLimitMinutes = data.timeLimitMinutes || Math.max(approvedQuestions.length * 2, 10);
    const concepts = Array.from(new Set(approvedQuestions.map((q: any) => q.topic_name).filter(Boolean)));

    // Insert into existing assignments table
    const assignResult = await query(
      `INSERT INTO assignments 
        (classroom_id, title, description, language, difficulty, marks, time_limit_minutes, concepts_covered, is_published, assignment_type, source_material_id, total_questions)
       VALUES ($1, $2, $3, 'Quiz', 'Medium', $4, $5, $6, false, 'quiz', $7, $8)
       RETURNING *`,
      [
        classroomId,
        title,
        description,
        marks,
        timeLimitMinutes,
        concepts,
        materialId,
        approvedQuestions.length,
      ]
    );

    const assignment = assignResult.rows[0];

    // Associate the questions with the new assignment
    const questionIds = approvedQuestions.map((q: any) => q.id);
    await query(
      `UPDATE generated_questions SET assignment_id = $1 WHERE id = ANY($2)`,
      [assignment.id, questionIds]
    );

    return {
      assignment,
      questionCount: approvedQuestions.length,
    };
  },

  /**
   * Get questions for an assignment quiz
   */
  async getQuestionsByAssignmentId(assignmentId: string, hideCorrectAnswers: boolean = false) {
    const result = await query(
      `SELECT id, question_text, question_type, options, topic_name, difficulty
        ${hideCorrectAnswers ? '' : ', correct_answer, explanation'}
       FROM generated_questions
       WHERE assignment_id = $1
       ORDER BY created_at ASC`,
      [assignmentId]
    );
    return result.rows;
  },
};
