/* eslint-disable @next/next/no-img-element */
import type { NextPage } from "next";
import { useEffect, useState } from 'react';
import ReactPaginate from 'react-paginate';
import Grid from "../components/Grid";
import Pokemon from "../components/Pokemon";
import { PokemonDetails } from "../types/pokemonDetails";

const totalOfPokemons = 1154
const pokemonsPerPage = 9
const pageCount = Math.ceil(totalOfPokemons / pokemonsPerPage)

const Index: NextPage = () => {
  const [pokemon, setPokemon] = useState<PokemonDetails[]>([])
  const [off, setOff] = useState(0)

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

  const handlePageClick = (data: { selected: number }) => {
    setOff(data.selected * 9)
  }
  return (
    <>
      <h1>Olá</h1>
      <Grid>
        {
          pokemon.map((pokemon: PokemonDetails) => (
            <Pokemon key={pokemon.id} image={pokemon.sprites.front_default} text={pokemon.name} description={pokemon.types.map(type => type.type.name)} />
          ))
        }
      </Grid>

      <ReactPaginate
        breakLabel="..."
        nextLabel=" > "
        onPageChange={handlePageClick}
        pageRangeDisplayed={5}
        pageCount={pageCount}
        previousLabel=" < "
        containerClassName="flex px-10 whitespace-nowrap"
        pageClassName="px-[6px]"
        pageLinkClassName="w-9 h-9 flex items-center justify-center rounded-md border border-[#EDEFF1] text-[#838995] text-base hover:bg-primary hover:border-primary hover:text-white"
        previousClassName="w-9 h-9 flex items-center justify-center rounded-md border border-[#EDEFF1] text-[#838995] text-base hover:bg-primary hover:border-primary hover:text-white"
        nextClassName="w-9 h-9 flex items-center justify-center rounded-md border border-[#EDEFF1] text-[#838995] text-base hover:bg-primary hover:border-primary hover:text-white"
        breakLinkClassName="w-9 h-9 flex items-center justify-center rounded-md border border-[#EDEFF1] text-[#838995] text-base hover:bg-primary hover:border-primary hover:text-white"
        activeClassName="text-white bg-black items-center justify-center rounded-md border border-[#EDEFF1] text-[#838995]"
      />
    </>
  )
}

export default Index

