import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../lib/i18n';

export default function ServerError() {
  const { language } = useLanguage();
  return (
    <main className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center gap-4 bg-paper px-5 py-10 text-center text-paper-ink dark:bg-slate-800 dark:text-white">
      <h1 className="text-2xl font-bold">{t(language, 'serverError')}</h1>
      <p>{t(language, 'serverErrorHint')}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => window.location.reload()} className="btn min-h-11 bg-pokedex text-white hover:bg-pokedex-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pokedex dark:bg-blue-800 dark:hover:bg-blue-900 dark:focus-visible:outline-blue-700">
          {t(language, 'retry')}
        </button>
        <Link href="/" className="btn min-h-11 border border-paper-border bg-paper-card text-paper-ink hover:bg-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pokedex dark:border-slate-400 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600 dark:focus-visible:outline-blue-700">
          {t(language, 'detailsBack')}
        </Link>
      </div>
    </main>
  );
}
