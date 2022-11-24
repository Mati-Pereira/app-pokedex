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
      const filteredPokemons = pokemons.filter((pokemon: { name: string, url: string }) => pokemon.name.includes(input.toLowerCase()))
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
      {
        (actualFilterPokemon.length) ? actualFilterPokemon?.map((pokemon: PokemonDetails) => (
          <Grid key={pokemon.id}>
            <Link href={pokemon.name} >
              <Pokemon image={pokemon.sprites.front_default} text={pokemon.name} types={pokemon.types} />
            </Link>
          </Grid>
        )) : (
          <section className="flex flex-col h-[80vh] justify-center items-center  bg-slate-100 dark:bg-slate-800 dark:text-gray-100">
            <div className="container flex flex-col items-center justify-center px-5 mx-auto my-8">
              <div className="max-w-md text-center">
                <h2 className="mb-8 font-extrabold text-9xl dark:text-gray-600">
                  <span className="sr-only">Error</span>404
                </h2>
                <p className="text-2xl font-semibold md:text-3xl">Desculpe, não foi encontrado nenhum resultado.</p>
                <p className="mt-4 mb-8 dark:text-gray-400">Mas não se preocupe, você pode procurar por vários pokemons e saber suas características :).</p>
                <Link href="/" className="px-8 py-3 font-semibold rounded bg-slate-300 dark:bg-slate-400 dark:text-gray-900">De volta para o Início</Link>
              </div>
            </div>
          </section>
        )
      }
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
