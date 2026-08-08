import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { BlacklistService } from '../modules/auth/tokenBlacklist.service';

/**
 * Middleware to authenticate JWT token
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
       res.status(401).json({ error: 'Authentication required' });
       return;
    }

    const token = authHeader.split(' ')[1];
    
    if (BlacklistService.isBlacklisted(token)) {
      res.status(401).json({ error: 'Token has been revoked/logged out' });
      return;
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    (req as any).user = decoded;
    (req as any).token = token;
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
