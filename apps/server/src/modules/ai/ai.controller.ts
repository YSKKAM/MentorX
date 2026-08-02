import { Request, Response, NextFunction } from 'express';
import * as aiService from './ai.service';

export const analyzeError = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { errorMessage, codeSnippet } = req.body;
    
    if (!errorMessage) {
      res.status(400).json({ status: 'error', message: 'errorMessage is required' });
      return;
    }

    const analysis = await aiService.analyzeErrorConcept(errorMessage, codeSnippet);
    res.status(200).json(analysis);
  } catch (error) {
    console.error('Error analyzing error:', error);
    res.status(500).json({ message: 'Failed to analyze error' });
  }
};

export const enhance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, provider } = req.body;
    
    if (!text) {
      res.status(400).json({ message: 'Text is required' });
      return;
    }

    // Pass the text to our mock enhancement service
    // (In the future, we can use the provider to select Gemini, OpenAI, etc.)
    const enhancedText = await aiService.enhanceText(text);
    
    res.status(200).json({ enhancedText });
  } catch (error) {
    console.error('Error enhancing text:', error);
    res.status(500).json({ message: 'Failed to enhance text' });
  }
};
