import { Request, Response, NextFunction } from 'express';
import * as chatRoomsService from './chat_rooms.service';
import * as chatService from './chat.service';

export const createRoom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;
    const userId = (req as any).user.userId;

    if (!name) {
      return res.status(400).json({ status: 'error', message: 'Room name is required' });
    }

    const room = await chatRoomsService.createChatRoom(name, userId);
    
    res.status(201).json({
      status: 'success',
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

export const joinRoom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { joinCode } = req.params;
    
    const room = await chatRoomsService.getChatRoomByCode(joinCode.toUpperCase());
    if (!room) {
      return res.status(404).json({ status: 'error', message: 'Chat room not found' });
    }
    
    res.status(200).json({
      status: 'success',
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

export const getRoom = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomId } = req.params;
    
    const room = await chatRoomsService.getChatRoomById(roomId);
    if (!room) {
      return res.status(404).json({ status: 'error', message: 'Chat room not found' });
    }
    
    res.status(200).json({
      status: 'success',
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

export const getHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomId } = req.params;
    const messages = await chatService.getChatRoomMessages(roomId);
    
    res.status(200).json({
      status: 'success',
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};
