/* eslint-disable @next/next/no-img-element */
import { Waveform } from '@uiball/loaders';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';
import { AiOutlineSearch } from 'react-icons/ai';
import WindowedSelect, { createFilter } from "react-windowed-select";
import { InputContext } from '../context/InputPokemon';
import Toggle from './Toggle';

function Navbar() {
  const { updateInput } = useContext(InputContext)
  const [pokemon, setPokemon] = useState([]);
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleClick = () => {
    setIsLoading(true)
    updateInput(input)
    router.push(`/${input}`)
    setIsLoading(false)
  }

  const handleSelected = (selectedPokemon: { label: string, value: string }) => {
    setInput(selectedPokemon.value)
  }

  useEffect(() => {
    fetch("https://pokeapi.co/api/v2/pokemon?limit=100000&offset=0")
      .then((data) => data.json())
      .then((data) => setPokemon(data?.results));
  }, []);

  const names = pokemon?.map((pokemon: { name: string }) => {
    return { label: pokemon.name, value: pokemon.name }
  })

  const customFilter = createFilter({ ignoreAccents: false });

  if (isLoading) {
    return (
      <div style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
        className="bg-slate-100 dark:bg-slate-800"
      >
        <Waveform size={60} color="#3d3e7c" />
      </div>
    )
  }

  return (
    <nav className="flex bg-white border-gray-200 p-4 md:px-16 transition-colors dark:bg-gray-900" id="navbar">
      <div className="container flex flex-col md:flex-row gap-5 flex-wrap items-center justify-between mx-auto">
        <Link href="/" className="flex items-center">
          <span className="self-center w-24"><img src="pokedex-logo.png" alt="pokedex-logo" /></span>
        </Link>
        <div className="flex items-stretch">
          <WindowedSelect options={names} windowThreshold={50} filterOption={customFilter} styles={{ container: (base) => ({ ...base, width: '50vw' }) }} onChange={handleSelected} onKeyDown={handleClick} />
          <button title='button' type="button" className="text-white bg-blue-700 hover:bg-blue-800 focus:outline-none font-medium text-sm p-3 text-center dark:bg-blue-600 dark:hover:bg-blue-700 rounded-r-full" onClick={handleClick}>
            <AiOutlineSearch />
          </button>
        </div>
        <Toggle />
      </div>
    </nav>
  );
}

export default Navbar;