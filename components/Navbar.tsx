/* eslint-disable @next/next/no-img-element */
import { Ring } from '@uiball/loaders';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { KeyboardEvent, useContext, useEffect, useRef, useState } from 'react';
import { AiOutlineSearch } from 'react-icons/ai';
import WindowedSelect, { createFilter } from 'react-windowed-select';
import { InputContext } from '../context/InputPokemon';
import { fetchPokemonNames, usePokeApi } from '../lib/usePokeApi';
import types from '../data/types.json';
import Toggle from './Toggle';

interface SelectOption {
  label: string;
  value: string;
}

function Navbar() {
  const { updateInput } = useContext(InputContext);
  const {
    data: pokemon,
    isLoading: namesLoading,
    error: namesError,
    retry: retryNames,
  } = usePokeApi(
    'names',
    signal => fetchPokemonNames('https://pokeapi.co/api/v2/pokemon?limit=100000&offset=0', signal),
    'Unable to load Pokemon names. Please try again.'
  );
  const [inputName, setInputName] = useState('');
  const [inputType, setInputType] = useState('');
  const [isLoadingName, setIsLoadingName] = useState(false);
  const [isLoadingType, setIsLoadingType] = useState(false);
  const [isNameMenuOpen, setNameMenuOpen] = useState(false);
  const [isTypeMenuOpen, setTypeMenuOpen] = useState(false);
  const [searchError, setSearchError] = useState('');
  const navigationPending = useRef(false);
  const isSearching = isLoadingName || isLoadingType;
  const router = useRouter();

  const navigateSearch = async (
    value: string,
    href: string,
    setLoading: (loading: boolean) => void
  ) => {
    if (!value || navigationPending.current) return;
    navigationPending.current = true;
    setLoading(true);
    setSearchError('');
    try {
      updateInput(value);
      await router.push(href);
    } catch (error) {
      if (!(error && typeof error === 'object' && 'cancelled' in error && error.cancelled)) {
        setSearchError('Unable to open the search results. Please try again.');
      }
    } finally {
      navigationPending.current = false;
      setLoading(false);
    }
  };

  const handleName = () => navigateSearch(inputName, `/${inputName}`, setIsLoadingName);
  const handleType = () =>
    navigateSearch(inputType, `/types?type=${encodeURIComponent(inputType)}`, setIsLoadingType);

  const handleNameKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing || isNameMenuOpen || !inputName)
      return;
    event.preventDefault();
    handleName();
  };

  const handleTypeKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing || isTypeMenuOpen || !inputType)
      return;
    event.preventDefault();
    handleType();
  };

  const handleNameSelected = (selectedPokemon: unknown) => {
    if (selectedPokemon) setInputName((selectedPokemon as SelectOption).value);
  };

  const handleTypeSelected = (selectedPokemon: unknown) => {
    if (selectedPokemon) setInputType((selectedPokemon as SelectOption).label);
  };

  useEffect(() => {
    if (!router.isReady || router.pathname !== '/types') return;
    const type = router.query['type'];
    setInputType(
      typeof type === 'string' && types.some(option => option.value === type) ? type : ''
    );
  }, [router.isReady, router.pathname, router.query]);

  const names = pokemon?.map((pokemon: { name: string }) => {
    return { label: pokemon.name, value: pokemon.name };
  });

  const customFilter = createFilter({ ignoreAccents: false, trim: true });

  return (
    <nav
      className="flex border-gray-200 bg-white p-4 transition-colors dark:bg-gray-900 md:px-16"
      id="navbar"
    >
      <div className="container mx-auto flex flex-col flex-wrap items-center justify-between gap-5 md:flex-row">
        <Link href="/" className="flex items-center">
          <span className="w-24 self-center">
            <img src="pokedex-logo.png" alt="pokedex-logo" />
          </span>
        </Link>
        <div className="flex flex-col gap-8 md:flex-row md:gap-16">
          <div className="flex items-stretch">
            <WindowedSelect
              instanceId="pokemon-name"
              isLoading={namesLoading}
              options={names}
              windowThreshold={50}
              filterOption={customFilter}
              onChange={handleNameSelected}
              onMenuOpen={() => setNameMenuOpen(true)}
              onMenuClose={() => setNameMenuOpen(false)}
              onKeyDown={handleNameKeyDown}
              className="w-48"
              placeholder="Select Per Name..."
            />
            <button
              title="button"
              type="button"
              className="rounded-r-full bg-blue-700 p-3 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none dark:bg-blue-600 dark:hover:bg-blue-700"
              onClick={handleName}
              disabled={isSearching}
              aria-busy={isLoadingName}
              aria-label="Search by name"
            >
              {isLoadingName ? <Ring size={14} color="#eee" /> : <AiOutlineSearch />}
            </button>
          </div>
          <div className="flex items-stretch">
            <WindowedSelect
              instanceId="pokemon-type"
              value={types.find(option => option.value === inputType) || null}
              options={types}
              windowThreshold={50}
              filterOption={customFilter}
              onChange={handleTypeSelected}
              onMenuOpen={() => setTypeMenuOpen(true)}
              onMenuClose={() => setTypeMenuOpen(false)}
              onKeyDown={handleTypeKeyDown}
              className="w-48"
              placeholder="Select Per Type..."
            />
            <button
              title="button"
              type="button"
              className="rounded-r-full bg-blue-700 p-3 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none dark:bg-blue-600 dark:hover:bg-blue-700"
              onClick={handleType}
              disabled={isSearching}
              aria-busy={isLoadingType}
              aria-label="Search by type"
            >
              {isLoadingType ? <Ring size={14} color="#eee" /> : <AiOutlineSearch />}
            </button>
          </div>
        </div>
        <Toggle />
        {namesError && (
          <div className="w-full">
            <p role="alert">{namesError}</p>
            <button type="button" className="btn mt-4" onClick={retryNames}>
              Try again
            </button>
          </div>
        )}
        {searchError && <p role="alert">{searchError}</p>}
      </div>
    </nav>
  );
}

export default Navbar;
