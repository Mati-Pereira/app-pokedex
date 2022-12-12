
import { Waveform } from '@uiball/loaders';
import type { AppProps } from 'next/app';
import { Router } from 'next/router';
import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { ContextInput } from '../context/InputPokemon';
import '../styles/globals.css';
export default function App({ Component, pageProps }: AppProps) {
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
  useEffect(() => {
    const start = () => {
      console.log("start");
      setIsLoading(true);
    };
    const end = () => {
      console.log("finished");
      setIsLoading(false);
    };
    Router.events.on("routeChangeStart", start);
    Router.events.on("routeChangeComplete", end);
    Router.events.on("routeChangeError", end);
    return () => {
      Router.events.off("routeChangeStart", start);
      Router.events.off("routeChangeComplete", end);
      Router.events.off("routeChangeError", end);
    };
  }, []);

  return (
    <ContextInput>
      <Navbar />
      {isLoading ? (<div className="bg-slate-100 dark:bg-slate-800 w-full h-screen flex justify-center items-center">
        <Waveform size={60} color="#3d3e7c" />
      </div>) : <Component {...pageProps} />}
    </ContextInput>
  )
}
