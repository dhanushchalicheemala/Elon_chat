# Elon Musk AI Chatbot

A chatbot that answers questions about Elon Musk using AI.

## Features

- Landing page with waitlist signup
- AI-powered chatbot based on Elon Musk's knowledge
- User authentication (coming soon)
- Real-time news and updates

## Getting Started

### Prerequisites

- Node.js 14+ and npm
- A Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/dhanushchalicheemala/Elon_chat.git
   cd Elon_chat
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

4. Set up your Supabase project:
   - Create a new project in Supabase
   - In SQL Editor, create a waitlist table with the following SQL command:

   ```sql
   CREATE TABLE waitlist (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     name TEXT NOT NULL,
     email TEXT NOT NULL UNIQUE,
     signed_up_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     status TEXT DEFAULT 'pending'
   );
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Pages

- `/` - Landing page with waitlist signup
- `/chat` - The main chat interface with the Elon Musk AI

## Tech Stack

- Next.js - Frontend framework
- Tailwind CSS - Styling
- Supabase - Database and authentication
- CrewAI - AI orchestration 