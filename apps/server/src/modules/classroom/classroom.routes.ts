import { Router } from 'express';
import { classroomController } from './classroom.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

router.post('/', authenticate, authorize(['teacher']), classroomController.create);
router.get('/', authenticate, classroomController.list);
router.post('/join', authenticate, authorize(['student']), classroomController.join);
router.get('/:id', authenticate, classroomController.getById);
router.delete('/:id', authenticate, authorize(['teacher']), classroomController.delete);

export default router;
