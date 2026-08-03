import { Router } from 'express';
import { recordEvent, getClassroomActivity, getStudentHistory, getConfusionAlerts } from './activity.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

// Used for REST fallback if sockets aren't preferred
router.post('/event', authenticate, recordEvent);

// For dashboards
router.get('/classroom/:classroomId', authenticate, getClassroomActivity);
router.get('/classroom/:classroomId/confusion', authenticate, getConfusionAlerts);
router.get('/student/:studentId/classroom/:classroomId', authenticate, authorize(['teacher']), getStudentHistory);

export default router;
