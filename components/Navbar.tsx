/* eslint-disable @next/next/no-img-element */
import { Ring } from '@uiball/loaders';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';
import { AiOutlineSearch } from 'react-icons/ai';
import WindowedSelect, { createFilter } from "react-windowed-select";
import { InputContext } from '../context/InputPokemon';
import types from '../data/types.json';
import Toggle from './Toggle';

function Navbar() {
  const { updateInput } = useContext(InputContext)
  const [pokemon, setPokemon] = useState([]);
  const [inputName, setInputName] = useState('')
  const [inputType, setInputType] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleName = () => {
    setIsLoading(true)
    updateInput(inputName)
    router.push(`/${inputName}`)
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }

  const handleType = () => {
    setIsLoading(true)
    updateInput(inputType)
    router.push(`/types`)
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }

  const handleNameSelected = (selectedPokemon: any) => {
    setInputName(selectedPokemon.value)
  }

  const handleTypeSelected = (selectedPokemon: any) => {
    setInputType(selectedPokemon.label)
  }

  useEffect(() => {
    fetch("https://pokeapi.co/api/v2/pokemon?limit=100000&offset=0")
      .then((data) => data.json())
      .then((data) => setPokemon(data?.results));
  }, []);

  const names = pokemon?.map((pokemon: { name: string }) => {
    return { label: pokemon.name, value: pokemon.name }
  })

  const customFilter = createFilter({ ignoreAccents: false, trim: true });

  return (
    <nav className="flex bg-white border-gray-200 p-4 md:px-16 transition-colors dark:bg-gray-900" id="navbar">
      <div className="container flex flex-col md:flex-row gap-5 flex-wrap items-center justify-between mx-auto">
        <Link href="/" className="flex items-center">
          <span className="self-center w-24"><img src="pokedex-logo.png" alt="pokedex-logo" /></span>
        </Link>
        <div className='flex gap-16'>
          <div className="flex items-stretch">
            <WindowedSelect options={names} windowThreshold={50} filterOption={customFilter} onChange={handleNameSelected} onKeyDown={handleName} className='w-48' placeholder='Select Per Name...'/>
            <button title='button' type="button" className="text-white bg-blue-700 hover:bg-blue-800 focus:outline-none font-medium text-sm p-3 text-center dark:bg-blue-600 dark:hover:bg-blue-700 rounded-r-full" onClick={handleName}>
              {isLoading ? <Ring size={14} color="#eee" /> : <AiOutlineSearch />}
            </button>
          </div>
          <div className="flex items-stretch">
            <WindowedSelect options={types} windowThreshold={50} filterOption={customFilter} onChange={handleTypeSelected} onKeyDown={handleType} className='w-48' placeholder='Select Per Type...' />
            <button title='button' type="button" className="text-white bg-blue-700 hover:bg-blue-800 focus:outline-none font-medium text-sm p-3 text-center dark:bg-blue-600 dark:hover:bg-blue-700 rounded-r-full" onClick={handleType}>
              {isLoading ? <Ring size={14} color="#eee" /> : <AiOutlineSearch />}
            </button>
          </div>
        </div>
        <Toggle />
      </div>
    </nav>
  );
}

export default Navbar;