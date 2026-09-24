import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { query } from '../../config/database';
import { env } from '../../config/env';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

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

  static async loginWithGoogle(credential: string, requestedRole?: string) {
    let email: string;
    let displayName: string;
    let googleId: string;
    let avatarUrl: string | undefined;

    // Support dev/demo token in non-production for instant local testing without Google Client ID
    if (env.NODE_ENV !== 'production' && credential.startsWith('demo-google-token:')) {
      const parts = credential.split(':');
      email = parts[1] || 'google.demo@mentorx.edu';
      displayName = parts[2] || 'Google Demo User';
      googleId = 'demo-google-' + email;
      avatarUrl = 'https://api.dicebear.com/7.x/bottts/svg?seed=' + encodeURIComponent(email);
    } else {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: env.GOOGLE_CLIENT_ID ? env.GOOGLE_CLIENT_ID : undefined,
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
          throw new Error('Invalid Google token payload');
        }
        email = payload.email;
        displayName = payload.name || payload.given_name || email.split('@')[0];
        googleId = payload.sub;
        avatarUrl = payload.picture;
      } catch (err: any) {
        // Fallback check against Google tokeninfo endpoint if verifyIdToken fails without audience
        try {
          const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
          if (!res.ok) {
            throw new Error('Google token verification failed');
          }
          const data: any = await res.json();
          if (!data.email) {
            throw new Error('Google token missing email');
          }
          email = data.email;
          displayName = data.name || data.given_name || email.split('@')[0];
          googleId = data.sub;
          avatarUrl = data.picture;
        } catch {
          throw new Error('Invalid Google credentials. Token verification failed.');
        }
      }
    }

    // 1. Check if user exists by google_id
    const googleUserRes = await query('SELECT * FROM users WHERE google_id = $1', [googleId]);
    let user = googleUserRes.rows[0];

    if (user) {
      // User found by google_id: sync avatar or display name if missing
      if (avatarUrl && !user.avatar_url) {
        await query('UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2', [avatarUrl, user.id]);
        user.avatar_url = avatarUrl;
      }
    } else {
      // 2. Check if user already exists by email (e.g. registered previously with email/password)
      const emailUserRes = await query('SELECT * FROM users WHERE email = $1', [email]);
      if (emailUserRes.rows.length > 0) {
        user = emailUserRes.rows[0];
        // Link google_id and avatar to the existing account
        await query(
          'UPDATE users SET google_id = $1, avatar_url = COALESCE(avatar_url, $2), updated_at = NOW() WHERE id = $3',
          [googleId, avatarUrl, user.id]
        );
        user.google_id = googleId;
        if (avatarUrl) user.avatar_url = avatarUrl;
      } else {
        // 3. Brand new user -> Register via Google
        const role = requestedRole === 'teacher' ? 'teacher' : 'student';
        const insertRes = await query(
          `INSERT INTO users (email, display_name, role, google_id, avatar_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, email, display_name, role, google_id, avatar_url, created_at, updated_at`,
          [email, displayName, role, googleId, avatarUrl || null]
        );
        user = insertRes.rows[0];
      }
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
