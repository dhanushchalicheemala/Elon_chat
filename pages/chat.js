import { useState, useEffect } from 'react';

export default function ChatPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-100 flex flex-col items-center justify-center p-4 py-8">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg overflow-hidden p-6">
        <h1 className="text-3xl font-bold mb-4 text-center">Elon Musk AI Demo</h1>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-[50vh]">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-black"></div>
          </div>
        ) : (
          <div className="aspect-w-16 aspect-h-9">
            <div className="relative pb-[56.25%] h-0 overflow-hidden max-w-full">
              <video 
                className="absolute top-0 left-0 w-full h-full"
                controls
                autoPlay
                playsInline
                preload="auto"
              >
                <source src="/Elon chat.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        )}
        
        <div className="mt-6 text-center">
          <p className="text-lg text-gray-700 mb-4">
            Watch our demo video to see the Elon Musk AI chatbot in action!
          </p>
          <p className="text-sm text-gray-500">
            Don't forget to <a href="/" className="text-blue-600 hover:underline">join our waitlist</a> to be notified when the full version launches.
          </p>
        </div>
      </div>
    </div>
  );
} 