/* eslint-disable @next/next/no-img-element */
import { Waveform } from '@uiball/loaders';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Grid from '../components/Grid';
import Pokemon from '../components/Pokemon';
import types from '../data/types.json';
import { fetchPokemonDetails, fetchTypeMembers, usePokeApi } from '../lib/usePokeApi';
import type { PokemonDetails } from '../types/pokemonDetails';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useLanguage } from '../context/LanguageContext';
import { localizedType, t } from '../lib/i18n';

const Pagination = dynamic(() => import('react-responsive-pagination'), { ssr: false });

const pokemonsPerPage = 9;

const Types = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const { language } = useLanguage();
  const router = useRouter();
  const queryType = router.query['type'];
  const type =
    typeof queryType === 'string' && types.some(option => option.value === queryType)
      ? queryType
      : '';
  const {
    data,
    isLoading: isFetching,
    error,
    retry,
  } = usePokeApi(
    router.isReady && type ? `type:${type}` : null,
    async signal => {
      const members = await fetchTypeMembers(
        `https://pokeapi.co/api/v2/type/${encodeURIComponent(type)}`,
        signal
      );
      return fetchPokemonDetails(members, signal);
    },
    t(language, 'typeError')
  );
  const isLoading = !router.isReady || isFetching;
  const allPokemons = data ?? [];
  const pageCount = Math.ceil(allPokemons.length / pokemonsPerPage);
  const pagePokemons = allPokemons.slice(
    (currentPage - 1) * pokemonsPerPage,
    currentPage * pokemonsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [type]);

  const handlePageChange = (page: number) => setCurrentPage(page);
  if (isLoading) {
    return (
      <div role="status" aria-live="polite" className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-4 bg-paper text-paper-ink dark:bg-slate-800 dark:text-white">
        <Waveform size={60} color="#3d3e7c" />
        <p>{t(language, 'loadingPokemons')}</p>
      </div>
    );
  }
  if (error) {
    return (
      <main className="min-h-[50vh] bg-paper px-6 py-8 text-paper-ink dark:bg-slate-800 dark:text-slate-50">
        <p role="alert">{error}</p>
        <button type="button" className="btn mt-4 bg-pokedex text-white hover:bg-pokedex-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pokedex dark:bg-blue-800 dark:hover:bg-blue-900 dark:focus-visible:outline-blue-700" onClick={retry}>
          {t(language, 'retry')}
        </button>
      </main>
    );
  }
  if (!allPokemons.length) {
    return (
      <main className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center gap-5 bg-paper px-5 py-10 text-center text-paper-ink dark:bg-slate-800 dark:text-white">
        <img src="sadPokemon1.png" alt="" aria-hidden="true" className="w-48 sm:w-60" />
        <h1 className="text-2xl font-bold sm:text-3xl">{t(language, 'emptyTitle')}</h1>
        <p>{t(language, 'emptyType')}</p>
        <Link href="/" className="btn min-h-11 bg-pokedex text-white hover:bg-pokedex-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pokedex dark:bg-blue-800 dark:hover:bg-blue-900 dark:focus-visible:outline-blue-700">
          {t(language, 'allPokemons')}
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-paper px-2 py-4 text-paper-ink shadow-xl ring-1 ring-slate-900/5 dark:bg-slate-800 dark:text-slate-50 sm:px-4 sm:py-6">
      <h1 className="px-2 text-xl font-extrabold text-slate-900 dark:text-white">{t(language, 'typeHeading', { type: localizedType(language, type) })}</h1>
      <p className="px-2 pt-1 text-sm text-paper-muted dark:text-slate-300" aria-live="polite">
        {t(language, 'showing', { start: (currentPage - 1) * pokemonsPerPage + 1, end: Math.min(currentPage * pokemonsPerPage, allPokemons.length), total: allPokemons.length })}
      </p>
      <Grid>
        {pagePokemons?.map((pokemon: PokemonDetails) => (
          <Link href={`/${pokemon.name}`} key={pokemon.id} aria-label={t(language, 'viewDetails', { name: pokemon.name })} className="rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pokedex dark:focus-visible:outline-blue-700">
            <Pokemon
              image={pokemon.sprites.front_default ?? ''}
              text={pokemon.name.toUpperCase()}
              types={pokemon.types}
            />
          </Link>
        ))}
      </Grid>
      <nav className="mx-auto max-w-xl px-2 py-5" aria-label={t(language, 'resultsPagination')}>
        <Pagination
          current={currentPage}
          total={pageCount}
          onPageChange={handlePageChange}
          previousLabel="‹"
          nextLabel="›"
          ariaPreviousLabel={t(language, 'previousPage')}
          ariaNextLabel={t(language, 'nextPage')}
          ariaPageLabel={(page, active) => active ? t(language, 'currentPage', { page }) : t(language, 'goToPage', { page })}
        />
        {pageCount > 0 && <p className="mt-2 text-center text-sm text-paper-muted dark:text-slate-300">{t(language, 'pageOf', { current: currentPage, total: pageCount })}</p>}
      </nav>
    </main>
  );
};

export default Types;
