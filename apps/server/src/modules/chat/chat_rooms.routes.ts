import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import * as chatRoomsController from './chat_rooms.controller';

const router = Router();

// Apply authentication middleware
router.use(authenticate);

// Create a new room
router.post('/', chatRoomsController.createRoom);

// Get room by id
router.get('/:roomId', chatRoomsController.getRoom);

// Get chat history for a room
router.get('/:roomId/history', chatRoomsController.getHistory);

// Join room by code
router.get('/join/:joinCode', chatRoomsController.joinRoom);

export default router;
