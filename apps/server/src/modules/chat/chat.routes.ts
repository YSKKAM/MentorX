import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { getHistory } from './chat.controller';

const router = Router();

// Apply authentication middleware to all chat routes
router.use(authenticate);

// Get chat history for a classroom
router.get('/classroom/:classroomId', getHistory);

export default router;
