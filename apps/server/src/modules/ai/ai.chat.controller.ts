import { Request, Response } from 'express';
import { GeminiChatProvider } from './providers/GeminiChatProvider';

// We instantiate the provider. In a full DI setup, this would be injected.
const geminiProvider = new GeminiChatProvider();

export const generatePreview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, type } = req.body; // type = 'text', 'code', 'image'

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    let result = '';

    if (type === 'image') {
      result = await geminiProvider.generateImage(prompt);
    } else if (type === 'code') {
      result = await geminiProvider.generateCode(prompt);
    } else {
      result = await geminiProvider.generateText(prompt);
    }

    res.json({ result, type });
  } catch (error) {
    console.error('Failed to generate preview:', error);
    res.status(500).json({ error: 'Failed to generate preview' });
  }
};
