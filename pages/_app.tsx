import { Waveform } from '@uiball/loaders';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { ContextInput } from '../context/InputPokemon';
import { LanguageProvider, useLanguage } from '../context/LanguageContext';
import { t } from '../lib/i18n';
import '../styles/globals.css';

function RouteLoading() {
  const { language } = useLanguage();
  return (
    <div role="status" aria-live="polite" className="fixed inset-0 z-50 flex cursor-wait flex-col items-center justify-center gap-4 bg-paper/95 dark:bg-slate-800/95 dark:text-slate-50">
      <div aria-hidden="true"><Waveform size={60} color="#3d3e7c" /></div>
      <p>{t(language, 'loadingPage')}</p>
    </div>
  );
}

export default function App({ Component, pageProps }: AppProps) {
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
  return (
    <LanguageProvider>
      <ContextInput>
        <Navbar />
        <Component {...pageProps} />
        {isNavigating && <RouteLoading />}
      </ContextInput>
    </LanguageProvider>
  );
}
