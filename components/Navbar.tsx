/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { InputContext } from '../context/InputPokemon';
import { useLanguage } from '../context/LanguageContext';
import { fetchPokemonNames, usePokeApi } from '../lib/usePokeApi';
import { localizedType, t } from '../lib/i18n';
import types from '../data/types.json';
import SearchField, { SelectOption } from './SearchField';
import Toggle from './Toggle';

function Navbar() {
  const { updateInput } = useContext(InputContext);
  const { language, setLanguage } = useLanguage();
  const [shouldLoadNames, setShouldLoadNames] = useState(false);
  const loadNames = useCallback(() => setShouldLoadNames(true), []);

  useEffect(() => {
    type IdleScheduler = Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    const idleScheduler = window as IdleScheduler;
    let idleHandle: number | undefined;
    let timeoutHandle: number | undefined;

    if (idleScheduler.requestIdleCallback) {
      idleHandle = idleScheduler.requestIdleCallback(loadNames, { timeout: 2000 });
    } else {
      timeoutHandle = window.setTimeout(loadNames, 300);
    }

    return () => {
      if (idleHandle !== undefined) idleScheduler.cancelIdleCallback?.(idleHandle);
      if (timeoutHandle !== undefined) window.clearTimeout(timeoutHandle);
    };
  }, [loadNames]);

  const {
    data: pokemon,
    isLoading: namesLoading,
    error: namesError,
    retry: retryNames,
  } = usePokeApi(
    shouldLoadNames ? 'names' : null,
    signal => fetchPokemonNames('https://pokeapi.co/api/v2/pokemon?limit=100000&offset=0', signal),
    t(language, 'namesError')
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
        setSearchError(t(language, 'searchError'));
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

  const names: SelectOption[] | undefined = useMemo(
    () =>
      pokemon?.map(({ name }) => ({
        label: name.charAt(0).toUpperCase() + name.slice(1),
        value: name,
      })),
    [pokemon]
  );
  const typeOptions: SelectOption[] = useMemo(
    () =>
      types.map(({ value }) => ({
        value,
        label: localizedType(language, value),
      })),
    [language]
  );

  return (
    <nav
      aria-label={t(language, 'navigation')}
      className="border-b border-paper-border bg-paper-card p-3 transition-colors dark:border-slate-700 dark:bg-gray-900 sm:p-4 md:px-8 xl:px-16"
      id="navbar"
    >
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:flex-row">
        <Link href="/" className="flex min-h-12 items-center rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pokedex dark:focus-visible:outline-blue-700" aria-label={t(language, 'homeLink')}>
          <span className="w-24 self-center sm:w-28">
            <img src="pokedex-logo.png" alt="Pokédex" />
          </span>
        </Link>
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 md:max-w-2xl md:flex-1 md:gap-4">
          <SearchField
            instanceId="pokemon-name"
            placeholder={t(language, 'namePlaceholder')}
            ariaLabel={t(language, 'nameField')}
            options={names}
            isLoadingOptions={namesLoading}
            onFocus={loadNames}
            canSearch={!!inputName}
            isSearching={isLoadingName}
            isDisabled={isSearching}
            onSelect={option => setInputName(option?.value ?? '')}
            onSearch={handleName}
          />
          <SearchField
            instanceId="pokemon-type"
            placeholder={t(language, 'typePlaceholder')}
            ariaLabel={t(language, 'typeField')}
            options={typeOptions}
            value={typeOptions.find(option => option.value === inputType) || null}
            canSearch={!!inputType}
            isSearching={isLoadingType}
            isDisabled={isSearching}
            onSelect={option => {
              const nextType = option?.value ?? '';
              setInputType(nextType);
              if (!nextType && router.pathname === '/types') void router.push('/');
            }}
            onSearch={handleType}
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
            <span className="sr-only">{t(language, 'language')}</span>
            <span aria-hidden="true">{language === 'pt-BR' ? 'PT' : 'EN'}</span>
            <select
              aria-label={t(language, 'language')}
              value={language}
              onChange={event => setLanguage(event.target.value === 'en' ? 'en' : 'pt-BR')}
              className="min-h-11 rounded-lg border border-paper-border bg-paper-card px-2 text-paper-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pokedex dark:border-slate-500 dark:bg-slate-800 dark:text-white dark:focus-visible:outline-blue-700"
            >
              <option value="pt-BR">{t(language, 'portuguese')}</option>
              <option value="en">{t(language, 'english')}</option>
            </select>
          </label>
          <Toggle />
        </div>
        {namesError && (
          <div className="w-full">
            <p role="alert">{namesError}</p>
            <button type="button" className="btn mt-4" onClick={retryNames}>
              {t(language, 'retry')}
            </button>
          </div>
        )}
        {searchError && <p role="alert" className="w-full text-sm font-semibold text-red-800 dark:text-red-300">{searchError}</p>}
      </div>
    </nav>
  );
}

export default Navbar;
