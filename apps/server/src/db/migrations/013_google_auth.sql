-- 013_google_auth.sql: Support Google OAuth 2.0 Sign In

-- 1. Allow password_hash to be nullable for users who register/login via Google OAuth
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- 2. Add google_id and avatar_url columns if they do not exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 3. Add an index for rapid lookups by google_id
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
