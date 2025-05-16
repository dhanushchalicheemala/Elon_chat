import os
from dotenv import load_dotenv # Import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # Add this import
from pydantic import BaseModel, Field # Add Field
from crewai import Agent, Task, Crew, Process
from crewai_tools import SerperDevTool, WebsiteSearchTool # No BaseTool here
from langchain_community.vectorstores import Chroma # For vectordb
from langchain_openai import OpenAIEmbeddings # For vectordb

# --- Environment Variables & Configuration ---
load_dotenv() # Load variables from .env file

# Ensure you have OPENAI_API_KEY and SERPER_API_KEY set in your .env file
# For Chroma, it will create a local database.
# You'll need to populate the 'elon_musk_knowledge' collection for the static agent.

# Get keys from environment (which will now include those from .env)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SERPER_API_KEY = os.getenv("SERPER_API_KEY")

if not OPENAI_API_KEY:
    print("ERROR: OPENAI_API_KEY not found. Please set it in your .env file or environment.")
    # exit(1) # Or handle appropriately

if not SERPER_API_KEY:
    print("ERROR: SERPER_API_KEY not found. Please set it in your .env file or environment.")
    # exit(1) # Or handle appropriately

# Set them as environment variables if CrewAI or other libraries expect them there directly
# (though accessing via os.getenv is usually sufficient)
if OPENAI_API_KEY:
    os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY
if SERPER_API_KEY:
    os.environ["SERPER_API_KEY"] = SERPER_API_KEY

# --- FastAPI App ---
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Query(BaseModel):
    message: str

# --- CrewAI Setup (derived from your crew.yaml) ---

# Define an arguments schema for our search tool
class CustomSearchToolSchema(BaseModel):
    search_query: str = Field(description="Mandatory search query string")

class VectorDBSearchTool(WebsiteSearchTool):
    name: str = "Static Knowledge Search"
    description: str = "Searches a knowledge base (currently Wikipedia) for information about Elon Musk. Input should be a search query string."
    args_schema: type[BaseModel] = CustomSearchToolSchema

    def __init__(self, website: str = "https://en.wikipedia.org/wiki/Elon_Musk", **kwargs):
        super().__init__(website=website, **kwargs)
    
    # The _run method is inherited from WebsiteSearchTool and should correctly use search_query
    # We can add print statements here if needed for debugging the input it receives.
    def _run(self, **kwargs) -> str:
        search_query = kwargs.get('search_query')
        if not search_query:
            return "Error: search_query not provided to Static Knowledge Search tool."
        print(f"--- Static Knowledge Agent using VectorDBSearchTool with query: {search_query} ---")
        return super()._run(search_query=search_query)

static_knowledge_tool = VectorDBSearchTool()
news_search_tool = SerperDevTool() # Corresponds to serpapi_tool

# Agents
static_knowledge_agent = Agent(
    role='Elon Musk Knowledge Expert',
    goal='Provide accurate answers from static knowledge about Elon Musk including his biography, companies, and timeline.',
    backstory='You are trained on documents, articles, and Wikipedia entries about Elon Musk. You retrieve detailed info from a knowledge base.',
    verbose=True,
    allow_delegation=False,
    tools=[static_knowledge_tool]
)

news_agent = Agent(
    role='Elon Musk News Tracker & Summarizer',
    goal='Search for the latest news and tweets about Elon Musk, then synthesize and present a concise summary of the key developments. Avoid just listing raw search results or links without context.',
    backstory='You are an expert at sifting through web search results to find the most current and relevant information about Elon Musk. You then summarize these findings into a brief, easy-to-read update for the user. You prioritize the most recent and significant news items.',
    verbose=True,
    allow_delegation=False,
    tools=[news_search_tool]
)

# Orchestrator agent logic will be handled by task routing or a more complex Crew setup if needed.
# For this setup, we'll use a simpler approach of selecting tasks based on keywords.

# Tasks
static_task = Task(
    description='Answer factual questions about Elon Musk from the knowledge base. Query: {query}',
    expected_output=(
        'A concise answer based on available static knowledge. '
        'If the information is not found in the knowledge base, explicitly state: "I do not have this information in my current knowledge base." '
        'Do not try to answer if the information is not present.'
    ),
    agent=static_knowledge_agent
)

news_task = Task(
    description=(
        'Investigate the latest news or recent developments about Elon Musk based on the query: {query}. '
        'Focus on information from the last few days or week if possible. '
        'You will be given search results which include a "title", "link", and "snippet" for each item.'
    ),
    expected_output=(
        'Provide a concise summary of the most relevant and recent news items. Aim for around 3-5 key points, but adjust based on actual relevance. Provide at least 1 point if relevant information is found, and no more than 7 distinct points. '
        'Format EACH news item as follows: \n'
        '- [Summary of the news item as a single, clear sentence]. (Source: [Full URL from the "link" field of the relevant search result])\n'
        'Example:\n'
        '- SpaceX launched a new rocket. (Source: https://www.example.com/spacex_launch)\n'
        'Ensure you use the literal "link" value from the search result for the URL. '
        'If a specific URL for a summarized point cannot be confidently extracted from the search results, ONLY THEN state (Source: [Source Name], URL not found). '
        'Do not make up URLs.'
    ),
    agent=news_agent
)

# --- API Endpoint ---
@app.post("/run-crew/")
async def run_crew(query: Query):
    try:
        user_message = query.message
        user_message_lower = user_message.lower()
        print(f"Received message for crew: {user_message}")

        # Phrase to check for if static knowledge agent fails
        STATIC_KNOWLEDGE_NOT_FOUND_PHRASE = "I do not have this information in my current knowledge base."

        crew_to_run = None
        chosen_tasks_for_crew = []
        primary_agents_for_crew = []
        run_news_agent_after_static = False

        keywords_for_news = ["latest", "today", "now", "recent", "news", "update"]
        
        if any(keyword in user_message_lower for keyword in keywords_for_news):
            print("Dispatching directly to news_agent due to keywords.")
            chosen_tasks_for_crew = [news_task]
            primary_agents_for_crew = [news_agent] # Only news agent needed
        else:
            print("Attempting to use static_knowledge_agent first.")
            chosen_tasks_for_crew = [static_task]
            primary_agents_for_crew = [static_knowledge_agent, news_agent] # Include news agent in crew for potential fallback
            run_news_agent_after_static = True # Flag to potentially run news agent

        # Create and run the initial crew
        crew = Crew(
            agents=primary_agents_for_crew,
            tasks=chosen_tasks_for_crew,
            process=Process.sequential,
            verbose=True
        )

        # Verify API keys before proceeding
        if not os.getenv("OPENAI_API_KEY"):
            print("ERROR: OPENAI_API_KEY is not set!")
            return {"reply": "Sorry, the OpenAI API key is missing. Please check the backend configuration."}
        if not os.getenv("SERPER_API_KEY"):
            print("ERROR: SERPER_API_KEY is not set!")
            return {"reply": "Sorry, the Serper API key is missing. Please check the backend configuration."}
        print(f"API Keys present: OpenAI API Key: {'Yes' if os.getenv('OPENAI_API_KEY') else 'No'}, Serper API Key: {'Yes' if os.getenv('SERPER_API_KEY') else 'No'}")

        print(f"Starting initial crew kickoff with query: {user_message}")
        initial_crew_result = crew.kickoff(inputs={'query': user_message})
        print(f"Initial crew finished with result: {initial_crew_result}")

        final_reply_string = ""
        if isinstance(initial_crew_result, str):
            final_reply_string = initial_crew_result
        elif hasattr(initial_crew_result, 'raw') and isinstance(initial_crew_result.raw, str):
            final_reply_string = initial_crew_result.raw
        # Add other extraction logic as before if needed...
        else:
            final_reply_string = str(initial_crew_result)

        # Clean the reply string from potential triple quotes
        if final_reply_string.startswith("'''") and final_reply_string.endswith("'''"):
            final_reply_string = final_reply_string[3:-3].strip()
        elif final_reply_string.startswith("\"\"\"") and final_reply_string.endswith("\"\"\""):
             final_reply_string = final_reply_string[3:-3].strip()
        final_reply_string = final_reply_string.strip() # General strip for good measure

        # Check if static agent failed and we need to run news agent
        if run_news_agent_after_static and STATIC_KNOWLEDGE_NOT_FOUND_PHRASE in final_reply_string:
            print(f"Static agent indicated information not found. Querying news_agent as fallback for: {user_message}")
            
            news_crew = Crew(
                agents=[news_agent],
                tasks=[news_task],
                process=Process.sequential,
                verbose=True
            )
            news_crew_result = news_crew.kickoff(inputs={'query': user_message})
            print(f"News agent fallback finished with result: {news_crew_result}")
            
            if isinstance(news_crew_result, str):
                final_reply_string = news_crew_result
            elif hasattr(news_crew_result, 'raw') and isinstance(news_crew_result.raw, str):
                final_reply_string = news_crew_result.raw
            # Add other extraction logic...
            else:
                final_reply_string = str(news_crew_result)
            
            # Clean the news reply string as well
            if final_reply_string.startswith("'''") and final_reply_string.endswith("'''"):
                final_reply_string = final_reply_string[3:-3].strip()
            elif final_reply_string.startswith("\"\"\"") and final_reply_string.endswith("\"\"\""):
                final_reply_string = final_reply_string[3:-3].strip()
            final_reply_string = final_reply_string.strip()

        return {"reply": final_reply_string}

    except Exception as e:
        import traceback
        print(f"Error during crew execution: {e}")
        print(f"Full traceback: {traceback.format_exc()}")
        return {"reply": f"Sorry, I encountered an error processing your request: {str(e)}"}

if __name__ == "__main__":
    import uvicorn
    # Ensure OPENAI_API_KEY and SERPER_API_KEY are set in your environment before running.
    # Also, you might need to populate your ChromaDB for the static_knowledge_agent.
    print("Starting backend server...")
    print("Ensure OPENAI_API_KEY and SERPER_API_KEY are set in your environment.")
    print("For static knowledge, ChromaDB collection 'elon_musk_knowledge' should be populated.")
    print("Server will be available at http://127.0.0.1:8000")
    uvicorn.run(app, host="127.0.0.1", port=8000) 