import { Router } from 'express';
import { assignmentController } from './assignment.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();

// Require authentication for all assignment routes
router.use(authenticate);

// Create assignment for a classroom
router.post('/classroom/:classroomId', assignmentController.create);

// Get all assignments for a classroom
router.get('/classroom/:classroomId', assignmentController.getByClassroom);

// Get specific assignment details
router.get('/:id', assignmentController.getById);

// Delete specific assignment
router.delete('/:id', assignmentController.deleteAssignment);

// Publish assignment
router.post('/:id/publish', assignmentController.publish);

// Run visible test cases
router.post('/:id/run', assignmentController.run);

// Submit assignment
router.post('/:id/submit', assignmentController.submit);

// Request hint
router.post('/:id/hint', assignmentController.hint);

// Generate assignment with AI
router.post('/generate', assignmentController.generate);

// Get teacher analytics for an assignment
router.get('/:id/analytics', assignmentController.getAnalytics);

export const assignmentRoutes = router;
