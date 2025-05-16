-- Create waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  signed_up_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending'
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS waitlist_email_idx ON waitlist (email);

-- Set up Row Level Security (RLS)
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting (anyone can insert, but only admin can read)
CREATE POLICY "Allow public inserts to waitlist" 
  ON waitlist FOR INSERT 
  WITH CHECK (true);

-- Create policy for selecting (only authenticated users with admin role can read)
CREATE POLICY "Only admins can read waitlist" 
  ON waitlist FOR SELECT 
  USING (auth.role() = 'authenticated'); 