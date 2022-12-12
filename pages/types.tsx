/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { useState } from 'react';
import Grid from '../components/Grid';
import Pokemon from '../components/Pokemon';
import { PokemonDetails } from '../types/pokemonDetails';
import Pagination from 'react-responsive-pagination';
import { GetServerSideProps } from 'next';

const Types = ({ results }: { results: PokemonDetails[] }) => {
    console.log("🚀 ~ file: types.tsx:11 ~ Types ~ results", results)
    const [pagePokemons, setPagePokemons] = useState<PokemonDetails[]>(results.slice(0, 9))
    const [currentPage, setCurrentPage] = useState(1)
    console.log("🚀 ~ file: types.tsx:17 ~ Types ~ currentPage", currentPage)
    const pageCount = Math.ceil(results.length / 9)
    const handlePageChange = (page: any) => {
        setCurrentPage(page)
        const initialIndex = (page - 1) * 9
        const finalIndex = ((page - 1) * 9) + 9
        setPagePokemons(results.slice(initialIndex, finalIndex))
    }

    if (!results.length) {
        return (
            <div className='bg-gray-200 dark:bg-slate-800 dark:text-white text-slate-800'>
                <div className="flex flex-col min-h-[calc(100vh-73px)] justify-center items-center text-center gap-10">
                    <img src="sadPokemon1.png" alt="Pokemon Sad Png @clipartmax.com" className='w-72' />
                    <div className="flex flex-col gap-6 tracking-widest mt-4">
                        <span className="text-6xl block"><span>4  0  4</span></span>
                        <span className="text-xl">Sorry, We couldn{"'"}t the pokemon that you are looking for!</span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-slate-100 dark:bg-slate-800 dark:text-slate-50 px-6 py-8 ring-1 ring-slate-900/5 shadow-xl">
            <Grid>
                {
                    pagePokemons?.map((pokemon: PokemonDetails) => (
                        <Link href={pokemon.name} key={pokemon.id}>
                            <Pokemon image={pokemon.sprites.front_default} text={pokemon.name.toUpperCase()} types={pokemon.types} />
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

export default Types

export const getServerSideProps: GetServerSideProps = async (context) => {
    const input = context.req.headers.cookie
    const res = await fetch(`https://pokeapi.co/api/v2/type/${input}`)
    const data = await res.json()
    const promises = data?.pokemon?.map(async (pokemon: any) => {
        const res = await fetch(pokemon?.pokemon?.url)
        const data = await res.json()
        return data
    })
    const results = await Promise.all(promises)
    return {
        props: {
            results
        }
    }
}

