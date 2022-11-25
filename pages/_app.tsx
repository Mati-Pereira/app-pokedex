import {
  QueryClient,
  QueryClientProvider
} from '@tanstack/react-query';
import { Waveform } from '@uiball/loaders';
import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { ContextInput } from '../context/InputPokemon';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const queryClient = new QueryClient()
  const [isLoading, setIsLoading] = useState(false)
  useEffect(() => {
    setIsLoading(true)
    if (
      localStorage.theme === 'dark' ||
      (!('theme' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      document.documentElement.classList.add('dark'); // add dark to the <html></html> itself as <html class='dark'></html>
    } else {
      document.documentElement.classList.remove('dark'); // remove dark from the html document if any
    }
    setTimeout(() => {
      setIsLoading(false);
    }, 500)
  }, []);

  if (isLoading) {
    return (
      <div style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
        className="bg-slate-100 dark:bg-slate-800"
      >
        <Waveform size={60} color="#3d3e7c" />
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ContextInput>
        <Navbar />
        <Component {...pageProps} />
      </ContextInput>
    </QueryClientProvider>
  )
}
