import os
import sys
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from crewai import Agent, Task, Crew, Process
from crewai_tools import SerperDevTool, WebsiteSearchTool

# Add the parent directory to sys.path to import from parent modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
load_dotenv()

# Ensure API keys are set
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SERPER_API_KEY = os.getenv("SERPER_API_KEY")

if not OPENAI_API_KEY:
    print("ERROR: OPENAI_API_KEY not found. Please set it in your .env file or environment.")

if not SERPER_API_KEY:
    print("ERROR: SERPER_API_KEY not found. Please set it in your .env file or environment.")

# Set environment variables
if OPENAI_API_KEY:
    os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY
if SERPER_API_KEY:
    os.environ["SERPER_API_KEY"] = SERPER_API_KEY

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Query(BaseModel):
    message: str

# Custom tool definitions
class CustomSearchToolSchema(BaseModel):
    search_query: str = Field(description="Mandatory search query string")

class VectorDBSearchTool(WebsiteSearchTool):
    name: str = "Static Knowledge Search"
    description: str = "Searches a knowledge base (currently Wikipedia) for information about Elon Musk. Input should be a search query string."
    args_schema: type[BaseModel] = CustomSearchToolSchema

    def __init__(self, website: str = "https://en.wikipedia.org/wiki/Elon_Musk", **kwargs):
        super().__init__(website=website, **kwargs)
    
    def _run(self, **kwargs) -> str:
        search_query = kwargs.get('search_query')
        if not search_query:
            return "Error: search_query not provided to Static Knowledge Search tool."
        print(f"--- Static Knowledge Agent using VectorDBSearchTool with query: {search_query} ---")
        return super()._run(search_query=search_query)

# Initialize tools
static_knowledge_tool = VectorDBSearchTool()
news_search_tool = SerperDevTool()

# Define agents
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
    goal='Search for the latest news and tweets about Elon Musk, then synthesize and present a concise summary of the key developments.',
    backstory='You are an expert at sifting through web search results to find the most current and relevant information about Elon Musk.',
    verbose=True,
    allow_delegation=False,
    tools=[news_search_tool]
)

# Define tasks
static_task = Task(
    description='Answer factual questions about Elon Musk from the knowledge base. Query: {query}',
    expected_output='A concise answer based on available static knowledge.',
    agent=static_knowledge_agent
)

news_task = Task(
    description='Investigate the latest news or recent developments about Elon Musk based on the query: {query}.',
    expected_output='Provide a concise summary of the most relevant and recent news items.',
    agent=news_agent
)

# Add a simple health check endpoint at the top after app initialization
@app.get("/")
async def health_check():
    """Health check endpoint to verify API is running."""
    return {
        "status": "ok", 
        "api_keys": {
            "openai": "present" if os.getenv("OPENAI_API_KEY") else "missing",
            "serper": "present" if os.getenv("SERPER_API_KEY") else "missing"
        }
    }

# API endpoint
@app.post("/run-crew/")
async def run_crew(query: Query):
    try:
        user_message = query.message
        user_message_lower = user_message.lower()
        print(f"Received message for crew: {user_message}")

        # Phrase to check for if static knowledge agent fails
        STATIC_KNOWLEDGE_NOT_FOUND_PHRASE = "I do not have this information in my current knowledge base."

        chosen_tasks_for_crew = []
        primary_agents_for_crew = []
        run_news_agent_after_static = False

        keywords_for_news = ["latest", "today", "now", "recent", "news", "update"]
        
        if any(keyword in user_message_lower for keyword in keywords_for_news):
            print("Dispatching directly to news_agent due to keywords.")
            chosen_tasks_for_crew = [news_task]
            primary_agents_for_crew = [news_agent]
        else:
            print("Attempting to use static_knowledge_agent first.")
            chosen_tasks_for_crew = [static_task]
            primary_agents_for_crew = [static_knowledge_agent, news_agent]
            run_news_agent_after_static = True

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
        
        print(f"Starting initial crew kickoff with query: {user_message}")
        initial_crew_result = crew.kickoff(inputs={'query': user_message})
        print(f"Initial crew finished with result: {initial_crew_result}")

        final_reply_string = ""
        if isinstance(initial_crew_result, str):
            final_reply_string = initial_crew_result
        elif hasattr(initial_crew_result, 'raw') and isinstance(initial_crew_result.raw, str):
            final_reply_string = initial_crew_result.raw
        else:
            final_reply_string = str(initial_crew_result)

        # Clean the reply string from potential triple quotes
        if final_reply_string.startswith("'''") and final_reply_string.endswith("'''"):
            final_reply_string = final_reply_string[3:-3].strip()
        elif final_reply_string.startswith("\"\"\"") and final_reply_string.endswith("\"\"\""):
             final_reply_string = final_reply_string[3:-3].strip()
        final_reply_string = final_reply_string.strip()

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
        error_details = traceback.format_exc()
        print(f"Error during crew execution: {str(e)}")
        print(f"Full traceback: {error_details}")
        return {
            "reply": "Sorry, I encountered an error processing your request.",
            "error": str(e),
            "error_type": type(e).__name__
        }

# For local testing
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000) 