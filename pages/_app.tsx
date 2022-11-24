import type { AppProps } from 'next/app'
import { ChangeEvent, useState } from 'react'
import Navbar from '../components/Navbar'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  const [darkMode, setDarkMode] = useState<'dark' | ''>()

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    event.target.checked ? setDarkMode('dark') : setDarkMode('')
  }
  return (
    <div className={darkMode ? "dark" : ""}>
      <Navbar onChange={handleChange} />
      <Component {...pageProps} />
    </div>
  )
}
