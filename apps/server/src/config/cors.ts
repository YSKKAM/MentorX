import { env } from './env';

const configuredOrigins = (env.CLIENT_URL || '')
  .split(',')
  .map((url) => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

/**
 * Determine if an origin is allowed by CORS policy
 */
export const isOriginAllowed = (origin?: string): boolean => {
  if (!origin) return true;
  if (process.env.NODE_ENV !== 'production') return true;
  if (configuredOrigins.includes(origin) || configuredOrigins.includes('*')) return true;
  if (origin === 'http://localhost:3000' || origin === 'http://127.0.0.1:3000') return true;

  try {
    const parsed = new URL(origin);
    if (parsed.hostname.endsWith('.vercel.app')) return true;
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') return true;
  } catch {
    // Invalid URL format
  }

  return false;
};

/**
 * Express CORS options with dynamic origin matching
 */
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
};
