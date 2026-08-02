import { Request, Response } from 'express';
import { z } from 'zod';
import { classroomService } from './classroom.service';

const createSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional()
});

const joinSchema = z.object({
  joinCode: z.string().min(1, 'Join code is required')
});

export const classroomController = {
  async create(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const validated = createSchema.parse(req.body);
      
      const classroom = await classroomService.createClassroom(
        user.userId,
        validated.name,
        validated.description
      );
      
      res.status(201).json(classroom);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  },

  async list(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      let classrooms;
      
      if (user.role === 'teacher') {
        classrooms = await classroomService.getClassroomsByTeacher(user.userId);
      } else if (user.role === 'student') {
        classrooms = await classroomService.getClassroomsByStudent(user.userId);
      } else {
        res.status(403).json({ message: 'Invalid role' });
        return;
      }
      
      res.status(200).json(classrooms);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      
      const classroom = await classroomService.getClassroomById(id);
      if (!classroom) {
        res.status(404).json({ message: 'Classroom not found' });
        return;
      }

      // Authorization check
      if (user.role === 'teacher') {
        if (classroom.teacher_id !== user.userId) {
          res.status(403).json({ message: 'Forbidden' });
          return;
        }
      } else if (user.role === 'student') {
        const isEnrolled = classroom.students.some((s: any) => s.id === user.userId);
        if (!isEnrolled) {
          res.status(403).json({ message: 'Forbidden' });
          return;
        }
      }

      res.status(200).json(classroom);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  async join(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const validated = joinSchema.parse(req.body);
      
      const result = await classroomService.joinClassroom(user.userId, validated.joinCode);
      
      if (result.error === 'NOT_FOUND') {
        res.status(404).json({ message: result.message });
      } else if (result.error === 'ALREADY_ENROLLED') {
        res.status(409).json({ message: result.message });
      } else {
        res.status(200).json({ success: true, classroomId: result.classroomId });
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ errors: error.errors });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      
      // 1. Verify user is a teacher
      if (user.role !== 'teacher') {
        res.status(403).json({ message: 'Only teachers can delete classrooms' });
        return;
      }

      // 2. Fetch classroom to verify ownership
      const classroom = await classroomService.getClassroomById(id);
      if (!classroom) {
        res.status(404).json({ message: 'Classroom not found' });
        return;
      }

      if (classroom.teacher_id !== user.userId) {
        res.status(403).json({ message: 'Forbidden: You do not own this classroom' });
        return;
      }

      // 3. Delete it
      await classroomService.deleteClassroom(id);
      res.status(200).json({ success: true, message: 'Classroom deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};
