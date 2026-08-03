import { Request, Response } from 'express';
import { checkAssignmentPlagiarism } from './plagiarism.service';

export const plagiarismController = {
  async runAssignmentCheck(req: Request, res: Response) {
    try {
      const { assignmentId } = req.params;
      const results = await checkAssignmentPlagiarism(assignmentId);
      res.status(200).json({ results });
    } catch (error: any) {
      console.error('Plagiarism check error:', error);
      res.status(500).json({ message: 'Failed to perform plagiarism check: ' + (error?.message || error) });
    }
  }
};
