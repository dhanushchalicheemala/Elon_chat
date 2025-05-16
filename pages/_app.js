import '../globals.css';
import Navigation from '../components/Navigation';
import { Analytics } from "@vercel/analytics/react";

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Navigation />
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}

export default MyApp; 