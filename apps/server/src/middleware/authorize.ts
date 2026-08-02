import { Request, Response, NextFunction } from 'express';

/**
 * Middleware factory for role-based authorization
 */
export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user || !allowedRoles.includes(user.role)) {
       res.status(403).json({ error: 'Forbidden' });
       return;
    }
    
    next();
  };
};
