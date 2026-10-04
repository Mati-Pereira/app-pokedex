import { useLanguage } from '../context/LanguageContext';
import { t } from '../lib/i18n';

const Toggle = () => {
  const { language } = useLanguage();
  const toggleMode = () => {
    const isDark = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', isDark);
    try {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    } catch {
      // Theme switching still works when the preference cannot be saved.
    }
  };
  return (
    <>
      <button type="button" aria-label={t(language, 'theme')} title={t(language, 'theme')} className="min-h-11 min-w-11 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700" onClick={toggleMode}>

        <svg
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="hidden h-10 w-10 text-indigo-200 dark:block"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>

        <svg
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="block h-10 w-10 text-gray-900 dark:hidden"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>

      </button>
    </>
  );
};
export default Toggle;
