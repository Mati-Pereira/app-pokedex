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

const Pagination = dynamic(() => import('react-responsive-pagination'), { ssr: false });

const pokemonsPerPage = 9;

const Types = () => {
  const [currentPage, setCurrentPage] = useState(1);
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
    'Unable to load Pokemon for this type. Please try again.'
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
      <div className="flex h-screen w-full items-center justify-center bg-slate-100 dark:bg-slate-800">
        <Waveform size={60} color="#3d3e7c" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-slate-100 px-6 py-8 dark:bg-slate-800 dark:text-slate-50">
        <p role="alert">{error}</p>
        <button type="button" className="btn mt-4" onClick={retry}>
          Try again
        </button>
      </div>
    );
  }
  if (!allPokemons.length) {
    return (
      <div className="bg-gray-200 text-slate-800 dark:bg-slate-800 dark:text-white">
        <div className="flex min-h-[calc(100vh-73px)] flex-col items-center justify-center gap-10 text-center">
          <img src="sadPokemon1.png" alt="Pokemon Sad Png @clipartmax.com" className="w-72" />
          <div className="mt-4 flex flex-col gap-6 tracking-widest">
            <span className="block text-6xl">
              <span>4 0 4</span>
            </span>
            <span className="text-xl">
              Sorry, We couldn{"'"}t the pokemon that you are looking for!
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-100 px-6 py-8 shadow-xl ring-1 ring-slate-900/5 dark:bg-slate-800 dark:text-slate-50">
      <Grid>
        {pagePokemons?.map((pokemon: PokemonDetails) => (
          <Link href={`/${pokemon.name}`} key={pokemon.id}>
            <Pokemon
              image={pokemon.sprites.front_default}
              text={pokemon.name.toUpperCase()}
              types={pokemon.types}
            />
          </Link>
        ))}
      </Grid>
      <div className="w-100 mx-auto">
        <Pagination current={currentPage} total={pageCount} onPageChange={handlePageChange} />
      </div>
    </div>
  );
};

export default Types;
