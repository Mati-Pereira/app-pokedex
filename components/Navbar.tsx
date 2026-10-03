/* eslint-disable @next/next/no-img-element */
import { Ring } from '@uiball/loaders';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { KeyboardEvent, useContext, useEffect, useState } from 'react';
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
  const [isLoadingName, setIsLoadingName] = useState(false)
  const [isLoadingType, setIsLoadingType] = useState(false)
  const [isNameMenuOpen, setNameMenuOpen] = useState(false)
  const [isTypeMenuOpen, setTypeMenuOpen] = useState(false)
  const router = useRouter()

  const handleName = () => {
    if (!inputName) return
    setIsLoadingName(true)
    updateInput(inputName)
    router.push(`/${inputName}`)
    setTimeout(() => {
      setIsLoadingName(false)
    }, 1000)
  }

  const handleType = () => {
    if (!inputType) return
    setIsLoadingType(true)
    updateInput(inputType)
    router.push(`/types`)
    setTimeout(() => {
      setIsLoadingType(false)
    }, 1000)
  }

  const handleNameKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Enter" || event.nativeEvent.isComposing || isNameMenuOpen || !inputName) return
    event.preventDefault()
    handleName()
  }

  const handleTypeKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Enter" || event.nativeEvent.isComposing || isTypeMenuOpen || !inputType) return
    event.preventDefault()
    handleType()
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
        <div className='flex flex-col md:flex-row gap-8 md:gap-16'>
          <div className="flex items-stretch">
            <WindowedSelect options={names} windowThreshold={50} filterOption={customFilter} onChange={handleNameSelected} onMenuOpen={() => setNameMenuOpen(true)} onMenuClose={() => setNameMenuOpen(false)} onKeyDown={handleNameKeyDown} className='w-48' placeholder='Select Per Name...' />
            <button title='button' type="button" className="text-white bg-blue-700 hover:bg-blue-800 focus:outline-none font-medium text-sm p-3 text-center dark:bg-blue-600 dark:hover:bg-blue-700 rounded-r-full" onClick={handleName}>
              {isLoadingName ? <Ring size={14} color="#eee" /> : <AiOutlineSearch />}
            </button>
          </div>
          <div className="flex items-stretch">
            <WindowedSelect options={types} windowThreshold={50} filterOption={customFilter} onChange={handleTypeSelected} onMenuOpen={() => setTypeMenuOpen(true)} onMenuClose={() => setTypeMenuOpen(false)} onKeyDown={handleTypeKeyDown} className='w-48' placeholder='Select Per Type...' />
            <button title='button' type="button" className="text-white bg-blue-700 hover:bg-blue-800 focus:outline-none font-medium text-sm p-3 text-center dark:bg-blue-600 dark:hover:bg-blue-700 rounded-r-full" onClick={handleType}>
              {isLoadingType ? <Ring size={14} color="#eee" /> : <AiOutlineSearch />}
            </button>
          </div>
        </div>
        <Toggle />
      </div>
    </nav>
  );
}

export default Navbar;