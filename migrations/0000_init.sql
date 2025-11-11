-- Create the pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- sessions table
CREATE TABLE IF NOT EXISTS "sessions" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- messages table
CREATE TABLE IF NOT EXISTS "messages" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "role" text NOT NULL,
  "content" text NOT NULL,
  "citations" jsonb,
  "timestamp" timestamp NOT NULL DEFAULT now(),
  "session_id" varchar NOT NULL
);

-- users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "username" text NOT NULL UNIQUE,
  "password" text NOT NULL
);

