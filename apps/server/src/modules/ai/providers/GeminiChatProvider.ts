import { GoogleGenAI } from '@google/genai';
import { IAIChatProvider } from './IAIChatProvider';
import { env } from '../../../config/env';

export class GeminiChatProvider implements IAIChatProvider {
  private ai: any;

  constructor() {
    // We instantiate without passing apiKey if it is automatically picked up from process.env.GEMINI_API_KEY
    // Or we explicitly pass it
    this.ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }

  async generateText(prompt: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });
    return response.text || '';
  }

  async generateCode(prompt: string): Promise<string> {
    const systemPrompt = `You are an expert programmer. You must ONLY reply with the code requested. Do not include markdown blocks like \`\`\`javascript. Just the raw code. If the user asks a question, answer it in comments within the code. IMPORTANT: Double check all syntax (like using System.in for Java Scanners) to ensure the code compiles perfectly.`;
    const response = await this.ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `${systemPrompt}\n\nUser Request: ${prompt}`,
    });
    return response.text || '';
  }

  async generateImage(prompt: string): Promise<string> {
    try {
      const response = await this.ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
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
    } catch (error) {
      console.error('Imagen API Error:', error);
      // Fallback: Return a placeholder image with the prompt text if the user's API key doesn't have Imagen access yet
      const fallbackUrl = `https://placehold.co/600x400/1a1a24/4ade80.png?text=API+Key+Cannot+Generate+Images%5Cn%5CnPrompt:+${encodeURIComponent(prompt.substring(0, 50))}`;
      return fallbackUrl;
    }
  }
}
