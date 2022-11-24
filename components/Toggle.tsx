import { useEffect, useState } from 'react';

const isDark = () => //Function that will return boolean if any of the condition is satisfied
  (localStorage && localStorage.theme === 'dark') || //Condition 1 - has local storage and theme = dark in local storage is found
  (!('theme' in localStorage) &&
    window.matchMedia('(prefers-color-scheme: dark)').matches); //Condition 2 - No theme key in local storage but media color scheme is dark

const getTheme = (isDark: boolean) => (isDark ? 'dark' : 'light'); //Function to return 'dark' or 'light' string

const Toggle = () => {
  const [darkMode, setDarkMode] = useState(false); //State for holding theme status

  const toggleMode = () => { //onClick handler for changing theme on button press
    localStorage.theme = getTheme(!darkMode); //setting up local storage theme value
    if (localStorage.theme === 'dark') { // If theme is 'dark'
      document.documentElement.classList.remove('light'); // remove 'light' from html class
      document.documentElement.classList.add('dark'); // add 'dark' to html class
    } else { // if not 'dark'
      document.documentElement.classList.remove('dark'); // remove 'dark' from html class
      document.documentElement.classList.add('light'); //add 'light' to html class
    }
    setDarkMode(!darkMode); //set dark mode state to opposite of initial value
  };

  useEffect(() => {
    setDarkMode(isDark()); //before page mount set the value of dark mode by observing theme in local storage
  }, []);

  const darkModeActive =
    process.browser && document.documentElement.classList.contains('dark'); // returns true if its a client and 'dark' is present in html
  // process.browser is deprecated can be written as typeof window === 'undefined'
  return (
    <>
      <button className='w-10 h-10 focus:outline-none' onClick={toggleMode}>
        <span className='sr-only'>Color mode switch button</span>
        {darkModeActive ? ( //switch mode icon according to html class 'dark' or 'light'
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