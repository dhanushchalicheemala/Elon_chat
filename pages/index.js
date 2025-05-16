import LandingPage from "../components/LandingPage";
import { useEffect } from 'react';

export default function Home() {
  // Force the page to display the LandingPage
  useEffect(() => {
    // Clear any cached routes
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/');
    }
  }, []);
  
  return <LandingPage />;
} 