/* eslint-disable @next/next/no-img-element */
import { Ring } from '@uiball/loaders';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { KeyboardEvent, useContext, useEffect, useRef, useState } from 'react';
import { AiOutlineSearch } from 'react-icons/ai';
import WindowedSelect, { createFilter } from "react-windowed-select";
import { InputContext } from '../context/InputPokemon';
import types from '../data/types.json';
import Toggle from './Toggle';

function Navbar() {
  const { updateInput } = useContext(InputContext)
  const [pokemon, setPokemon] = useState<{ name: string }[]>([]);
  const [namesError, setNamesError] = useState("")
  const [namesLoading, setNamesLoading] = useState(true)
  const [namesRetry, setNamesRetry] = useState(0)
  const [inputName, setInputName] = useState('')
  const [inputType, setInputType] = useState('')
  const [isLoadingName, setIsLoadingName] = useState(false)
  const [isLoadingType, setIsLoadingType] = useState(false)
  const [isNameMenuOpen, setNameMenuOpen] = useState(false)
  const [isTypeMenuOpen, setTypeMenuOpen] = useState(false)
  const [searchError, setSearchError] = useState("")
  const navigationPending = useRef(false)
  const isSearching = isLoadingName || isLoadingType
  const router = useRouter()

  const navigateSearch = async (value: string, href: string, setLoading: (loading: boolean) => void) => {
    if (!value || navigationPending.current) return
    navigationPending.current = true
    setLoading(true)
    setSearchError("")
    try {
      updateInput(value)
      await router.push(href)
    } catch (error) {
      if (!(error && typeof error === "object" && "cancelled" in error && error.cancelled)) {
        setSearchError("Unable to open the search results. Please try again.")
      }
    } finally {
      navigationPending.current = false
      setLoading(false)
    }
  }

  const handleName = () => navigateSearch(inputName, `/${inputName}`, setIsLoadingName)
  const handleType = () => navigateSearch(inputType, `/types?type=${encodeURIComponent(inputType)}`, setIsLoadingType)

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
    let active = true
    const controller = new AbortController()
    async function getNames() {
      setNamesLoading(true)
      setNamesError("")
      try {
        const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=100000&offset=0", { signal: controller.signal })
        if (!res.ok) throw new Error(`Pokemon names request failed: HTTP ${res.status}`)
        const data = await res.json()
        if (!Array.isArray(data.results) || !data.results.every((entry: { name?: unknown }) => entry && typeof entry.name === "string")) {
          throw new Error("Invalid Pokemon names response")
        }
        if (active) setPokemon(data.results)
      } catch {
        if (active) setNamesError("Unable to load Pokemon names. Please try again.")
      } finally {
        if (active) setNamesLoading(false)
      }
    }
    getNames()
    return () => { active = false; controller.abort() }
  }, [namesRetry]);

  useEffect(() => {
    if (!router.isReady || router.pathname !== "/types") return
    const type = router.query.type
    setInputType(typeof type === "string" && types.some(option => option.value === type) ? type : "")
  }, [router.isReady, router.pathname, router.query.type]);

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
            <WindowedSelect instanceId="pokemon-name" isLoading={namesLoading} options={names} windowThreshold={50} filterOption={customFilter} onChange={handleNameSelected} onMenuOpen={() => setNameMenuOpen(true)} onMenuClose={() => setNameMenuOpen(false)} onKeyDown={handleNameKeyDown} className='w-48' placeholder='Select Per Name...' />
            <button title='button' type="button" className="text-white bg-blue-700 hover:bg-blue-800 focus:outline-none font-medium text-sm p-3 text-center dark:bg-blue-600 dark:hover:bg-blue-700 rounded-r-full" onClick={handleName} disabled={isSearching} aria-busy={isLoadingName} aria-label="Search by name">
              {isLoadingName ? <Ring size={14} color="#eee" /> : <AiOutlineSearch />}
            </button>
          </div>
          <div className="flex items-stretch">
            <WindowedSelect instanceId="pokemon-type" value={types.find(option => option.value === inputType) || null} options={types} windowThreshold={50} filterOption={customFilter} onChange={handleTypeSelected} onMenuOpen={() => setTypeMenuOpen(true)} onMenuClose={() => setTypeMenuOpen(false)} onKeyDown={handleTypeKeyDown} className='w-48' placeholder='Select Per Type...' />
            <button title='button' type="button" className="text-white bg-blue-700 hover:bg-blue-800 focus:outline-none font-medium text-sm p-3 text-center dark:bg-blue-600 dark:hover:bg-blue-700 rounded-r-full" onClick={handleType} disabled={isSearching} aria-busy={isLoadingType} aria-label="Search by type">
              {isLoadingType ? <Ring size={14} color="#eee" /> : <AiOutlineSearch />}
            </button>
          </div>
        </div>
        <Toggle />
        {namesError && (
          <div className="w-full">
            <p role="alert">{namesError}</p>
            <button type="button" className="btn mt-4" onClick={() => setNamesRetry(value => value + 1)}>Try again</button>
          </div>
        )}
        {searchError && <p role="alert">{searchError}</p>}
      </div>
    </nav>
  );
}

export default Navbar;