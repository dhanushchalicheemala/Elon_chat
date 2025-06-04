# Elon Musk AI Chatbot

A Next.js application that allows users to chat with an AI trained on Elon Musk's knowledge, tweets, and interviews. This project uses CrewAI to create an intelligent agent that simulates conversations with Elon Musk based on his public statements, interviews, and tweets.

## Demo

![Elon Musk Chat Demo](elon%20chat.gif)

## Features

- Chat with an AI trained on Elon Musk's knowledge and personality
- Real-time responses powered by OpenAI's language models
- Multi-agent AI system using CrewAI framework
- Authentication using Supabase with Google OAuth
- Responsive modern UI built with Tailwind CSS
- Persistent chat history

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd ElonMuskCrewAIChatbot
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a Supabase project at https://supabase.com
2. Enable Google OAuth:
   - Go to Authentication > Providers > Google
   - Set up a Google Cloud project and configure OAuth credentials
   - Add your domain to the authorized origins
   - Add your callback URL: `https://your-supabase-project.supabase.co/auth/v1/callback`

### 4. Set up environment variables

Create a `.env.local` file in the root directory with the following variables:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Backend API
BACKEND_URL=http://localhost:8000
```

### 5. Start the backend server

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### 6. Run the Next.js application

```bash
npm run dev
```

The application should now be running at http://localhost:3000

## Usage

1. Visit the website and click on "Use Chat"
2. If not logged in, you'll be prompted to sign in with Google
3. Once authenticated, you can start chatting with the Elon Musk AI

## Technologies Used

- **Frontend**: 
  - Next.js (React framework)
  - Tailwind CSS for styling
  - React hooks for state management
  
- **Backend**:
  - Python with FastAPI
  - CrewAI for creating intelligent agents
  - OpenAI's GPT models for natural language processing
  
- **Authentication & Database**:
  - Supabase for user authentication with Google OAuth
  - Supabase PostgreSQL database for storing chat history

## Project Structure

The project consists of two main parts:
1. **Frontend**: Next.js application for the user interface
2. **Backend**: Python API that handles the AI agent communication using CrewAI