import { useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email || !name) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-100 flex flex-col items-center justify-center px-4 py-8">
      <div className="max-w-4xl w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/2 bg-black p-8 text-white">
            <h1 className="text-3xl font-bold mb-6">Elon Musk AI Chatbot</h1>
            <p className="text-xl mb-6">Chat with an AI trained on Elon Musk's tweets, interviews, and knowledge.</p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Get insights on technology and innovation
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Learn about Tesla, SpaceX, and more
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Get the latest updates on Elon's ventures
              </li>
            </ul>
            <p className="text-gray-300 italic mb-8">Powered by AI and backed by the latest data</p>
            
            <Link href="/chat">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg transition-colors text-lg flex items-center justify-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Try Chat Now
              </button>
            </Link>
          </div>
          
          <div className="md:w-1/2 p-8">
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <svg className="w-16 h-16 text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-2xl font-bold mb-2">You're on the list!</h2>
                <p className="text-gray-600 mb-6">Thanks for joining our waitlist. We'll notify you as soon as we launch.</p>
                
                <Link href="/chat">
                  <button className="bg-black hover:bg-gray-800 text-white font-bold py-3 px-8 rounded-lg transition duration-200">
                    Try Chat Now
                  </button>
                </Link>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-6">Join the Waitlist</h2>
                <p className="text-gray-600 mb-6">Be the first to get access when we launch. Enter your details below.</p>
                
                <form onSubmit={handleSubmit}>
                  {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
                  
                  <div className="mb-4">
                    <label htmlFor="name" className="block text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="email" className="block text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-lg transition duration-200 mb-4"
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Join Waitlist'}
                  </button>
                  
                  <div className="text-center">
                    <span className="text-gray-500">or</span>
                    <Link href="/chat">
                      <div className="block mt-3 text-blue-600 hover:underline cursor-pointer">
                        Try the chat directly
                      </div>
                    </Link>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center text-gray-600">
        <p className="mb-2">© {new Date().getFullYear()} Elon Musk AI Chatbot. All rights reserved.</p>
        <div className="flex justify-center space-x-4">
          <a href="#" className="hover:text-black">Privacy Policy</a>
          <a href="#" className="hover:text-black">Terms of Service</a>
        </div>
      </div>
    </div>
  );
} 