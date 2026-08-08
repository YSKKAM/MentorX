import { GoogleGenAI } from '@google/genai';
import { GeminiChatProvider } from './providers/GeminiChatProvider';

/**
 * Interface defining the contract for AI providers.
 */
export interface IAIProvider {
  generateResponse(prompt: string): Promise<string>;
}

/**
 * Real Gemini AI Provider connecting to Google Gemini API
 */
export class RealGeminiProvider implements IAIProvider {
  private provider = new GeminiChatProvider();

  async generateResponse(prompt: string): Promise<string> {
    return this.provider.generateText(prompt);
  }
}

/**
 * A fallback mock AI provider if no GEMINI_API_KEY is configured.
 */
export class MockAIProvider implements IAIProvider {
  async generateResponse(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`AI Assistant: Here is the assistance for: "${prompt}"`);
      }, 1000);
    });
  }
}

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 15000, fallbackValue: T): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallbackValue), timeoutMs)),
  ]);
};

/**
 * Factory method to generate a real AI response using the configured Gemini API key.
 *
 * @param provider - The name of the AI provider to use.
 * @param prompt - The prompt to send to the AI.
 * @returns The AI generated response.
 */
export const generateAiResponse = async (provider: string, prompt: string): Promise<string> => {
  let aiProvider: IAIProvider;
  
  if (process.env.GEMINI_API_KEY) {
    aiProvider = new RealGeminiProvider();
  } else {
    aiProvider = new MockAIProvider();
  }

  return withTimeout(
    aiProvider.generateResponse(prompt),
    15000,
    'AI Assistant: The request timed out. Please try again.'
  );
};

export const analyzeErrorConcept = async (errorMessage: string, codeSnippet: string) => {
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `You are an expert Java programming tutor in an AI Classroom. Analyze this compiler/runtime error and code snippet carefully.

Error message: "${errorMessage}"
Code snippet:
\`\`\`java
${codeSnippet}
\`\`\`

Your job is to identify the SPECIFIC Java programming concept or topic this error relates to — not just the surface-level syntax error.

For example:
- "Syntax error on token X, { expected" near a class name → likely "Java Inheritance (missing extends)" 
- "cannot find symbol" for a class → likely "Class not found / Import missing"
- "method not found" → "Method Overriding" or "Method Signature"
- "incompatible types" → "Type Casting / Type Mismatch"
- Missing semicolon → "Syntax Error"

Respond ONLY with a raw JSON object (no markdown, no code blocks):
{
  "topic": "<2-5 word CS topic name — be specific, e.g. 'Java Inheritance', 'Polymorphism', 'Array Index', 'Missing Import', 'Method Overriding', 'Interface Implementation'>",
  "insight": "<1-2 sentences for the teacher on how to help the student understand this concept>",
  "suggestedError": "<A clearer, student-friendly rewrite of the error message. If original is already clear, return empty string ''>"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: prompt,
      });

      let responseText = response.text || '';
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
    }
  }

  // --- Improved fallback when no Gemini API key is available ---
  return new Promise((resolve) => {
    setTimeout(() => {
      let topic = 'Syntax Error';
      let insight = 'There appears to be a syntax error in the code.';
      let suggestedError = '';
      
      const lowerError = errorMessage.toLowerCase();
      const lowerCode = codeSnippet.toLowerCase();

      // ── Inheritance / extends keyword ──────────────────────────
      if (
        (lowerError.includes('syntax error on token') && lowerError.includes('{ expected')) ||
        (lowerError.includes('expected') && lowerCode.match(/class\s+\w+\s+\w+\s*\{/))
      ) {
        topic = 'Java Inheritance (missing extends)';
        insight = 'The student likely forgot the `extends` keyword when declaring a subclass. Remind them that `class Child extends Parent {}` is the correct syntax for inheritance in Java.';
        suggestedError = 'Class declaration is missing the `extends` keyword. Use: `class ClassName extends ParentClass { }`';

      // ── Interface / implements keyword ─────────────────────────
      } else if (lowerError.includes('implements') || (lowerCode.includes('interface') && lowerError.includes('expected'))) {
        topic = 'Java Interface Implementation';
        insight = 'The student is trying to implement an interface but may have forgotten the `implements` keyword or not overridden all required methods.';
        suggestedError = 'Missing `implements` keyword or unimplemented interface methods.';

      // ── Abstract class / method ────────────────────────────────
      } else if (lowerError.includes('abstract') || lowerError.includes('cannot instantiate')) {
        topic = 'Abstract Classes & Methods';
        insight = 'The student may be trying to instantiate an abstract class directly. Remind them that abstract classes cannot be instantiated — they must be subclassed.';
        suggestedError = 'Cannot create an object of an abstract class. Create a concrete subclass instead.';

      // ── Method overriding ──────────────────────────────────────
      } else if (lowerError.includes('cannot override') || lowerError.includes('does not override')) {
        topic = 'Method Overriding';
        insight = 'The student is trying to override a method but the signature does not match the parent class. Check return type, method name, and parameters.';
        suggestedError = 'Method signature does not match the parent class method being overridden.';

      // ── Polymorphism / casting ─────────────────────────────────
      } else if (lowerError.includes('classcastexception') || lowerError.includes('cannot cast') || lowerError.includes('incompatible types')) {
        topic = 'Polymorphism & Type Casting';
        insight = 'The student has a type casting issue. Remind them that casting only works when there is a valid inheritance relationship between the classes.';
        suggestedError = 'Incompatible type cast — the object cannot be converted to the target type.';

      // ── Object instantiation ───────────────────────────────────
      } else if (lowerCode.includes('student()') && !lowerCode.includes('new student()')) {
        topic = 'Object Instantiation (new keyword)';
        insight = 'The student forgot to use the `new` keyword when creating an object. Remind them that objects in Java must be created with `new ClassName()`.';
        suggestedError = 'Missing `new` keyword for object instantiation. Use: `ClassName obj = new ClassName();`';

      // ── Cannot find symbol / variable not declared ─────────────
      } else if (lowerError.includes('cannot find symbol') || lowerError.includes('cannot be resolved')) {
        topic = 'Variable / Method Not Found';
        insight = 'The student is using a variable, method, or class name that hasn\'t been declared or is out of scope. Ask them to check for typos, missing declarations, or missing imports.';
        suggestedError = 'The variable or method used does not exist or is not accessible in this scope.';

      // ── NullPointerException ───────────────────────────────────
      } else if (lowerError.includes('nullpointerexception') || lowerError.includes('null pointer')) {
        topic = 'Null Pointer Exception';
        insight = 'The student is trying to call a method or access a field on an object that hasn\'t been initialized (is null). Remind them to always initialize objects before using them.';
        suggestedError = 'NullPointerException: The object is null. Make sure to initialize it before use.';

      // ── Array index out of bounds ──────────────────────────────
      } else if (lowerError.includes('arrayindexoutofbounds') || lowerError.includes('index out of bound')) {
        topic = 'Array Index Out of Bounds';
        insight = 'The student is accessing an array index that doesn\'t exist. Remind them that arrays are 0-indexed so the last valid index is `array.length - 1`.';
        suggestedError = 'Array index out of bounds — check that your loop/index does not exceed the array length.';

      // ── Stack overflow / infinite recursion ────────────────────
      } else if (lowerError.includes('stackoverflowerror') || lowerError.includes('stack overflow')) {
        topic = 'Infinite Recursion / Stack Overflow';
        insight = 'The student\'s recursive method has no valid base case, causing infinite recursion. Ask them to verify their base case condition.';
        suggestedError = 'StackOverflowError: Infinite recursion detected — add a proper base case to the recursive method.';

      // ── Type mismatch ──────────────────────────────────────────
      } else if (lowerError.includes('type mismatch')) {
        topic = 'Type Mismatch';
        insight = 'The student is assigning a value to a variable of an incompatible type. Remind them to match variable types (e.g., don\'t assign a String to an int).';

      // ── Missing semicolon / brace ──────────────────────────────
      } else if (lowerError.includes(';') || (lowerError.includes('expected') && !lowerError.includes('{ expected'))) {
        topic = 'Missing Semicolon or Brace';
        insight = 'The student likely missed a semicolon (`;`) at the end of a statement or a closing brace (`}`). Ask them to carefully check statement endings.';
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
        model: 'gemini-flash-latest',
        contents: prompt,
      });

      return response.text?.trim() || text;
    } catch (e) {
      console.error('Gemini API Error in enhanceText:', e);
    }
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      const lower = text.toLowerCase();
      let enhanced = text;
      
      if (lower.includes('hello') || lower.includes('hi')) {
        enhanced = "Hello! How can I help you with your code today?";
      } else if (lower.includes('wrong') || lower.includes('fix')) {
        enhanced = "It looks like there might be an issue here. Let's review the logic together to see how we can fix it.";
      } else if (lower.includes('good') || lower.includes('great')) {
        enhanced = "Excellent work! Your approach here is very solid.";
      } else {
        enhanced = `Here is a clearer way to say this: "${text}" -> "I noticed your code. Let's discuss your approach."`;
      }
      
      resolve(enhanced);
    }, 800);
  });
};

export const generateSmartTopicFallback = (topicOrTitle: string, description: string = '', language: string = 'java') => {
  const text = (topicOrTitle + ' ' + description).toLowerCase();

  if (text.includes('fibonacci') || text.includes('fib')) {
    return {
      title: "Fibonacci Series Generator",
      description: "Write a program that takes an integer N from STDIN and prints the first N terms of the Fibonacci sequence separated by spaces.\n\n### Example\n- Input: `5` -> Output: `0 1 1 2 3`\n- Input: `7` -> Output: `0 1 1 2 3 5 8`",
      conceptsCovered: ["Loops", "Variables", "Fibonacci"],
      visibleTestCases: [
        { input: "5", expectedOutput: "0 1 1 2 3" },
        { input: "7", expectedOutput: "0 1 1 2 3 5 8" },
        { input: "1", expectedOutput: "0" }
      ],
      hiddenTestCases: [
        { input: "2", expectedOutput: "0 1" },
        { input: "10", expectedOutput: "0 1 1 2 3 5 8 13 21 34" }
      ],
      hints: [
        { level: 1, text: "The Fibonacci sequence starts with 0 and 1. Each subsequent term is the sum of the previous two terms." },
        { level: 2, text: "Use a loop running N times, keeping track of previous two terms `a` and `b`." },
        { level: 3, text: "In Java: Scanner sc = new Scanner(System.in); int n = sc.nextInt(); for (int i = 0; i < n; i++) { System.out.print(a + \" \"); ... }" }
      ]
    };
  }

  if (text.includes('factorial') || text.includes('fact')) {
    return {
      title: "Calculate Factorial",
      description: "Write a program that reads an integer N from STDIN and prints its factorial (N!).\n\n### Example\n- Input: `5` -> Output: `120`",
      conceptsCovered: ["Loops", "Recursion", "Math"],
      visibleTestCases: [
        { input: "5", expectedOutput: "120" },
        { input: "0", expectedOutput: "1" },
        { input: "7", expectedOutput: "5040" }
      ],
      hiddenTestCases: [
        { input: "1", expectedOutput: "1" },
        { input: "10", expectedOutput: "3628800" }
      ],
      hints: [
        { level: 1, text: "Factorial of N is N * (N-1) * ... * 1. Factorial of 0 is 1." },
        { level: 2, text: "Multiply numbers from 1 to N using a loop or recursion." },
        { level: 3, text: "Use long to avoid integer overflow for larger numbers." }
      ]
    };
  }

  if (text.includes('palindrome')) {
    return {
      title: "Palindrome String Check",
      description: "Write a program that reads a string from STDIN and prints 'true' if it is a palindrome, or 'false' otherwise.",
      conceptsCovered: ["Strings", "Two Pointer", "Conditionals"],
      visibleTestCases: [
        { input: "madam", expectedOutput: "true" },
        { input: "hello", expectedOutput: "false" }
      ],
      hiddenTestCases: [
        { input: "racecar", expectedOutput: "true" },
        { input: "java", expectedOutput: "false" }
      ],
      hints: [
        { level: 1, text: "A palindrome reads the same backward as forward." },
        { level: 2, text: "Compare characters from both ends moving inward." },
        { level: 3, text: "Use StringBuilder(str).reverse().toString().equals(str) in Java." }
      ]
    };
  }

  if (text.includes('reverse')) {
    return {
      title: "Reverse String",
      description: "Write a program that reads a string from STDIN and prints the reversed string.",
      conceptsCovered: ["Strings", "Loops"],
      visibleTestCases: [
        { input: "hello", expectedOutput: "olleh" },
        { input: "java", expectedOutput: "avaj" }
      ],
      hiddenTestCases: [
        { input: "12345", expectedOutput: "54321" }
      ],
      hints: [
        { level: 1, text: "Loop through the string from the last character to the first." },
        { level: 2, text: "Append each character to a new result string." },
        { level: 3, text: "Use str.charAt(i) in Java inside a backward for-loop." }
      ]
    };
  }

  if (text.includes('prime')) {
    return {
      title: "Prime Number Check",
      description: "Write a program that reads an integer N from STDIN and prints 'Prime' if N is a prime number, or 'Not Prime' otherwise.",
      conceptsCovered: ["Math", "Loops", "Conditionals"],
      visibleTestCases: [
        { input: "7", expectedOutput: "Prime" },
        { input: "10", expectedOutput: "Not Prime" }
      ],
      hiddenTestCases: [
        { input: "2", expectedOutput: "Prime" },
        { input: "1", expectedOutput: "Not Prime" }
      ],
      hints: [
        { level: 1, text: "A prime number is greater than 1 and divisible only by 1 and itself." },
        { level: 2, text: "Check if N is divisible by any number from 2 up to sqrt(N)." },
        { level: 3, text: "Numbers <= 1 are Not Prime." }
      ]
    };
  }

  if (text.includes('hello')) {
    return {
      title: "Hello World",
      description: "Write a program that prints 'Hello World' to standard output.",
      conceptsCovered: ["Basics", "Output"],
      visibleTestCases: [
        { input: "", expectedOutput: "Hello World" }
      ],
      hiddenTestCases: [
        { input: "", expectedOutput: "Hello World" }
      ],
      hints: [
        { level: 1, text: "Use standard console output." },
        { level: 2, text: "In Java: System.out.println(\"Hello World\");" },
        { level: 3, text: "Ensure exact letter casing." }
      ]
    };
  }

  return {
    title: `Assignment: ${topicOrTitle}`,
    description: `Write a program to solve ${topicOrTitle}.\nRead input from STDIN and print the expected output to STDOUT.`,
    conceptsCovered: ["Problem Solving", topicOrTitle],
    visibleTestCases: [
      { input: "5", expectedOutput: "5" },
      { input: "10", expectedOutput: "10" }
    ],
    hiddenTestCases: [
      { input: "0", expectedOutput: "0" }
    ],
    hints: [
      { level: 1, text: "Read input STDIN string carefully." },
      { level: 2, text: "Implement the required algorithm." },
      { level: 3, text: "Print exact output to STDOUT." }
    ]
  };
};

export const generateAssignment = async (topic: string, marks: number, difficulty: string, language: string) => {
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `You are an expert computer science professor. Generate a high-quality programming assignment for your students.
Topic/Prompt: ${topic}
Language: ${language}
Difficulty: ${difficulty}
Marks: ${marks}

IMPORTANT CRITICAL INSTRUCTIONS FOR TEST CASES:
- DO NOT use generic placeholder words like "test input", "input", "expected output" or "hidden input".
- All "input" fields MUST contain REAL STDIN input values (e.g. "5" or "madam" or "10 20").
- All "expectedOutput" fields MUST contain REAL, mathematically and logically correct STDOUT expected output values (e.g. "0 1 1 2 3" for Fibonacci 5, or "120" for Factorial 5).
- Include at least 3 visible test cases and 3 hidden edge-case test cases.

Return a valid JSON object strictly matching this schema:
{
  "title": "Short descriptive title",
  "description": "Full problem statement and instructions (markdown supported)",
  "conceptsCovered": ["concept1", "concept2"],
  "visibleTestCases": [{"input": "5", "expectedOutput": "0 1 1 2 3"}],
  "hiddenTestCases": [{"input": "7", "expectedOutput": "0 1 1 2 3 5 8"}],
  "hints": [
    {"level": 1, "text": "High-level concept hint"},
    {"level": 2, "text": "Logic/Algorithm hint"},
    {"level": 3, "text": "Implementation detail hint (no exact code)"}
  ]
}
Do NOT include markdown blocks around the JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: prompt,
      });

      let responseText = response.text || '';
      const startIdx = responseText.indexOf('{');
      const endIdx = responseText.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1) {
        responseText = responseText.substring(startIdx, endIdx + 1);
      }

      const parsed = JSON.parse(responseText);
      if (parsed.visibleTestCases && parsed.visibleTestCases.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.error('Gemini API Error in generateAssignment:', e);
    }
  }

  return generateSmartTopicFallback(topic, '', language);
};

export const generateTestCasesFromDescription = async (title: string, description: string, language: string) => {
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `You are an expert computer science professor. The teacher provided an assignment title and description, but needs auto-generated test cases and hints.
Assignment Title: ${title}
Assignment Description: ${description}
Language: ${language}

IMPORTANT CRITICAL INSTRUCTIONS FOR TEST CASES:
- DO NOT use generic placeholder words like "test input", "input", "expected output" or "hidden input".
- All "input" fields MUST contain REAL STDIN input values matching the problem (e.g. "5" or "madam").
- All "expectedOutput" fields MUST contain REAL, mathematically and logically correct STDOUT expected output values (e.g. "0 1 1 2 3" for Fibonacci 5).
- Include at least 3 visible test cases and 3 hidden edge-case test cases.

Return a valid JSON object strictly matching this schema:
{
  "visibleTestCases": [{"input": "5", "expectedOutput": "0 1 1 2 3"}],
  "hiddenTestCases": [{"input": "7", "expectedOutput": "0 1 1 2 3 5 8"}],
  "hints": [
    {"level": 1, "text": "High-level concept hint"},
    {"level": 2, "text": "Logic/Algorithm hint"},
    {"level": 3, "text": "Implementation detail hint (no exact code)"}
  ]
}
Do NOT include markdown blocks around the JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: prompt,
      });

      let responseText = response.text || '';
      const startIdx = responseText.indexOf('{');
      const endIdx = responseText.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1) {
        responseText = responseText.substring(startIdx, endIdx + 1);
      }

      const parsed = JSON.parse(responseText);
      if (parsed.visibleTestCases && parsed.visibleTestCases.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.error('Gemini API Error in generateTestCasesFromDescription:', e);
    }
  }

  const fallback = generateSmartTopicFallback(title, description, language);
  return {
    visibleTestCases: fallback.visibleTestCases,
    hiddenTestCases: fallback.hiddenTestCases,
    hints: fallback.hints
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
        model: 'gemini-flash-latest',
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
    recommendationText: "The student seems to have some logical errors in their submission.",
    conceptGap: "Logic Errors"
  };
};
