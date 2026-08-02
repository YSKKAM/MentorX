import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { analyzeError, enhance } from './ai.controller';
import { generatePreview } from './ai.chat.controller';

const router = Router();

router.use(authenticate);

// Route for analyzing errors
router.post('/analyze-error', analyzeError);

// Route for enhancing text
router.post('/enhance', enhance);

// Route for generating AI Chat preview
router.post('/chat/preview', generatePreview);

export default router;
