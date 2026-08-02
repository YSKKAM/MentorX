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

  static generateToken(user: any) {
    return jwt.sign(
      { userId: user.id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }
}
