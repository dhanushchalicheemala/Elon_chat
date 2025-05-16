// check-tables.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if the environment variables are set
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not found in .env.local file');
  process.exit(1);
}

// Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('🔍 Checking Supabase tables...');
  
  try {
    // Query the waitlist table to see if it exists
    const { data, error, status } = await supabase
      .from('waitlist')
      .select('id')
      .limit(1);
    
    if (error && error.code === '42P01') {
      // Error code 42P01 means relation does not exist
      console.error('❌ The waitlist table does not exist in your Supabase database');
      console.log('\nPlease run the SQL commands in supabase-setup.sql to create the table');
      return false;
    } else if (error) {
      console.error('❌ Error checking waitlist table:', error.message);
      return false;
    }
    
    console.log('✅ Waitlist table exists in your Supabase database');
    
    // Check for any entries
    if (data && data.length > 0) {
      console.log(`ℹ️ The waitlist table has ${data.length} entries`);
    } else {
      console.log('ℹ️ The waitlist table exists but has no entries yet');
    }
    
    return true;
  } catch (err) {
    console.error('❌ Error connecting to Supabase:', err.message);
    return false;
  }
}

// Execute the check
checkTables(); 