-- First, remove any existing policies on the waitlist table
DROP POLICY IF EXISTS "Allow public inserts to waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Only admins can read waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Only authenticated users can read waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Only authenticated users can update waitlist" ON public.waitlist;

-- Add security columns if they don't exist
ALTER TABLE public.waitlist 
ADD COLUMN IF NOT EXISTS signup_source TEXT,
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS risk_score INTEGER;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS waitlist_email_idx ON public.waitlist (email);
-- Create index on risk_score for filtering high-risk entries
CREATE INDEX IF NOT EXISTS waitlist_risk_idx ON public.waitlist (risk_score);

-- Create policy that explicitly allows anonymous users to insert with restrictions
CREATE POLICY "Allow public inserts to waitlist" 
  ON public.waitlist FOR INSERT 
  TO anon
  WITH CHECK (
    -- Basic validation in the database as a second layer of protection
    length(email) > 5 AND 
    length(email) < 255 AND
    email LIKE '%@%.%' AND
    length(name) > 1 AND
    length(name) < 100
  );

-- Create policy for selecting (only authenticated users can read)
CREATE POLICY "Only authenticated users can read waitlist" 
  ON public.waitlist FOR SELECT 
  TO authenticated
  USING (true);

-- Create policy for updates (only authenticated users can update)
CREATE POLICY "Only authenticated users can update waitlist" 
  ON public.waitlist FOR UPDATE
  TO authenticated
  USING (true);

-- Create a secure view for analytics that doesn't expose PII
CREATE OR REPLACE VIEW public.waitlist_analytics AS
SELECT 
  date_trunc('day', signed_up_at) as signup_date,
  signup_source,
  count(*) as signups,
  avg(risk_score) as avg_risk
FROM 
  public.waitlist
GROUP BY 
  date_trunc('day', signed_up_at),
  signup_source;

-- Create a view for high-risk entries that need review
CREATE OR REPLACE VIEW public.waitlist_high_risk AS
SELECT 
  id,
  email,
  name,
  signed_up_at,
  signup_source,
  ip_address,
  risk_score
FROM 
  public.waitlist
WHERE 
  risk_score > 50
ORDER BY
  risk_score DESC,
  signed_up_at DESC;

-- Grant access to the analytics views
GRANT SELECT ON public.waitlist_analytics TO authenticated;
GRANT SELECT ON public.waitlist_high_risk TO authenticated; 