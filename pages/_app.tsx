import { Waveform } from '@uiball/loaders';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { ContextInput } from '../context/InputPokemon';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const start = (_url: string, { shallow }: { shallow: boolean }) => {
      if (!shallow) setIsNavigating(true);
    };
    const finish = () => setIsNavigating(false);
    router.events.on('routeChangeStart', start);
    router.events.on('routeChangeComplete', finish);
    router.events.on('routeChangeError', finish);
    return () => {
      router.events.off('routeChangeStart', start);
      router.events.off('routeChangeComplete', finish);
      router.events.off('routeChangeError', finish);
    };
  }, [router.events]);
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);

  return (
    <ContextInput>
      <Navbar />
      {isLoading ? (
        <div className="flex h-screen w-full items-center justify-center bg-slate-100 dark:bg-slate-800">
          <Waveform size={60} color="#3d3e7c" />
        </div>
      ) : (
        <Component {...pageProps} />
      )}
      {isNavigating && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-50 flex cursor-wait flex-col items-center justify-center gap-4 bg-slate-100 dark:bg-slate-800 dark:text-slate-50"
        >
          <div aria-hidden="true">
            <Waveform size={60} color="#3d3e7c" />
          </div>
          <p>Loading...</p>
        </div>
      )}
    </ContextInput>
  );
}
