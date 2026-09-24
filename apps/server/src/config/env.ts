import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3001'),
  DATABASE_URL: z.string().default('postgresql://classroom_user:classroom_pass@localhost:5432/classroom_db'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  ENCRYPTION_KEY: z.string().default('0123456789abcdef0123456789abcdef'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development')
});

const parsedEnv = {
  ...process.env,
  JWT_SECRET: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? undefined : 'dev_fallback_secret_key_change_in_prod_12345')
};

const _env = envSchema.safeParse(parsedEnv);

if (!_env.success) {
  console.error('Invalid environment variables:', _env.error.format());
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

if (_env.data?.JWT_SECRET.includes('dev_fallback')) {
  console.warn('⚠️ WARNING: Using development fallback JWT_SECRET. Set JWT_SECRET in .env for production.');
}

export const env = _env.data!;
