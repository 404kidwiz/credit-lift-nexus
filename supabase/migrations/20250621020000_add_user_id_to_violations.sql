-- Add user_id column to violations table
ALTER TABLE violations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update RLS policies for violations table
DROP POLICY IF EXISTS "Users can view their own violations" ON violations;
DROP POLICY IF EXISTS "Users can insert their own violations" ON violations;
DROP POLICY IF EXISTS "Users can update their own violations" ON violations;
DROP POLICY IF EXISTS "Users can delete their own violations" ON violations;

-- Create new RLS policies for violations table
CREATE POLICY "Users can view their own violations" ON violations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own violations" ON violations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own violations" ON violations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own violations" ON violations
  FOR DELETE USING (auth.uid() = user_id); 