-- Enable RLS on all tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_attempts ENABLE ROW LEVEL SECURITY;

-- We intentionally DO NOT create any policies for 'anon' or 'authenticated' roles.
-- This effectively blocks all direct access from the browser (Supabase Client).
-- Access is only allowed via the Service Role Key (used in Next.js API Routes), which bypasses RLS.
