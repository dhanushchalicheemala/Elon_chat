import '../globals.css';
import Navigation from '../components/Navigation';
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from '../lib/AuthContext';

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Navigation />
      <Component {...pageProps} />
      <Analytics />
    </AuthProvider>
  );
}

export default MyApp; 