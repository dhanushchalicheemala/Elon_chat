import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Navigation() {
  const router = useRouter();
  
  return (
    <nav className="bg-black text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/">
          <div className="font-bold text-xl cursor-pointer">Elon Musk AI</div>
        </Link>
        
        <div className="space-x-4">
          <Link href="/">
            <div className={`inline-block cursor-pointer ${router.pathname === '/' ? 'font-bold' : ''}`}>
              Waitlist
            </div>
          </Link>
          <Link href="/chat">
            <div className={`inline-block cursor-pointer ${router.pathname === '/chat' ? 'font-bold' : ''}`}>
              Chat Demo
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
} 