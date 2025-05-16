// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { message } = req.body;
    console.log('Frontend received message:', message);

    try {
      // Call the Python backend
      // Ensure your Python backend is running, typically on http://localhost:8000
      const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:8000/run-crew/';
      
      console.log(`Forwarding message to Python backend at ${pythonBackendUrl}`);
      
      // More robust error handling for fetch
      try {
        const response = await fetch(pythonBackendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message }),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          console.error('Python backend error:', response.status, errorBody);
          throw new Error(`Python backend responded with ${response.status}: ${errorBody}`);
        }

        const data = await response.json();
        console.log('Received reply from Python backend:', data.reply);
        res.status(200).json({ reply: data.reply });
      } catch (fetchError) {
        console.error('Network error with Python backend:', fetchError.message);
        
        // Check if it's a connection refused error
        if (fetchError.message.includes('ECONNREFUSED') || fetchError.message.includes('Failed to fetch')) {
          res.status(503).json({ 
            reply: "Sorry, the AI backend appears to be offline. Please ensure the Python backend is running on port 8000."
          });
        } else {
          res.status(500).json({ 
            reply: `Backend connection error: ${fetchError.message}`
          });
        }
      }
    } catch (error) {
      console.error('General error handling request:', error);
      res.status(500).json({ reply: "Sorry, I couldn't connect to the AI crew or an internal error occurred." });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 