import { Pool } from 'pg';
import { env } from './env';
import fs from 'fs/promises';
import path from 'path';

export const sanitizeDatabaseUrl = (rawUrl: string): string => {
  if (!rawUrl) return rawUrl;
  let url = rawUrl.trim();

  // Strip wrapping single or double quotes
  if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
    url = url.slice(1, -1).trim();
  }

  // Strip leading "DATABASE_URL=" if mistakenly included in Render environment variable value
  if (url.startsWith('DATABASE_URL=')) {
    url = url.slice('DATABASE_URL='.length).trim();
    if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
      url = url.slice(1, -1).trim();
    }
  }

  // Strip leading "psql " or "$ psql " if copied from CLI snippet
  url = url.replace(/^(\$\s*)?psql\s+/, '').trim();
  if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
    url = url.slice(1, -1).trim();
  }

  // Handle unencoded special characters (e.g. #, ?, %) in password
  // postgresql://[user]:[password]@[host]:[port]/[database]
  const regex = /^(postgres(?:ql)?:\/\/)([^:]+):([^@]+)@(.+)$/i;
  const match = url.match(regex);
  if (match) {
    const [, protocol, username, password, hostAndRest] = match;
    const safeUser = encodeURIComponent(decodeURIComponent(username));
    const safePass = encodeURIComponent(decodeURIComponent(password));
    url = `${protocol}${safeUser}:${safePass}@${hostAndRest}`;
  }

  return url;
};

const sanitizedDatabaseUrl = sanitizeDatabaseUrl(env.DATABASE_URL);

const useSsl =
  sanitizedDatabaseUrl.includes('neon.tech') ||
  sanitizedDatabaseUrl.includes('sslmode=require') ||
  (env.NODE_ENV === 'production' && !sanitizedDatabaseUrl.includes('localhost') && !sanitizedDatabaseUrl.includes('127.0.0.1'));

const pool = new Pool({
  connectionString: sanitizedDatabaseUrl,
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

