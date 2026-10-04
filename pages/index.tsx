/* eslint-disable @next/next/no-img-element */
import { Waveform } from "@uiball/loaders";
import type { NextPage } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Grid from "../components/Grid";
import Pokemon from "../components/Pokemon";
import { fetchPokemonDetails, fetchPokemonList, usePokeApi } from "../lib/usePokeApi";
import type { PokemonDetails } from "../types/pokemonDetails";

const Pagination = dynamic(() => import("react-responsive-pagination"), { ssr: false });

const pokemonsPerPage = 9;

const Index: NextPage = () => {
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
    "Unable to load Pokemon. Please try again."
  );
  const pokemons = data?.pokemons ?? [];
  const pageCount = Math.ceil(totalOfPokemons / pokemonsPerPage);

  useEffect(() => {
    if (data) setTotalOfPokemons(data.count);
  }, [data]);

  const handlePageChange = (page: number) => setCurrentPage(page);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-slate-100 dark:bg-slate-800">
        <Waveform size={60} color="#3d3e7c" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="px-6 py-8 bg-slate-100 dark:bg-slate-800 dark:text-slate-50">
        <p role="alert">{error}</p>
        <button type="button" className="btn mt-4" onClick={retry}>Try again</button>
      </div>
    );
  }
  return (
    <div className="px-6 py-8 shadow-xl bg-slate-100 dark:bg-slate-800 dark:text-slate-50 ring-1 ring-slate-900/5">
      <Grid>
        {pokemons?.map((pokemon: PokemonDetails) => (
          <Link href={pokemon.name} key={pokemon.id}>
            <Pokemon
              image={pokemon.sprites.front_default ?? ''}
              text={pokemon.name.toUpperCase()}
              types={pokemon.types}
            />
          </Link>
        ))}
      </Grid>
      <div className="mx-auto w-100">
        <Pagination
          current={currentPage}
          total={pageCount}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default Index;
