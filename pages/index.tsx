import { Waveform } from "@uiball/loaders";
import type { NextPage } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Grid from "../components/Grid";
import Pokemon from "../components/Pokemon";
import { fetchPokemonDetails, fetchPokemonList, usePokeApi } from "../lib/usePokeApi";
import type { PokemonDetails } from "../types/pokemonDetails";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../lib/i18n";

const Pagination = dynamic(() => import("react-responsive-pagination"), { ssr: false });

const pokemonsPerPage = 9;

const Index: NextPage = () => {
  const { language } = useLanguage();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOfPokemons, setTotalOfPokemons] = useState(0);
  const offset = (currentPage - 1) * pokemonsPerPage;
  const { data, isLoading, error, retry } = usePokeApi(
    `list:${offset}`,
    async signal => {
      const list = await fetchPokemonList(
        `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${pokemonsPerPage}`,
        signal
      );
      return { count: list.count, pokemons: await fetchPokemonDetails(list.results, signal) };
    },
    t(language, 'catalogError')
  );
  const pokemons = data?.pokemons ?? [];
  const totalCount = data?.count ?? totalOfPokemons;
  const pageCount = Math.ceil(totalCount / pokemonsPerPage);

  useEffect(() => {
    if (data) setTotalOfPokemons(data.count);
  }, [data]);

  const handlePageChange = (page: number) => setCurrentPage(page);

  if (isLoading) {
    return (
        <div role="status" aria-live="polite" className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-4 bg-paper text-paper-ink dark:bg-slate-800 dark:text-white">
          <Waveform size={60} color="#3d3e7c" />
          <p>{t(language, 'loadingCatalog')}</p>
      </div>
    );
  }
  if (error) {
    return (
      <main className="min-h-[50vh] bg-paper px-6 py-8 text-paper-ink dark:bg-slate-800 dark:text-slate-50">
        <p role="alert">{error}</p>
        <button type="button" className="btn mt-4 bg-pokedex text-white hover:bg-pokedex-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pokedex dark:bg-blue-800 dark:hover:bg-blue-900 dark:focus-visible:outline-blue-700" onClick={retry}>{t(language, 'retry')}</button>
      </main>
    );
  }
  return (
    <main className="min-h-[calc(100vh-5rem)] bg-paper px-2 py-4 text-paper-ink shadow-xl ring-1 ring-slate-900/5 dark:bg-slate-800 dark:text-slate-50 sm:px-4 sm:py-6">
      <h1 className="sr-only">{t(language, 'catalogTitle')}</h1>
      {pokemons.length ? (
        <>
          <p className="px-2 text-sm text-paper-muted dark:text-slate-300" aria-live="polite">
            {t(language, 'showing', { start: offset + 1, end: Math.min(offset + pokemons.length, totalCount), total: totalCount })}
          </p>
          <Grid>
            {pokemons.map((pokemon: PokemonDetails) => (
              <Link href={`/${pokemon.name}`} key={pokemon.id} aria-label={t(language, 'viewDetails', { name: pokemon.name })} className="group rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pokedex dark:focus-visible:outline-blue-700">
                <Pokemon image={pokemon.sprites.front_default ?? ''} text={pokemon.name.toUpperCase()} types={pokemon.types} />
              </Link>
            ))}
          </Grid>
        </>
      ) : (
        <p className="px-2 py-10 text-center text-paper-ink dark:text-slate-200">{t(language, 'emptyCatalog')}</p>
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
          ariaPageLabel={(page, active) => active ? t(language, 'currentPage', { page }) : t(language, 'goToPage', { page })}
        />
        {pageCount > 0 && <p className="mt-2 text-center text-sm text-paper-muted dark:text-slate-300">{t(language, 'pageOf', { current: currentPage, total: pageCount })}</p>}
      </nav>
    </main>
  );
};

export default Index;
