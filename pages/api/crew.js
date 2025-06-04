// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check for authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized - Please log in' });
    }

    // Extract the message from the request body
    const { message } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Invalid request - message is required and must be a string' });
    }

    // Get the backend URL from environment variables with fallback
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    console.log('Using backend URL:', backendUrl);
    
    // Forward request to the backend
    const response = await fetch(`${backendUrl}/run-crew/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    // Log response status for debugging
    console.log('Backend response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Backend error details:', errorData);
      throw new Error(errorData.error || errorData.detail || 'Backend API request failed');
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ 
      error: 'Failed to process your request',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 