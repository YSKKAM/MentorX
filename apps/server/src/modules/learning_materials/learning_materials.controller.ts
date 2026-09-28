import { Request, Response } from 'express';
import { learningMaterialsService } from './learning_materials.service';
import { classroomService } from '../classroom/classroom.service';

export const learningMaterialsController = {
  /**
   * Upload learning material
   */
  async upload(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { classroomId } = req.params;

      if (!req.file) {
        res.status(400).json({ message: 'No file uploaded. Please select a PDF or DOCX file.' });
        return;
      }

      const classroom = await classroomService.getClassroomById(classroomId);
      if (!classroom || classroom.teacher_id !== user.userId) {
        res.status(403).json({ message: 'Only the classroom teacher can upload learning materials.' });
        return;
      }

      const material = await learningMaterialsService.createMaterial(classroomId, req.file);
      res.status(201).json(material);
    } catch (error: any) {
      console.error('Material upload error:', error);
      res.status(500).json({ message: error.message || 'Failed to upload material' });
    }
  },

  /**
   * Get all materials for a classroom
   */
  async getByClassroom(req: Request, res: Response) {
    try {
      const { classroomId } = req.params;
      const materials = await learningMaterialsService.getMaterialsByClassroom(classroomId);
      res.status(200).json(materials);
    } catch (error: any) {
      console.error('Fetch materials error:', error);
      res.status(500).json({ message: 'Failed to fetch learning materials' });
    }
  },

  /**
   * Get details of a single material
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const material = await learningMaterialsService.getMaterialById(id);
      if (!material) {
        res.status(404).json({ message: 'Material not found' });
        return;
      }
      res.status(200).json(material);
    } catch (error: any) {
      console.error('Fetch material details error:', error);
      res.status(500).json({ message: 'Failed to fetch material details' });
    }
  },

  /**
   * Delete a material
   */
  async deleteMaterial(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;

      const material = await learningMaterialsService.getMaterialById(id);
      if (!material) {
        res.status(404).json({ message: 'Material not found' });
        return;
      }

      const classroom = await classroomService.getClassroomById(material.classroom_id);
      if (!classroom || classroom.teacher_id !== user.userId) {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }

      await learningMaterialsService.deleteMaterial(id);
      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Delete material error:', error);
      res.status(500).json({ message: 'Failed to delete material' });
    }
  },

  /**
   * Generate questions from material
   */
  async generateQuestions(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;

      const material = await learningMaterialsService.getMaterialById(id);
      if (!material) {
        res.status(404).json({ message: 'Material not found' });
        return;
      }

      const classroom = await classroomService.getClassroomById(material.classroom_id);
      if (!classroom || classroom.teacher_id !== user.userId) {
        res.status(403).json({ message: 'Only the classroom teacher can generate questions.' });
        return;
      }

      const questions = await learningMaterialsService.generateQuestions(id, req.body);
      res.status(201).json(questions);
    } catch (error: any) {
      console.error('Generate questions error:', error);
      res.status(500).json({ message: error.message || 'Failed to generate questions' });
    }
  },

  /**
   * Get generated questions for a material
   */
  async getQuestions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const questions = await learningMaterialsService.getQuestions(id);
      res.status(200).json(questions);
    } catch (error: any) {
      console.error('Fetch questions error:', error);
      res.status(500).json({ message: 'Failed to fetch questions' });
    }
  },

  /**
   * Update a question (Edit / Change Status)
   */
  async updateQuestion(req: Request, res: Response) {
    try {
      const { questionId } = req.params;
      const updated = await learningMaterialsService.updateQuestion(questionId, req.body);
      res.status(200).json(updated);
    } catch (error: any) {
      console.error('Update question error:', error);
      res.status(500).json({ message: 'Failed to update question' });
    }
  },

  /**
   * Regenerate only a single question
   */
  async regenerateQuestion(req: Request, res: Response) {
    try {
      const { questionId } = req.params;
      const regenerated = await learningMaterialsService.regenerateQuestion(questionId);
      res.status(200).json(regenerated);
    } catch (error: any) {
      console.error('Regenerate question error:', error);
      res.status(500).json({ message: error.message || 'Failed to regenerate question' });
    }
  },

  /**
   * Delete a question
   */
  async deleteQuestion(req: Request, res: Response) {
    try {
      const { questionId } = req.params;
      await learningMaterialsService.deleteQuestion(questionId);
      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Delete question error:', error);
      res.status(500).json({ message: 'Failed to delete question' });
    }
  },

  /**
   * Create Quiz Assignment from approved questions
   */
  async createQuiz(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;

      const material = await learningMaterialsService.getMaterialById(id);
      if (!material) {
        res.status(404).json({ message: 'Material not found' });
        return;
      }

      const classroom = await classroomService.getClassroomById(material.classroom_id);
      if (!classroom || classroom.teacher_id !== user.userId) {
        res.status(403).json({ message: 'Only the classroom teacher can create assignments.' });
        return;
      }

      const result = await learningMaterialsService.createQuizAssignment(material.classroom_id, id, req.body);
      res.status(201).json(result);
    } catch (error: any) {
      console.error('Create quiz error:', error);
      res.status(500).json({ message: error.message || 'Failed to create quiz assignment' });
    }
  },
};
