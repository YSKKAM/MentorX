import { Pool } from 'pg';
import { env } from './env';
import fs from 'fs/promises';
import path from 'path';

const useSsl =
  env.DATABASE_URL.includes('neon.tech') ||
  env.DATABASE_URL.includes('sslmode=require') ||
  (env.NODE_ENV === 'production' && !env.DATABASE_URL.includes('localhost') && !env.DATABASE_URL.includes('127.0.0.1'));

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});

/**
 * Execute a query with parameters
 */
export const query = (text: string, params?: any[]) => pool.query(text, params);

/**
 * Initialize database and run all migrations in order
 */
export const initDatabase = async () => {
  try {
    const candidates = [
      path.join(__dirname, '../db/migrations'),
      path.join(__dirname, '../../src/db/migrations'),
      path.join(process.cwd(), 'src/db/migrations'),
      path.join(process.cwd(), 'dist/db/migrations'),
    ];

    let migrationsDir = '';
    for (const dir of candidates) {
      try {
        const stat = await fs.stat(dir);
        if (stat.isDirectory()) {
          migrationsDir = dir;
          break;
        }
      } catch {
        // continue searching
      }
    }

    if (!migrationsDir) {
      throw new Error(`Could not find migrations directory in any candidate locations: ${candidates.join(', ')}`);
    }

    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();

    for (const file of sqlFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = await fs.readFile(filePath, 'utf8');
      await pool.query(sql);
      console.log(`Migration applied: ${file}`);
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
};

