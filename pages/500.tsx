import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../lib/i18n';

export default function ServerError() {
  const { language } = useLanguage();
  return (
    <main className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center gap-4 bg-slate-100 px-5 py-10 text-center text-slate-800 dark:bg-slate-800 dark:text-white">
      <h1 className="text-2xl font-bold">{t(language, 'serverError')}</h1>
      <p>{t(language, 'serverErrorHint')}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => window.location.reload()} className="btn min-h-11 bg-blue-800 text-white hover:bg-blue-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">
          {t(language, 'retry')}
        </button>
        <Link href="/" className="btn min-h-11 border border-slate-500 bg-white text-slate-900 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:border-slate-400 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600">
          {t(language, 'detailsBack')}
        </Link>
      </div>
    </main>
  );
}
