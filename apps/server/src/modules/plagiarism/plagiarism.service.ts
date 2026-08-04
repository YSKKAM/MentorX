import { query } from '../../config/database';

export interface PlagiarismPairResult {
  studentA: { id: string; name: string; submissionId: string; code: string };
  studentB: { id: string; name: string; submissionId: string; code: string };
  similarity: number; // 0 to 100
  level: 'HIGH' | 'MEDIUM' | 'CLEAN';
  matchedLinesA: number[];
  matchedLinesB: number[];
}

/**
 * Tokenize and canonicalize source code to its Abstract Structural form
 */
export const tokenizeAST = (code: string): string[] => {
  let cleaned = code
    .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '') // remove comments
    .replace(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g, 'STR_LIT') // normalize strings
    .replace(/\b\d+(\.\d+)?\b/g, 'NUM_LIT'); // normalize numbers

  // Map user identifiers to canonical token stream
  const varMap = new Map<string, string>();
  let varCounter = 1;

  const keywords = new Set([
    'public', 'class', 'static', 'void', 'main', 'string', 'int', 'double', 'float', 'boolean',
    'if', 'else', 'for', 'while', 'return', 'import', 'def', 'function', 'const', 'let', 'var',
    'new', 'true', 'false', 'null', 'sys', 'println', 'print', 'package'
  ]);

  const rawTokens = cleaned.match(/[a-zA-Z_]\w*|[^\s\w]/g) || [];
  const canonicalTokens: string[] = [];

  for (const token of rawTokens) {
    const lower = token.toLowerCase();
    if (keywords.has(lower) || /^[^\w]$/.test(token) || token === 'STR_LIT' || token === 'NUM_LIT') {
      canonicalTokens.push(token);
    } else {
      if (!varMap.has(token)) {
        varMap.set(token, `VAR_${varCounter++}`);
      }
      canonicalTokens.push(varMap.get(token)!);
    }
  }

  return canonicalTokens;
};

/**
 * Generate 5-gram fingerprints from canonical tokens
 */
export const generateFingerprints = (tokens: string[]): Set<string> => {
  const n = 5;
  const set = new Set<string>();
  for (let i = 0; i <= tokens.length - n; i++) {
    const gram = tokens.slice(i, i + n).join('_');
    set.add(gram);
  }
  return set;
};

/**
 * Compute Jaccard similarity score between two fingerprint sets
 */
export const calculateJaccardSimilarity = (setA: Set<string>, setB: Set<string>): number => {
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const gram of setA) {
    if (setB.has(gram)) intersection++;
  }

  const union = setA.size + setB.size - intersection;
  return union > 0 ? Math.round((intersection / union) * 100) : 0;
};

/**
 * Perform full AST structural plagiarism check across all submissions for an assignment
 */
export const checkAssignmentPlagiarism = async (assignmentId: string): Promise<PlagiarismPairResult[]> => {
  const sql = `
    SELECT 
      s.id as submission_id,
      s.student_id,
      s.source_code,
      u.display_name as student_name
    FROM assignment_submissions s
    JOIN users u ON s.student_id = u.id
    WHERE s.assignment_id = $1 AND s.source_code IS NOT NULL AND TRIM(s.source_code) != '';
  `;

  const result = await query(sql, [assignmentId]);
  const submissions = result.rows;

  if (submissions.length < 2) return [];

  const tokenizedData = submissions.map((sub: any) => {
    const tokens = tokenizeAST(sub.source_code || '');
    const fingerprints = generateFingerprints(tokens);
    return {
      submissionId: sub.submission_id,
      studentId: sub.student_id,
      studentName: sub.student_name || 'Student',
      code: sub.source_code,
      fingerprints,
    };
  });

  const pairs: PlagiarismPairResult[] = [];

  for (let i = 0; i < tokenizedData.length; i++) {
    for (let j = i + 1; j < tokenizedData.length; j++) {
      const subA = tokenizedData[i];
      const subB = tokenizedData[j];

      // Ignore duplicate submissions by the exact same student
      if (subA.studentId === subB.studentId) continue;

      const simScore = calculateJaccardSimilarity(subA.fingerprints, subB.fingerprints);

      if (simScore >= 35) {
        let level: 'HIGH' | 'MEDIUM' | 'CLEAN' = 'CLEAN';
        if (simScore >= 75) level = 'HIGH';
        else if (simScore >= 50) level = 'MEDIUM';

        const { matchedLinesA, matchedLinesB } = getMatchedLines(subA.code, subB.code);

        pairs.push({
          studentA: { id: subA.studentId, name: subA.studentName, submissionId: subA.submissionId, code: subA.code },
          studentB: { id: subB.studentId, name: subB.studentName, submissionId: subB.submissionId, code: subB.code },
          similarity: simScore,
          level,
          matchedLinesA,
          matchedLinesB,
        });
      }
    }
  }

  pairs.sort((a, b) => b.similarity - a.similarity);
  return pairs;
};

const canonicalizeLine = (line: string): string => {
  let cleaned = line
    .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '') // remove comments
    .replace(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g, 'STR_LIT') // normalize strings
    .replace(/\b\d+(\.\d+)?\b/g, 'NUM_LIT'); // normalize numbers

  const keywords = new Set([
    'public', 'class', 'static', 'void', 'main', 'string', 'int', 'double', 'float', 'boolean',
    'if', 'else', 'for', 'while', 'return', 'import', 'def', 'function', 'const', 'let', 'var',
    'new', 'true', 'false', 'null', 'sys', 'println', 'print', 'package'
  ]);

  const rawTokens = cleaned.match(/[a-zA-Z_]\w*|[^\s\w]/g) || [];
  const canonical: string[] = [];
  for (const token of rawTokens) {
    const lower = token.toLowerCase();
    if (keywords.has(lower) || /^[^\w]$/.test(token) || token === 'STR_LIT' || token === 'NUM_LIT') {
      canonical.push(lower);
    } else {
      canonical.push('var');
    }
  }
  return canonical.join('');
};

export const getMatchedLines = (codeA: string, codeB: string): { matchedLinesA: number[], matchedLinesB: number[] } => {
  const linesA = (codeA || '').split('\n');
  const linesB = (codeB || '').split('\n');

  const normA = linesA.map(canonicalizeLine);
  const normB = linesB.map(canonicalizeLine);

  const matchedLinesA = new Set<number>();
  const matchedLinesB = new Set<number>();

  for (let i = 0; i < normA.length; i++) {
    const cA = normA[i];
    if (!cA || cA.length < 5) continue; // skip short lines like brackets, short variables

    for (let j = 0; j < normB.length; j++) {
      const cB = normB[j];
      if (!cB || cB.length < 5) continue;

      if (cA === cB) {
        matchedLinesA.add(i + 1);
        matchedLinesB.add(j + 1);
      }
    }
  }

  return {
    matchedLinesA: Array.from(matchedLinesA),
    matchedLinesB: Array.from(matchedLinesB)
  };
};
