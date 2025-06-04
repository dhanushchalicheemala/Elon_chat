import { useState } from "react";
import { useAuth } from "../lib/AuthContext";

// Function to extract domain name as source name
const getSourceNameFromUrl = (urlString) => {
  try {
    const url = new URL(urlString);
    // Remove www. and take the main part of the hostname
    let hostname = url.hostname.replace(/^www\./, '');
    // Optional: Capitalize first letter of each part for better display
    // e.g., businessinsider.com -> Businessinsider.com
    // hostname = hostname.split('.').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('.');
    return hostname; // e.g., youtube.com, businessinsider.com
  } catch (_) {
    return null; // Not a valid URL
  }
};

// Function to parse message text and convert sources to links
const renderMessageWithLinks = (text) => {
  // Regex to find (Source: content) or (Read more here: content)
  // It captures the entire parenthesis block and the content inside
  const parts = text.split(/(\((?:Source|Read more here):\s*[^)]+\))/g);

  return parts.map((part, index) => {
    const sourceMatch = part.match(/\((?:Source|Read more here):\s*([^)]+)\)/);

    if (sourceMatch && sourceMatch[1]) {
      let sourceContent = sourceMatch[1].trim(); // This is the full URL or source name from LLM
      let displaySourceText = "Source"; // Default display text for the link part
      let actualUrl = "";

      try {
        // Attempt to parse sourceContent as a URL
        new URL(sourceContent);
        actualUrl = sourceContent; // It's a valid URL
        const friendlySourceName = getSourceNameFromUrl(actualUrl);
        if (friendlySourceName) {
          displaySourceText = `Source: ${friendlySourceName}`;
        } else {
          // If getSourceNameFromUrl failed (should not if new URL() succeeded), use domain or fallback
          displaySourceText = `Source: ${actualUrl.split('/')[2] || 'Link'}`;
        }
      } catch (_) {
        // Not a valid URL, assume it's a name. Create Google search link.
        // The LLM should now provide URLs, so this is a fallback.
        const searchQuery = encodeURIComponent(sourceContent);
        actualUrl = `https://www.google.com/search?q=${searchQuery}`;
        displaySourceText = `Source: ${sourceContent}`;
      }
      
      return (
        <a 
          key={index} 
          href={actualUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
          title={actualUrl} // Show full URL on hover
        >
          {displaySourceText} 
        </a>
      );
    }
    return part; // Return plain text part if no match
  });
};

export default function ElonMuskBot() {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState([
    { role: "system", text: "Hi! Ask me anything about Elon Musk 🚀" },
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || !isAuthenticated) return;

    setIsProcessing(true);
    const newMessages = [...messages, { role: "user", text: input }];
    setMessages(newMessages);
    setInput("");

    try {
      const response = await fetch("/api/crew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error:", errorData);
        throw new Error(errorData.error || errorData.details || "Failed to get response");
      }

      const { reply } = await response.json();

      setMessages([
        ...newMessages,
        { role: "assistant", text: reply || "Sorry, I couldn't find that information." },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages([
        ...newMessages,
        { role: "assistant", text: "Sorry, there was an error processing your request. Please try again later. Error: " + error.message },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 p-4">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl h-[80vh] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
          {/* Chat header */}
          <div className="bg-black text-white p-4">
            <div className="text-xl font-bold">Elon Musk AI Chat</div>
            {isAuthenticated && <div className="text-xs text-gray-300">Logged in as: {user?.email}</div>}
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`my-2 p-3 rounded-xl max-w-[80%] ${
                  msg.role === "user"
                    ? "bg-blue-100 ml-auto"
                    : msg.role === "assistant"
                    ? "bg-green-100"
                    : "text-center text-gray-500 mx-auto"
                }`}
              >
                {msg.role === 'assistant' ? 
                  <div style={{ whiteSpace: 'pre-wrap' }}>{renderMessageWithLinks(msg.text)}</div> 
                  : 
                  msg.text
                }
              </div>
            ))}
            {isProcessing && (
              <div className="flex items-center p-3">
                <div className="text-sm text-gray-500">Elon is typing</div>
                <div className="ml-2 flex space-x-1">
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="border-t p-4 bg-gray-50">
            <div className="flex">
              <input
                className="flex-1 p-4 rounded-l-2xl border border-gray-300 outline-none"
                type="text"
                placeholder="Ask about Elon Musk..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                disabled={!isAuthenticated || isProcessing}
              />
              <button
                onClick={sendMessage}
                className={`px-6 rounded-r-2xl ${
                  isAuthenticated && !isProcessing
                    ? "bg-black text-white hover:bg-gray-800"
                    : "bg-gray-400 text-gray-200 cursor-not-allowed"
                }`}
                disabled={!isAuthenticated || isProcessing}
              >
                Send
              </button>
            </div>
            {!isAuthenticated && (
              <div className="text-xs text-center text-red-500 mt-2">
                You must be logged in to send messages
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 