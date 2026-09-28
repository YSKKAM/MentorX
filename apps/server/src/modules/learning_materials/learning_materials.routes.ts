import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { learningMaterialsController } from './learning_materials.controller';
import { authenticate } from '../../middleware/authenticate';

const uploadDir = path.join(process.cwd(), 'uploads', 'materials');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (['.pdf', '.docx'].includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Please upload a PDF or DOCX file.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB
  },
});

const router = Router();

// Require authentication for all learning materials endpoints
router.use(authenticate);

// Upload material to a classroom
router.post('/classroom/:classroomId', upload.single('file'), learningMaterialsController.upload);

// Get all materials for a classroom
router.get('/classroom/:classroomId', learningMaterialsController.getByClassroom);

// Get single material details with topics
router.get('/:id', learningMaterialsController.getById);

// Delete material
router.delete('/:id', learningMaterialsController.deleteMaterial);

// Generate questions for material
router.post('/:id/generate-questions', learningMaterialsController.generateQuestions);

// Get all generated questions for material
router.get('/:id/questions', learningMaterialsController.getQuestions);

// Update single question (Edit / Approve / Reject)
router.patch('/questions/:questionId', learningMaterialsController.updateQuestion);

// Regenerate single question
router.post('/questions/:questionId/regenerate', learningMaterialsController.regenerateQuestion);

// Delete single question
router.delete('/questions/:questionId', learningMaterialsController.deleteQuestion);

// Create Quiz Assignment from approved questions
router.post('/:id/create-quiz', learningMaterialsController.createQuiz);

export const learningMaterialRoutes = router;
