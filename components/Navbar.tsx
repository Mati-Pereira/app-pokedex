/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useContext, useEffect, useRef, useState } from 'react';
import { InputContext } from '../context/InputPokemon';
import { fetchPokemonNames, usePokeApi } from '../lib/usePokeApi';
import types from '../data/types.json';
import SearchField, { SelectOption } from './SearchField';
import Toggle from './Toggle';

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

  useEffect(() => {
    if (!router.isReady || router.pathname !== '/types') return;
    const type = router.query['type'];
    setInputType(
      typeof type === 'string' && types.some(option => option.value === type) ? type : ''
    );
  }, [router.isReady, router.pathname, router.query]);

  const names: SelectOption[] | undefined = pokemon?.map(({ name }) => ({
    label: name,
    value: name,
  }));

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
          <SearchField
            instanceId="pokemon-name"
            placeholder="Select Per Name..."
            ariaLabel="Search by name"
            options={names}
            isLoadingOptions={namesLoading}
            canSearch={!!inputName}
            isSearching={isLoadingName}
            isDisabled={isSearching}
            onSelect={option => setInputName(option.value)}
            onSearch={handleName}
          />
          <SearchField
            instanceId="pokemon-type"
            placeholder="Select Per Type..."
            ariaLabel="Search by type"
            options={types}
            value={types.find(option => option.value === inputType) || null}
            canSearch={!!inputType}
            isSearching={isLoadingType}
            isDisabled={isSearching}
            onSelect={option => setInputType(option.label)}
            onSearch={handleType}
          />
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
