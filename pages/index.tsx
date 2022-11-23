/* eslint-disable @next/next/no-img-element */
import type { NextPage } from "next";
import { ChangeEvent, useEffect, useState } from 'react';
import Pagination from 'react-responsive-pagination';
import Grid from "../components/Grid";
import Navbar from "../components/Navbar";
import Pokemon from "../components/Pokemon";

import { PokemonDetails } from "../types/pokemonDetails";

const totalOfPokemons = 1154
const pokemonsPerPage = 9
const pageCount = Math.ceil(totalOfPokemons / pokemonsPerPage)

const Index: NextPage = () => {
  const [pokemon, setPokemon] = useState<PokemonDetails[]>([])
  const [off, setOff] = useState(0)
  const [currentPage, setCurrentPage] = useState(1);
  const [darkMode, setDarkMode] = useState<'dark' | ''>()

  useEffect(() => {
    async function getData() {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${off}&limit=9`)
      const data = await res.json()
      const promises = data?.results?.map(async (pokemon: any) => {
        const res = await fetch(pokemon.url)
        const data = await res.json()
        return data
      })
      const results = await Promise.all(promises)
      setPokemon(results)
    }
    getData()
  }, [off])

  const handlePageChange = (page: number) => {
    setOff((page - 1) * 9)
    setCurrentPage(page)
  }
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    event.target.checked ? setDarkMode('dark') : setDarkMode('')
  }

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="bg-slate-100 dark:bg-slate-800 dark:text-slate-50 px-6 py-8 ring-1 ring-slate-900/5 shadow-xl">
        <Navbar onChange={handleChange} />

        <Grid>
          {
            pokemon.map((pokemon: PokemonDetails) => (
              <Pokemon key={pokemon.id} image={pokemon.sprites.front_default} text={pokemon.name} types={pokemon.types} />
            ))
          }
        </Grid>
        <div className="w- mx-auto">
          <Pagination
            current={currentPage}
            total={pageCount}
            onPageChange={handlePageChange}

          />
        </div>
      </div>
    </div>
  )
}

export default Index

