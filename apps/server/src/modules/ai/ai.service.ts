import { GoogleGenAI } from '@google/genai';

/**
 * Interface defining the contract for AI providers.
 */
export interface IAIProvider {
  generateResponse(prompt: string): Promise<string>;
}

/**
 * A mock AI provider that simulates network latency and returns a generated response.
 */
export class MockAIProvider implements IAIProvider {
  async generateResponse(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`This is a simulated AI response to: "${prompt}"`);
      }, 1000); // 1 second delay
    });
  }
}

/**
 * Factory method to generate an AI response.
 * Currently uses MockAIProvider.
 *
 * @param provider - The name of the AI provider to use.
 * @param prompt - The prompt to send to the AI.
 * @returns The AI generated response.
 */
export const generateAiResponse = async (provider: string, prompt: string): Promise<string> => {
  let aiProvider: IAIProvider;
  
  // You can extend this factory to support different providers (e.g., 'openai', 'anthropic')
  switch (provider.toLowerCase()) {
    case 'mock':
    default:
      aiProvider = new MockAIProvider();
      break;
  }

  return aiProvider.generateResponse(prompt);
};

export const analyzeErrorConcept = async (errorMessage: string, codeSnippet: string) => {
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `You are an expert programming tutor. Analyze the following compiler error and code snippet.
Error: ${errorMessage}
Code:
${codeSnippet}

Provide a JSON response with the following keys exactly:
- "topic": A 2-4 word categorization of the error (e.g., "Syntax Error", "Type Mismatch", "Variable Scope").
- "insight": A 1-2 sentence explanation aimed at a teacher on how to guide the student.
- "suggestedError": A rewritten, highly clear version of the error message for the student. If the original error is already clear, return an empty string.

Only return the raw JSON object, no markdown blocks.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      let responseText = response.text || '';
      // Find the first { and last } to extract just the JSON object
      const startIdx = responseText.indexOf('{');
      const endIdx = responseText.lastIndexOf('}');
      
      if (startIdx !== -1 && endIdx !== -1) {
        responseText = responseText.substring(startIdx, endIdx + 1);
      }
      
      const parsed = JSON.parse(responseText);
      
      return {
        topic: parsed.topic || 'Analysis Error',
        insight: parsed.insight || 'Failed to generate insight.',
        suggestedError: parsed.suggestedError || '',
        originalError: errorMessage
      };
    } catch (e) {
      console.error('Gemini API Error in analyzeErrorConcept:', e);
      // Fallback to mock on error
    }
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      let topic = 'Syntax Error';
      let insight = 'There appears to be a syntax error in the code.';
      let suggestedError = '';
      
      const lowerError = errorMessage.toLowerCase();
      
      if (codeSnippet.includes('Student()') && !codeSnippet.includes('new Student()')) {
        topic = 'Missing Object Instantiation';
        insight = 'The student forgot to use the `new` keyword (and possibly the `=` operator) when trying to create an object. Remind them that objects in Java must be instantiated with `new`.';
        suggestedError = 'Missing "=" or "new" keyword for object instantiation.';
      } else if (lowerError.includes('cannot find symbol') || lowerError.includes('undefined') || lowerError.includes('cannot be resolved')) {
        topic = 'Variable Declaration / Scope';
        insight = "The student is trying to use a variable or method that hasn't been declared or is out of scope (like 's1' missing its declaration). Suggest they check if they deleted the object creation code or verify where it was defined.";
      } else if (lowerError.includes('type mismatch') || lowerError.includes('incompatible types')) {
        topic = 'Type Mismatch';
        insight = 'The student is assigning a value to a variable of a different, incompatible type. Remind them to check variable types (e.g., assigning a String to an int).';
      } else if (lowerError.includes('expected') || lowerError.includes(';')) {
        topic = 'Missing Semicolon / Syntax';
        insight = 'The student likely missed a semicolon or closing brace. Tell them to check the end of their statements.';
      }

      resolve({
        topic,
        insight,
        suggestedError,
        originalError: errorMessage
      });
    }, 1000);
  });
};

export const enhanceText = async (text: string) => {
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Rewrite the following message from a teacher to a student to be highly professional, encouraging, clear, and pedagogical. Do not add any introductory or concluding conversational text, just return the rewritten message itself.
Message: "${text}"`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return response.text?.trim() || text;
    } catch (e) {
      console.error('Gemini API Error in enhanceText:', e);
      // Fallback to mock on error
    }
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      // Very basic mock logic for enhancement
      const lower = text.toLowerCase();
      let enhanced = text;
      
      if (lower.includes('hello') || lower.includes('hi')) {
        enhanced = "Hello! How can I help you with your code today?";
      } else if (lower.includes('wrong') || lower.includes('fix')) {
        enhanced = "It looks like there might be an issue here. Let's review the logic together to see how we can fix it.";
      } else if (lower.includes('good') || lower.includes('great')) {
        enhanced = "Excellent work! Your approach here is very solid.";
      } else {
        // Generic enhancement
        enhanced = `Here is a clearer way to say this: "${text}" -> "I noticed your code. Let's discuss your approach."`;
      }
      
      resolve(enhanced);
    }, 800); // 800ms delay to simulate typing
  });
};

export const generateAssignment = async (topic: string, marks: number, difficulty: string, language: string) => {
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `You are an expert computer science professor. Generate a programming assignment for your students.
Topic/Example: ${topic}
Language: ${language}
Difficulty: ${difficulty}
Marks: ${marks}

Return a valid JSON object strictly matching this schema:
{
  "title": "Short descriptive title",
  "description": "Full problem statement and instructions (markdown supported)",
  "conceptsCovered": ["concept1", "concept2"],
  "visibleTestCases": [{"input": "test input", "expectedOutput": "expected output"}],
  "hiddenTestCases": [{"input": "edge case input", "expectedOutput": "expected output"}],
  "hints": [
    {"level": 1, "text": "High-level concept hint"},
    {"level": 2, "text": "Logic/Algorithm hint"},
    {"level": 3, "text": "Implementation detail hint (no exact code)"}
  ]
}
Include at least 2 visible test cases and 3 hidden test cases. Do NOT include markdown blocks around the JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      let responseText = response.text || '';
      const startIdx = responseText.indexOf('{');
      const endIdx = responseText.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1) {
        responseText = responseText.substring(startIdx, endIdx + 1);
      }

      return JSON.parse(responseText);
    } catch (e) {
      console.error('Gemini API Error in generateAssignment:', e);
    }
  }

  // Fallback Mock
  return {
    title: `Mock Assignment: ${topic}`,
    description: "This is a mock assignment since the AI key failed. Please implement the requested logic.",
    conceptsCovered: ["Basics", topic],
    visibleTestCases: [{ input: "test", expectedOutput: "test_success" }],
    hiddenTestCases: [{ input: "hidden", expectedOutput: "hidden_success" }],
    hints: [
      { level: 1, text: "Think about the basic syntax." },
      { level: 2, text: "Use a loop or condition." },
      { level: 3, text: "Return the modified value." }
    ]
  };
};

export const generateTestCasesFromDescription = async (title: string, description: string, language: string) => {
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `You are an expert computer science professor. The teacher has provided a programming assignment description, but forgot to provide test cases and hints.
Assignment Title: ${title}
Assignment Description: ${description}
Language: ${language}

Analyze the description and generate appropriate text-based I/O test cases and hints for this assignment.
If the assignment is purely visual (like HTML/CSS/Frontend JS) and cannot be tested with terminal STDIN/STDOUT, return empty arrays for the test cases, but still provide hints.

Return a valid JSON object strictly matching this schema:
{
  "visibleTestCases": [{"input": "test input", "expectedOutput": "expected output"}],
  "hiddenTestCases": [{"input": "edge case input", "expectedOutput": "expected output"}],
  "hints": [
    {"level": 1, "text": "High-level concept hint"},
    {"level": 2, "text": "Logic/Algorithm hint"},
    {"level": 3, "text": "Implementation detail hint (no exact code)"}
  ]
}
Do NOT include markdown blocks around the JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      let responseText = response.text || '';
      const startIdx = responseText.indexOf('{');
      const endIdx = responseText.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1) {
        responseText = responseText.substring(startIdx, endIdx + 1);
      }

      return JSON.parse(responseText);
    } catch (e) {
      console.error('Gemini API Error in generateTestCasesFromDescription:', e);
    }
  }

  // Fallback Mock
  return {
    visibleTestCases: [{ input: "fallback_in", expectedOutput: "fallback_out" }],
    hiddenTestCases: [{ input: "hidden_in", expectedOutput: "hidden_out" }],
    hints: [
      { level: 1, text: "Review the problem statement." },
      { level: 2, text: "Consider the logic flow." },
      { level: 3, text: "Check your syntax." }
    ]
  };
};

export const analyzeSubmission = async (code: string, language: string, results: any[]) => {
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Analyze this student submission.
Language: ${language}
Code:
${code}

Test Case Results:
${JSON.stringify(results)}

Return a JSON object with:
{
  "recommendationText": "A 2-3 sentence summary of what the student did wrong (or right) and how they can improve.",
  "conceptGap": "A 1-3 word phrase identifying the core concept they are struggling with (e.g., 'Loops', 'Object Instantiation', 'Null Pointers'). If perfect, return 'None'."
}
Do NOT include markdown blocks around the JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      let responseText = response.text || '';
      const startIdx = responseText.indexOf('{');
      const endIdx = responseText.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1) {
        responseText = responseText.substring(startIdx, endIdx + 1);
      }

      return JSON.parse(responseText);
    } catch (e) {
      console.error('Gemini API Error in analyzeSubmission:', e);
    }
  }

  return {
    recommendationText: "Mock analysis: The student seems to have some logical errors in their submission.",
    conceptGap: "Logic Errors"
  };
};
