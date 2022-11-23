/* eslint-disable @next/next/no-img-element */
import type { NextPage } from "next";
import { useEffect, useState } from 'react';
import Pagination from 'react-responsive-pagination';
import Grid from "../components/Grid";
import Pokemon from "../components/Pokemon";

import { PokemonDetails } from "../types/pokemonDetails";

const totalOfPokemons = 1154
const pokemonsPerPage = 9
const pageCount = Math.ceil(totalOfPokemons / pokemonsPerPage)

const Index: NextPage = () => {
  const [pokemon, setPokemon] = useState<PokemonDetails[]>([])
  const [off, setOff] = useState(0)
  const [currentPage, setCurrentPage] = useState(1);


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

  return (
    <>
      <h1>Olá</h1>
      <Grid>
        {
          pokemon.map((pokemon: PokemonDetails) => (
            <Pokemon key={pokemon.id} image={pokemon.sprites.front_default} text={pokemon.name} types={pokemon.types} />
          ))
        }
      </Grid>
      <div className="w-[80%] mx-auto">
        <Pagination
          current={currentPage}
          total={pageCount}
          onPageChange={handlePageChange}
        />
      </div>
    </>
  )
}

export default Index

