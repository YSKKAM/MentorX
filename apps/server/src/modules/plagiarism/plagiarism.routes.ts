import { Router } from 'express';
import { plagiarismController } from './plagiarism.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

router.use(authenticate);
router.use(authorize(['teacher']));

router.post('/assignment/:assignmentId', plagiarismController.runAssignmentCheck);

export const plagiarismRoutes = router;
