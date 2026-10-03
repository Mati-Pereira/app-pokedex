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
  const [isLoading, setLoading] = useState(true);
  const [pokemons, setPokemons] = useState<PokemonDetails[]>([]);

  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    async function getPokemon() {
      setLoading(true);
      setError("");
      setPokemons([]);
      try {
        const res = await fetch(
          `https://pokeapi.co/api/v2/pokemon?offset=${off}&limit=9`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error(`Pokemon list request failed: HTTP ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data.results)) throw new Error("Invalid Pokemon list response");
        const results = await Promise.all(data.results.map(async (pokemon: { url: string }) => {
          const res = await fetch(pokemon.url, { signal: controller.signal });
          if (!res.ok) throw new Error(`Pokemon request failed: HTTP ${res.status}`);
          const detail = await res.json();
          if (!detail || typeof detail.name !== "string" || !detail.sprites || !Array.isArray(detail.types)) {
            throw new Error("Invalid Pokemon response");
          }
          return detail;
        }));
        if (active) setPokemons(results);
      } catch {
        controller.abort();
        if (active) setError("Unable to load Pokemon. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    }
    getPokemon();
    return () => { active = false; controller.abort(); };
  }, [off, retry]);

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
  if (error) {
    return (
      <div className="px-6 py-8 bg-slate-100 dark:bg-slate-800 dark:text-slate-50">
        <p role="alert">{error}</p>
        <button type="button" className="btn mt-4" onClick={() => setRetry(value => value + 1)}>Try again</button>
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
