import { Waveform } from '@uiball/loaders';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';
import Pagination from 'react-responsive-pagination';
import Grid from '../components/Grid';
import Pokemon from '../components/Pokemon';
import { InputContext } from '../context/InputPokemon';
import { PokemonDetails } from '../types/pokemonDetails';

const Search = () => {
  const [allfilterPokemon, setAllFilterPokemon] = useState<PokemonDetails[]>([])
  const [actualFilterPokemon, setActualFilterPokemon] = useState<PokemonDetails[]>([])
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false)

  const { input } = useContext(InputContext)
  const router = useRouter()

  let pageCount = Math.ceil(allfilterPokemon.length / 9)

  const handlePageChange = (page: number) => {
    setIsLoading(true)
    const pokemons = allfilterPokemon.slice((page * 9) - 9, page * 9);
    setCurrentPage(page)
    setActualFilterPokemon(pokemons)
    router.push("#navbar")
    setIsLoading(false)
  }

  useEffect(() => {
    async function getData() {
      setIsLoading(true)
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=0&limit=100000`)
      const data = await res.json()
      const pokemons = data?.results
      const filteredPokemons = pokemons.filter((pokemon: { name: string, url: string }) => pokemon.name.includes(input))
      const promises = filteredPokemons.map(async (pokemon: any) => {
        const res = await fetch(pokemon.url)
        const data = await res.json()
        return data
      })
      const results = await Promise.all(promises)
      setAllFilterPokemon(results)
      setActualFilterPokemon(results.slice(0, 9))
      setIsLoading(false)
    }
    getData()
  }, [input]);

  if (isLoading) {
    return (
      <div style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
        className="bg-slate-100 dark:bg-slate-800"
      >
        <Waveform size={60} color="#3d3e7c" />
      </div>
    )
  }

  return (
    <div className="bg-slate-100 dark:bg-slate-800 dark:text-slate-50 px-6 py-8 ring-1 ring-slate-900/5 shadow-xl">
      <Grid>
        {
          actualFilterPokemon?.map((pokemon: PokemonDetails) => (
            <Link href={pokemon.name} key={pokemon.id}>
              <Pokemon image={pokemon.sprites.front_default} text={pokemon.name} types={pokemon.types} />
            </Link>
          ))
        }
      </Grid>
      <div className="w-100 mx-auto">
        <Pagination
          current={currentPage}
          total={pageCount}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  )
}

export default Search
