import { supabase } from '../../lib/supabase';
import { withSecurityHeaders } from '../../lib/securityMiddleware';
import { isSuspiciousEmail, isSuspiciousName, calculateRiskScore } from '../../lib/securityUtils';

// Simple in-memory rate limiting
const rateLimit = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5, // 5 requests per IP per minute
  cache: new Map(),
  isRateLimited: function(ip) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.cache.has(ip)) {
      this.cache.set(ip, [now]);
      return false;
    }
    
    // Clean up old entries
    const requests = this.cache.get(ip).filter(time => time > windowStart);
    
    // Check if rate limited
    if (requests.length >= this.maxRequests) {
      return true;
    }
    
    // Add current request
    requests.push(now);
    this.cache.set(ip, requests);
    return false;
  }
};

async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Get client IP for rate limiting
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const referer = req.headers.referer || 'direct';
  
  // Check rate limit
  if (rateLimit.isRateLimited(ip)) {
    return res.status(429).json({ 
      error: 'Too many requests', 
      message: 'Please try again later' 
    });
  }

  try {
    const { name, email } = req.body;

    // Enhanced validation
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    if (!/^[\w\s-]{2,50}$/.test(name)) {
      return res.status(400).json({ 
        error: 'Invalid name format',
        message: 'Name must be between 2-50 characters and contain only letters, numbers, spaces, and hyphens'
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Sanitize inputs (basic)
    const sanitizedName = name.trim();
    const sanitizedEmail = email.trim().toLowerCase();
    
    // Check for suspicious patterns
    if (isSuspiciousEmail(sanitizedEmail)) {
      console.warn(`Suspicious email detected: ${sanitizedEmail}`);
      // We still allow the signup but flag it
    }
    
    if (isSuspiciousName(sanitizedName)) {
      console.warn(`Suspicious name detected: ${sanitizedName}`);
      // We still allow the signup but flag it
    }
    
    // Calculate risk score
    const riskScore = calculateRiskScore({
      email: sanitizedEmail,
      name: sanitizedName,
      referrer: referer,
      userAgent
    });

    // Insert into Supabase with security data
    const { data, error } = await supabase
      .from('waitlist')
      .insert([
        { 
          name: sanitizedName, 
          email: sanitizedEmail, 
          signed_up_at: new Date().toISOString(),
          signup_source: referer,
          ip_address: ip,
          user_agent: userAgent,
          risk_score: riskScore
        }
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

    // Log signup for analytics but don't include PII
    console.log(`New waitlist signup: ${new Date().toISOString()} [Referrer: ${referer}] [Risk: ${riskScore}]`);

    return res.status(200).json({ success: true, message: 'Added to waitlist successfully' });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

// Apply security headers to all responses
export default withSecurityHeaders(handler); 