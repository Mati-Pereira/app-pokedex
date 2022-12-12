/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { useState } from 'react';
import Grid from '../components/Grid';
import Pokemon from '../components/Pokemon';
import { PokemonDetails } from '../types/pokemonDetails';
import Pagination from 'react-responsive-pagination';
import { GetServerSideProps } from 'next';
import { Waveform } from '@uiball/loaders';

const Types = ({ results }: { results: PokemonDetails[] }) => {
    const [pagePokemons, setPagePokemons] = useState<PokemonDetails[]>(results.slice(0, 9))
    const [currentPage, setCurrentPage] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const pageCount = Math.ceil(results.length / 9)

    const handlePageChange = (page: any) => {
        setCurrentPage(page)
        const initialIndex = (page - 1) * 9
        const finalIndex = ((page - 1) * 9) + 9
        setPagePokemons(results.slice(initialIndex, finalIndex))
    }

    if (isLoading) {
        return (
            <div className="bg-slate-100 dark:bg-slate-800 w-full h-screen flex justify-center items-center"      >
                <Waveform size={60} color="#3d3e7c" />
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

