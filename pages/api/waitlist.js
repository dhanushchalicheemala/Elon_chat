import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email } = req.body;

    // Validate inputs
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Insert into Supabase
    const { data, error } = await supabase
      .from('waitlist')
      .insert([
        { name, email, signed_up_at: new Date().toISOString() }
      ]);

    if (error) {
      console.error('Supabase error:', error);
      
      // Check for duplicate email error
      if (error.code === '23505') {
        return res.status(409).json({ error: 'This email is already on the waitlist' });
      }
      
      // RLS policy error
      if (error.code === '42501') {
        return res.status(500).json({ 
          error: 'Database security policy error. Please check Supabase RLS settings.',
          details: 'You need to disable Row Level Security or create an INSERT policy for the waitlist table'
        });
      }

      return res.status(500).json({ error: 'Failed to add to waitlist' });
    }

    return res.status(200).json({ success: true, message: 'Added to waitlist successfully' });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
} 