// setup-env.js
const fs = require('fs');
const path = require('path');

console.log('Setting up environment variables for Supabase...');

// The content of the .env.local file
const envContent = `# Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Instructions:
# 1. Go to your Supabase project dashboard: https://app.supabase.com/
# 2. Navigate to Project Settings > API
# 3. Copy the URL under "Project URL" and replace above
# 4. Copy the "anon public" key and replace above
`;

// Write the .env.local file
const envPath = path.join(process.cwd(), '.env.local');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('\x1b[32m%s\x1b[0m', '✅ Created .env.local file successfully!');
  console.log('\nPlease edit the .env.local file with your actual Supabase credentials:');
  console.log('\x1b[33m%s\x1b[0m', '1. Get your Supabase project URL and anon key from https://app.supabase.com/');
  console.log('\x1b[33m%s\x1b[0m', '2. Navigate to Project Settings > API');
  console.log('\x1b[33m%s\x1b[0m', '3. Replace the placeholder values in .env.local with your actual values');
  console.log('\nAfter updating the .env.local file, restart your Next.js server with:');
  console.log('\x1b[36m%s\x1b[0m', 'npm run dev');
} catch (error) {
  console.error('\x1b[31m%s\x1b[0m', '❌ Error creating .env.local file:');
  console.error(error);
  process.exit(1);
} 