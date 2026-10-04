import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../lib/i18n';

export default function NotFound() {
  const { language } = useLanguage();
  return (
    <main className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center gap-4 bg-paper px-5 py-10 text-center text-paper-ink dark:bg-slate-800 dark:text-white">
      <p className="font-mono text-5xl font-black text-pokedex dark:text-sky-200">404</p>
      <h1 className="text-2xl font-bold">{t(language, 'notFound')}</h1>
      <p>{t(language, 'notFoundHint')}</p>
      <Link href="/" className="btn min-h-11 bg-pokedex text-white hover:bg-pokedex-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pokedex dark:bg-blue-800 dark:hover:bg-blue-900 dark:focus-visible:outline-blue-700">
        {t(language, 'detailsBack')}
      </Link>
    </main>
  );
}
