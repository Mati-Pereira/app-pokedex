import { Html, Head, Main, NextScript } from 'next/document';

const themeScript = `
  try {
    const savedTheme = localStorage.getItem('theme');
    const savedLanguage = localStorage.getItem('language');
    document.documentElement.lang = savedLanguage === 'en' ? 'en' : 'pt-BR';
    const isDark = savedTheme === 'dark' ||
      (savedTheme === null && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
  } catch {
    // Keep the default theme if browser storage is unavailable.
  }
`;

export default function Document() {
  return (
    <Html lang="pt-BR">
      <Head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
