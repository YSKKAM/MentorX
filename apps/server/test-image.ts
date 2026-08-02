import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: 'generate code of fibbonacci series to nth terms',
    });
    console.log(response.text);
  } catch (err: any) {
    console.error("ERROR:");
    console.error(err.message || err);
  }
}
main();
