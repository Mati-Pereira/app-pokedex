/* eslint-disable @next/next/no-img-element */
import type { NextPage } from "next";
import { useEffect, useState } from 'react';
import { PokemonDetails } from "../types/pokemonDetails";


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

  return (
    <>
      <h1>Olá</h1>
      {
        pokemon?.map((e) => {
          return (
            <div key={e.name}>
              <img src={e.sprites.front_default} alt="olá" />
              <p>{e.name}</p>
            </div>
          )
        })
      }
      <button onClick={() => { setOff(e => e + 9) }}>Click</button>
    </>
  )
}

export default Index

