import { Waveform } from '@uiball/loaders';
import type { GetStaticProps, NextPage } from 'next';
import Link from 'next/link';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import Grid from '../components/Grid';
import Pokemon from '../components/Pokemon';
import { fetchPokemonDetails, fetchPokemonList, usePokeApi } from '../lib/usePokeApi';
import { getPokemonCatalogPage } from '../lib/pokemonCatalog';
import type { PokemonCatalogPage } from '../lib/pokemonCatalog';
import { getPageCount, getPageOffset, pokemonsPerPage } from '../lib/pagination';
import type { PokemonDetails } from '../types/pokemonDetails';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../lib/i18n';

const Pagination = dynamic(() => import('react-responsive-pagination'), { ssr: false });

const catalogRevalidateSeconds = 6 * 60 * 60;

interface IndexProps {
  initialData: PokemonCatalogPage;
}

const Index: NextPage<IndexProps> = ({ initialData }) => {
  const { language } = useLanguage();
  const [currentPage, setCurrentPage] = useState(1);
  const offset = getPageOffset(currentPage);
  const pageRequest = usePokeApi(
    offset === 0 ? null : `list:${offset}`,
    async signal => {
      const list = await fetchPokemonList(
        `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${pokemonsPerPage}`,
        signal
      );
      return { count: list.count, pokemons: await fetchPokemonDetails(list.results, signal) };
    },
    t(language, 'catalogError')
  );
  const data = offset === 0 ? initialData : pageRequest.data;
  const isLoading = offset !== 0 && pageRequest.isLoading;
  const error = offset === 0 ? '' : pageRequest.error;
  const pokemons = data?.pokemons ?? [];
  const totalCount = data?.count ?? initialData.count;
  const pageCount = getPageCount(totalCount);

  const handlePageChange = (page: number) => setCurrentPage(page);

  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="bg-paper text-paper-ink flex min-h-[50vh] w-full flex-col items-center justify-center gap-4 dark:bg-slate-800 dark:text-white"
      >
        <Waveform size={60} color="#3d3e7c" />
        <p>{t(language, 'loadingCatalog')}</p>
      </div>
    );
  }
  if (error) {
    return (
      <main className="bg-paper text-paper-ink min-h-[50vh] px-6 py-8 dark:bg-slate-800 dark:text-slate-50">
        <p role="alert">{error}</p>
        <button
          type="button"
          className="btn bg-pokedex hover:bg-pokedex-hover focus-visible:outline-pokedex mt-4 text-white focus-visible:outline-2 focus-visible:outline-offset-2 dark:bg-blue-800 dark:hover:bg-blue-900 dark:focus-visible:outline-blue-700"
          onClick={pageRequest.retry}
        >
          {t(language, 'retry')}
        </button>
      </main>
    );
  }
  return (
    <main className="bg-paper text-paper-ink min-h-[calc(100vh-5rem)] px-2 py-4 shadow-xl ring-1 ring-slate-900/5 sm:px-4 sm:py-6 dark:bg-slate-800 dark:text-slate-50">
      <h1 className="sr-only">{t(language, 'catalogTitle')}</h1>
      {pokemons.length ? (
        <>
          <p className="text-paper-muted px-2 text-sm dark:text-slate-300" aria-live="polite">
            {t(language, 'showing', {
              start: offset + 1,
              end: Math.min(offset + pokemons.length, totalCount),
              total: totalCount,
            })}
          </p>
          <Grid>
            {pokemons.map((pokemon: PokemonDetails, index: number) => (
              <Link
                href={`/${pokemon.name}`}
                key={pokemon.id}
                aria-label={t(language, 'viewDetails', { name: pokemon.name })}
                className="group focus-visible:outline-pokedex rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 dark:focus-visible:outline-blue-700"
              >
                <Pokemon
                  image={pokemon.sprites.front_default ?? ''}
                  text={pokemon.name.toUpperCase()}
                  types={pokemon.types}
                  priority={index === 0}
                />
              </Link>
            ))}
          </Grid>
        </>
      ) : (
        <p className="text-paper-ink px-2 py-10 text-center dark:text-slate-200">
          {t(language, 'emptyCatalog')}
        </p>
      )}
      <nav className="mx-auto max-w-xl px-2 py-5" aria-label={t(language, 'catalogPagination')}>
        <Pagination
          current={currentPage}
          total={pageCount}
          onPageChange={handlePageChange}
          previousLabel="‹"
          nextLabel="›"
          ariaPreviousLabel={t(language, 'previousPage')}
          ariaNextLabel={t(language, 'nextPage')}
          ariaPageLabel={(page, active) =>
            active ? t(language, 'currentPage', { page }) : t(language, 'goToPage', { page })
          }
        />
        {pageCount > 0 && (
          <p className="text-paper-muted mt-2 text-center text-sm dark:text-slate-300">
            {t(language, 'pageOf', { current: currentPage, total: pageCount })}
          </p>
        )}
      </nav>
    </main>
  );
};

export default Index;

export const getStaticProps: GetStaticProps<IndexProps> = async () => ({
  props: {
    initialData: await getPokemonCatalogPage(0, pokemonsPerPage),
  },
  revalidate: catalogRevalidateSeconds,
});
