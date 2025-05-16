import { useState } from "react";

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
  const [messages, setMessages] = useState([
    { role: "system", text: "Hi! Ask me anything about Elon Musk 🚀" },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", text: input }];
    setMessages(newMessages);
    setInput("");

    const response = await fetch("/api/crew", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input }),
    });

    const { reply } = await response.json();

    setMessages([
      ...newMessages,
      { role: "assistant", text: reply || "Sorry, I couldn't find that." },
    ]);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-4">
      <div className="w-full max-w-2xl h-[80vh] bg-white rounded-2xl shadow-xl overflow-y-auto p-6">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`my-2 p-3 rounded-xl max-w-[80%] ${
              msg.role === "user"
                ? "bg-blue-100 self-end text-right"
                : msg.role === "assistant"
                ? "bg-green-100 self-start"
                : "text-center text-gray-500"
            }`}
          >
            {msg.role === 'assistant' ? 
              <div style={{ whiteSpace: 'pre-wrap' }}>{renderMessageWithLinks(msg.text)}</div> 
              : 
              msg.text
            }
          </div>
        ))}
      </div>
      <div className="w-full max-w-2xl flex mt-4">
        <input
          className="flex-1 p-4 rounded-l-2xl border border-gray-300 outline-none"
          type="text"
          placeholder="Ask about Elon Musk..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-black text-white px-6 rounded-r-2xl hover:bg-gray-800"
        >
          Send
        </button>
      </div>
    </div>
  );
} 