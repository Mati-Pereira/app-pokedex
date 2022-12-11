import { useEffect, useState } from 'react';
const isDark = () =>
  (localStorage && localStorage.theme === 'dark') ||
  (!('theme' in localStorage) &&
    window.matchMedia('(prefers-color-scheme: dark)').matches);
const getTheme = (isDark: boolean) => (isDark ? 'dark' : 'light');
const Toggle = () => {
  const [darkMode, setDarkMode] = useState(false);
  const toggleMode = () => {
    localStorage.theme = getTheme(!darkMode);
    if (localStorage.theme === 'dark') {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    setDarkMode(!darkMode);
  };
  useEffect(() => {
    setDarkMode(isDark());
  }, []);
  const darkModeActive =
    process.browser && document.documentElement.classList.contains('dark');
  return (
    <>
      <button className='w-10 h-10 focus:outline-none' onClick={toggleMode}>
        <span className='sr-only'>Color mode switch button</span>
        {darkModeActive ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 text-indigo-200"
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
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 text-gray-900"
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
        )}
      </button>
    </>
  );
};
export default Toggle;