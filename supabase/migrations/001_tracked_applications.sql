-- Create tracked_applications table for the auto-apply audit trail
CREATE TABLE IF NOT EXISTS tracked_applications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id  TEXT,
  job_title   TEXT,
  company     TEXT,
  job_url     TEXT,
  status      TEXT NOT NULL DEFAULT 'submitted',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE tracked_applications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own applications
CREATE POLICY "Users can view own applications"
  ON tracked_applications FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own applications
CREATE POLICY "Users can insert own applications"
  ON tracked_applications FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_tracked_applications_user_id ON tracked_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_tracked_applications_status ON tracked_applications(status);
CREATE INDEX IF NOT EXISTS idx_tracked_applications_created_at ON tracked_applications(created_at DESC);
