import { GoogleGenAI } from '@google/genai';
import { IAIChatProvider } from './IAIChatProvider';

export class GeminiChatProvider implements IAIChatProvider {
  private ai: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  async generateText(prompt: string): Promise<string> {
    if (!this.ai) {
      return `AI Assistant: GEMINI_API_KEY is not configured in the server environment.`;
    }

    try {
      const systemPrompt = `You are an advanced AI programming assistant & educational mentor in the AI Classroom Platform. Be helpful, concise, well-structured, and clear.`;
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${systemPrompt}\n\nUser Question/Context:\n${prompt}`,
      });
      return response.text || 'AI Assistant: No response text generated.';
    } catch (error: any) {
      console.error('Gemini API Error in generateText:', error);
      return `AI Assistant: Error contacting Gemini API - ${error?.message || 'Unknown error'}`;
    }
  }

  async generateCode(prompt: string): Promise<string> {
    if (!this.ai) {
      return `// GEMINI_API_KEY is not configured in environment.`;
    }

    try {
      const systemPrompt = `You are an expert programming assistant in AI Classroom. Reply strictly with valid code solution for the user's request. Double check syntax for completeness. Include helpful inline comments.`;
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${systemPrompt}\n\nRequest:\n${prompt}`,
      });
      return response.text || '';
    } catch (error: any) {
      console.error('Gemini API Error in generateCode:', error);
      return `// Error generating code with Gemini API: ${error?.message}`;
    }
  }

  async generateImage(prompt: string): Promise<string> {
    if (!this.ai) {
      return `https://placehold.co/600x400/1a1a24/4ade80.png?text=API+Key+Required`;
    }

    try {
      const response = await this.ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
        }
      });

      if (response.generatedImages && response.generatedImages.length > 0) {
        return `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
      }
      throw new Error('No image returned');
    } catch (error: any) {
      console.error('Imagen API Error:', error);
      const fallbackUrl = `https://placehold.co/600x400/1a1a24/818cf8.png?text=Generated+Visual%5CnPrompt:+${encodeURIComponent(prompt.substring(0, 40))}`;
      return fallbackUrl;
    }
  }
}
