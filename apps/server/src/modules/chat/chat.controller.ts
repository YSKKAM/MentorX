import { Request, Response, NextFunction } from 'express';
import * as chatService from './chat.service';

/**
 * Controller to fetch chat history for a classroom.
 */
export const getHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { classroomId } = req.params;
    
    // Fetch last 100 messages
    const messages = await chatService.getMessages(classroomId);
    
    res.status(200).json({
      status: 'success',
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};
