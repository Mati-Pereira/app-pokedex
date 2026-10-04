/* eslint-disable @next/next/no-img-element */
import { Waveform } from '@uiball/loaders';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Grid from '../components/Grid';
import Pokemon from '../components/Pokemon';
import types from '../data/types.json';
import type { TypeResponse } from '../types/pokeapi';
import type { PokemonDetails } from '../types/pokemonDetails';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

const Pagination = dynamic(() => import('react-responsive-pagination'), { ssr: false });

const Types = () => {
  const [isLoading, setLoading] = useState(true);
  const [allPokemons, setAllPokemons] = useState<PokemonDetails[]>([]);
  const [pagePokemons, setPagePokemons] = useState<PokemonDetails[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const pageCount = Math.ceil(allPokemons.length / 9);
  const router = useRouter();
  const queryType = router.query['type'];
  const type =
    typeof queryType === 'string' && types.some(option => option.value === queryType)
      ? queryType
      : '';
  const handlePageChange = (page: number) => {
    setLoading(true);
    setCurrentPage(page);
    const initialIndex = (page - 1) * 9;
    const finalIndex = (page - 1) * 9 + 9;
    setPagePokemons(allPokemons.slice(initialIndex, finalIndex));
    setLoading(false);
  };
  useEffect(() => {
    if (!router.isReady) return;
    let active = true;
    const controller = new AbortController();
    setError('');
    setCurrentPage(1);
    setAllPokemons([]);
    setPagePokemons([]);
    if (!type) {
      setLoading(false);
      return;
    }
    async function getPokemon() {
      setLoading(true);
      try {
        const res = await fetch(`https://pokeapi.co/api/v2/type/${encodeURIComponent(type)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Type request failed: HTTP ${res.status}`);
        const data = (await res.json()) as TypeResponse;
        if (!Array.isArray(data.pokemon)) throw new Error('Invalid type response');
        const promises = data.pokemon.map(async entry => {
          const res = await fetch(entry.pokemon.url, { signal: controller.signal });
          if (!res.ok) throw new Error(`Pokemon request failed: HTTP ${res.status}`);
          const detail = (await res.json()) as PokemonDetails;
          if (
            !detail ||
            typeof detail.name !== 'string' ||
            !detail.sprites ||
            !Array.isArray(detail.types)
          ) {
            throw new Error('Invalid Pokemon response');
          }
          return detail;
        });
        const results = await Promise.all(promises);
        if (!active) return;
        setAllPokemons(results);
        setPagePokemons(results.slice(0, 9));
      } catch {
        controller.abort();
        if (active) setError('Unable to load Pokemon for this type. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    }
    getPokemon();
    return () => {
      active = false;
      controller.abort();
    };
  }, [router.isReady, type, retry]);
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
        <button type="button" className="btn mt-4" onClick={() => setRetry(value => value + 1)}>
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
