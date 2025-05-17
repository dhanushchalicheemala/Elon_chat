import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/AuthContext';
import { signOut } from '../lib/supabase';

export default function Navigation() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  
  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };
  
  return (
    <nav className="bg-black text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/">
          <div className="font-bold text-xl cursor-pointer">Elon Musk AI</div>
        </Link>
        
        <div className="flex items-center space-x-4">
          <Link href="/">
            <div className={`inline-block cursor-pointer ${router.pathname === '/' ? 'font-bold' : ''}`}>
              Waitlist
            </div>
          </Link>
          
          <Link href="/chat">
            <div className="inline-block cursor-pointer bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md font-medium transition-colors">
              Use Chat
            </div>
          </Link>
          
          {!loading && (
            isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center" title={user.email}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <button 
                  onClick={handleSignOut}
                  className="text-sm bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
                >
                  Log out
                </button>
              </div>
            ) : (
              router.pathname !== '/chat' && (
                <Link href="/chat">
                  <div className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded cursor-pointer">
                    Log in
                  </div>
                </Link>
              )
            )
          )}
        </div>
      </div>
    </nav>
  );
} 