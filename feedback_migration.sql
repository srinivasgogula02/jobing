-- Supabase Migration: Feedback Table
-- Stores user feedback collected from the /feedback page. Designed for triage:
-- every row carries enough context (rating, category, page, user) to act on it.

-- 1. Create the feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    -- Who (all optional — anonymous feedback is allowed and encouraged).
    user_id text,                  -- Clerk user id when signed in, else null
    email text,                    -- optional, for follow-up
    name text,                     -- optional display name
    -- What they said.
    rating smallint CHECK (rating BETWEEN 1 AND 5),  -- 1 = terrible .. 5 = amazing
    category text NOT NULL DEFAULT 'other'
        CHECK (category IN ('bug', 'idea', 'ux', 'pricing', 'praise', 'other')),
    message text NOT NULL,
    -- Context captured to make the feedback actionable.
    page text,                     -- the page they came from
    user_agent text,               -- browser/device for repro of bugs
    -- Triage workflow.
    status text NOT NULL DEFAULT 'new'
        CHECK (status IN ('new', 'reviewing', 'resolved', 'wont_fix', 'spam')),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Helpful indexes for the triage dashboard.
CREATE INDEX IF NOT EXISTS feedback_created_at_idx ON feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS feedback_status_idx ON feedback (status);
CREATE INDEX IF NOT EXISTS feedback_category_idx ON feedback (category);

-- 3. Row Level Security. Inserts/reads go through the service-role admin client,
--    which bypasses RLS. We still enable RLS and deny anon access so that the
--    table is never readable with the public anon key (feedback can be sensitive).
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- No SELECT/INSERT/UPDATE policies for anon/authenticated => denied by default.
-- Only the service role (used server-side) can touch this table. This keeps
-- raw feedback private while still letting the server write and read it.
