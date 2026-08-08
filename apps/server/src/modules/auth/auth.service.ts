import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../../config/database';
import { env } from '../../config/env';

/**
 * Authentication service handling business logic
 */
export class AuthService {
  static async register(data: any) {
    const { email, password, displayName, role } = data;

    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      throw new Error('Email already registered');
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await query(
      'INSERT INTO users (email, password_hash, display_name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, display_name, role, created_at, updated_at',
      [email, passwordHash, displayName, role]
    );

    const user = result.rows[0];
    const token = this.generateToken(user);

    return { user, token };
  }

  static async login(email: string, password: string) {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    delete user.password_hash;
    const token = this.generateToken(user);

    return { user, token };
  }

  static async getProfile(userId: string) {
    const result = await query(
      'SELECT id, email, display_name, role, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0];
  }

  static async requestPasswordReset(email: string) {
    const userRes = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      // Return success even if email not found to prevent user enumeration attacks
      return { success: true, message: 'If that email exists, a reset link has been sent.' };
    }

    const userId = userRes.rows[0].id;
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await query('DELETE FROM password_reset_tokens WHERE user_id = $1', [userId]);
    await query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [userId, token, expiresAt]
    );

    return {
      success: true,
      token, // Return token for development/testing UI
      message: 'If that email exists, a reset link has been sent.'
    };
  }

  static async resetPassword(token: string, newPassword: string) {
    const tokenRes = await query(
      'SELECT * FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW()',
      [token]
    );

    if (tokenRes.rows.length === 0) {
      throw new Error('Invalid or expired password reset token');
    }

    const resetRecord = tokenRes.rows[0];
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [
      passwordHash,
      resetRecord.user_id,
    ]);

    await query('DELETE FROM password_reset_tokens WHERE id = $1', [resetRecord.id]);

    return { success: true, message: 'Password has been reset successfully.' };
  }

  static generateToken(user: any) {
    return jwt.sign(
      { userId: user.id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }
}
