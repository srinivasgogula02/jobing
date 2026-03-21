-- 1. Create follows table
CREATE TABLE IF NOT EXISTS follows (
    follower_id text REFERENCES users(id) ON DELETE CASCADE,
    following_id text REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (follower_id, following_id)
);

-- 2. Enable RLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Allow anyone to read follows
CREATE POLICY "Anyone can view follows" ON follows
    FOR SELECT USING (true);

-- Allow authenticated users to follow others (insert)
CREATE POLICY "Users can follow others" ON follows
    FOR INSERT WITH CHECK (auth.uid()::text = follower_id);

-- Allow users to unfollow (delete)
CREATE POLICY "Users can unfollow" ON follows
    FOR DELETE USING (auth.uid()::text = follower_id);
