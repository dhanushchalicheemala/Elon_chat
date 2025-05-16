-- First, remove any existing policies on the waitlist table
DROP POLICY IF EXISTS "Allow public inserts to waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Only admins can read waitlist" ON public.waitlist;

-- Create policy for inserting that explicitly allows anonymous users to insert
CREATE POLICY "Allow public inserts to waitlist" 
  ON public.waitlist FOR INSERT 
  TO anon
  WITH CHECK (true);

-- Create policy for selecting (only authenticated users can read)
CREATE POLICY "Only authenticated users can read waitlist" 
  ON public.waitlist FOR SELECT 
  TO authenticated
  USING (true); 