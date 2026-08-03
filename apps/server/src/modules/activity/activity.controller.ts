import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as activityService from './activity.service';

const eventSchema = z.object({
  classroomId: z.string().uuid(),
  language: z.string().optional(),
  status: z.string().optional(),
  currentFile: z.string().optional(),
  errors: z.array(z.any()).optional(),
  metadata: z.any().optional(),
});

/**
 * Handle recording a new activity event via REST API
 */
export const recordEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = eventSchema.parse(req.body);
    const userId = (req as any).user.userId;

    const activity = await activityService.recordActivity({
      student_id: userId,
      classroom_id: validatedData.classroomId,
      language: validatedData.language,
      status: validatedData.status,
      current_file: validatedData.currentFile,
      errors: validatedData.errors,
      metadata: validatedData.metadata,
    });

    res.status(201).json(activity);
  } catch (error) {
    next(error);
  }
};

/**
 * Handle fetching latest classroom activities
 */
export const getClassroomActivity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { classroomId } = req.params;
    const activities = await activityService.getLatestActivityByClassroom(classroomId);
    res.json(activities);
  } catch (error) {
    next(error);
  }
};

/**
 * Handle fetching real-time classroom confusion alerts
 */
export const getConfusionAlerts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { classroomId } = req.params;
    const { getConfusionAlertsForClassroom } = require('./confusion.service');
    const alerts = await getConfusionAlertsForClassroom(classroomId);
    res.json(alerts);
  } catch (error) {
    next(error);
  }
};

/**
 * Handle fetching activity history for a specific student
 */
export const getStudentHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { classroomId, studentId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const history = await activityService.getActivityHistory(studentId, classroomId, limit);
    res.json(history);
  } catch (error) {
    next(error);
  }
};
