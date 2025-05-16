// check-setup.js
const fs = require('fs');
const path = require('path');

console.log('\n📋 Checking Supabase environment setup...\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
let envFileExists = false;
let supabaseUrlSet = false;
let supabaseKeySet = false;

try {
  if (fs.existsSync(envPath)) {
    envFileExists = true;
    console.log('✅ .env.local file exists');
    
    // Read .env.local content
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Check if Supabase URL is set
    if (envContent.includes('NEXT_PUBLIC_SUPABASE_URL=') && 
        !envContent.includes('NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co')) {
      supabaseUrlSet = true;
      console.log('✅ Supabase URL is set');
    } else {
      console.log('❌ Supabase URL is not set properly');
    }
    
    // Check if Supabase Anon Key is set
    if (envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=') && 
        !envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key')) {
      supabaseKeySet = true;
      console.log('✅ Supabase Anon Key is set');
    } else {
      console.log('❌ Supabase Anon Key is not set properly');
    }
  } else {
    console.log('❌ .env.local file does not exist');
  }
} catch (error) {
  console.error('Error checking environment setup:', error);
}

// Display next steps
console.log('\n📝 Next steps:');

if (!envFileExists) {
  console.log('1. Run "node setup-env.js" to create your .env.local file');
  console.log('2. Update the .env.local file with your Supabase credentials');
} else if (!supabaseUrlSet || !supabaseKeySet) {
  console.log('1. Update the .env.local file with your Supabase credentials:');
  console.log('   - NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co');
  console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key');
} else {
  console.log('1. Your environment is properly set up! 🎉');
}

console.log('2. Set up your Supabase database by running the SQL commands in supabase-setup.sql');
console.log('3. Restart your Next.js server with "npm run dev"');

console.log('\n📊 Supabase Database Setup:');
console.log('1. Go to https://app.supabase.com/ and select your project');
console.log('2. Navigate to SQL Editor');
console.log('3. Copy the contents of supabase-setup.sql and paste into the editor');
console.log('4. Run the SQL to create your waitlist table'); 