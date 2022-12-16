/* eslint-disable @next/next/no-img-element */
import { Waveform } from "@uiball/loaders";
import type { NextPage } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
import Pagination from "react-responsive-pagination";
import Grid from "../components/Grid";
import Pokemon from "../components/Pokemon";
import { PokemonDetails } from "../types/pokemonDetails";

const totalOfPokemons = 1154;
const pokemonsPerPage = 9;
const pageCount = Math.ceil(totalOfPokemons / pokemonsPerPage);

const Index: NextPage = () => {
  const [off, setOff] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setLoading] = useState(false);
  const [pokemons, setPokemons] = useState<PokemonDetails[]>([]);

  useEffect(() => {
    async function getPokemon() {
      setLoading(true);
      const res = await fetch(
        `https://pokeapi.co/api/v2/pokemon?offset=${off}&limit=9`
      );
      const data = await res.json();
      const promises = data?.results?.map(async (pokemon: any) => {
        const res = await fetch(pokemon?.url);
        const data = await res.json();
        return data;
      });
      const results = await Promise.all(promises);
      setPokemons(results);
      setLoading(false);
    }
    getPokemon();
  }, [off]);

  const handlePageChange = (page: number) => {
    setOff((page - 1) * 9);
    setCurrentPage(page);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-slate-100 dark:bg-slate-800">
        <Waveform size={60} color="#3d3e7c" />
      </div>
    );
  }
  return (
    <div className="px-6 py-8 shadow-xl bg-slate-100 dark:bg-slate-800 dark:text-slate-50 ring-1 ring-slate-900/5">
      <Grid>
        {pokemons?.map((pokemon: PokemonDetails) => (
          <Link href={pokemon.name} key={pokemon.id}>
            <Pokemon
              image={pokemon.sprites.front_default}
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
