import Link from 'next/link';
import { useRouter } from 'next/router';
import { useContext, useState } from 'react';
import { AiOutlineSearch } from 'react-icons/ai';
import { InputContext } from '../context/InputPokemon';
import Toggle from './Toggle';
function Navbar() {
  const router = useRouter()
  const { updateInput } = useContext(InputContext)

  const [input, setInput] = useState('')

  const handleClick = () => {
    updateInput(input)
    router.push('/search')
  }

  return (
    <nav className="flex bg-white border-gray-200 p-4 md:px-16 transition-colors dark:bg-gray-900" id="navbar">
      <div className="container flex flex-col md:flex-row gap-5 flex-wrap items-center justify-between mx-auto">
        <Link href="/" className="flex items-center">
          <span className="self-center w-24"><img src="pokedex-logo.png" alt="pokedex-logo" /></span>
        </Link>
        <div className="flex items-stretch">
          <div className="relative block">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-500" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path></svg>
            </div>
            <input type="text" id="search-navbar" className="block max-w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-l-full	 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Search..." onChange={e => setInput(e.target.value)} />
          </div>
          <button type="button" className="text-white bg-blue-700 hover:bg-blue-800 focus:outline-none font-medium text-sm p-3 text-center dark:bg-blue-600 dark:hover:bg-blue-700 rounded-r-full" onClick={handleClick}>
            <AiOutlineSearch />
          </button>
        </div>
        <Toggle />
      </div>
    </nav>
  );
}

export default Navbar;