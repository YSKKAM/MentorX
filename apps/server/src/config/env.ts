import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3001'),
  DATABASE_URL: z.string().default('postgresql://classroom_user:classroom_pass@localhost:5432/classroom_db'),
  JWT_SECRET: z.string().default('supersecretjwtkey'),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  ENCRYPTION_KEY: z.string().default('0123456789abcdef0123456789abcdef'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('Invalid environment variables:', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
