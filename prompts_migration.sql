-- Supabase Migration: Prompts Table

-- 1. Create the prompts table
CREATE TABLE IF NOT EXISTS prompts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id text REFERENCES users(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    output_type text NOT NULL CHECK (output_type IN ('chat', 'image', 'video')),
    prompt_text text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies

-- Allow users to view all prompts (since it is a marketplace, they might be public or verifiable later)
-- For now, allow public read access (you can restrict this based on business logic)
CREATE POLICY "Public profiles are viewable by everyone."
ON prompts FOR SELECT
USING (true);

-- Allow authenticated users to insert their own prompts
CREATE POLICY "Users can insert their own prompts."
ON prompts FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- Allow users to update their own prompts
CREATE POLICY "Users can update their own prompts."
ON prompts FOR UPDATE
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- Allow users to delete their own prompts
CREATE POLICY "Users can delete their own prompts."
ON prompts FOR DELETE
USING (auth.uid()::text = user_id);

-- 4. Create an index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON prompts(user_id);
