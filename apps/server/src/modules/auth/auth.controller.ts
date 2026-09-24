import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(2),
  role: z.enum(['teacher', 'student'])
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

const googleLoginSchema = z.object({
  credential: z.string().min(1, 'Google credential is required'),
  role: z.enum(['teacher', 'student']).optional()
});

/**
 * Authentication controller handling HTTP requests
 */
export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);
      const result = await AuthService.register(data);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);
      const result = await AuthService.login(data.email, data.password);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  static async loginWithGoogle(req: Request, res: Response, next: NextFunction) {
    try {
      const data = googleLoginSchema.parse(req.body);
      const result = await AuthService.loginWithGoogle(data.credential, data.role);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message || 'Google authentication failed' });
    }
  }

  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.getProfile((req as any).user.userId);
      if (!user) {
         res.status(404).json({ error: 'User not found' });
         return;
      }
      res.status(200).json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = z.object({ email: z.string().email() }).parse(req.body);
      const result = await AuthService.requestPasswordReset(email);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = z
        .object({ token: z.string().min(1), newPassword: z.string().min(6) })
        .parse(req.body);
      const result = await AuthService.resetPassword(token, newPassword);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = (req as any).token;
      if (token) {
        const { BlacklistService } = await import('./tokenBlacklist.service');
        BlacklistService.add(token);
      }
      res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
