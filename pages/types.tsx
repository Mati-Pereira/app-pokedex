import { Waveform } from '@uiball/loaders';
import { NextPage } from 'next';
import Link from 'next/link';
import { useContext, useEffect, useState } from 'react';
import Grid from '../components/Grid';
import Pokemon from '../components/Pokemon';
import { InputContext } from '../context/InputPokemon';
import { PokemonDetails } from '../types/pokemonDetails';

const Types = () => {
    const { input } = useContext(InputContext)
    console.log("🚀 ~ file: types.tsx:9 ~ Types ~ input", input)
    const [isLoading, setLoading] = useState(false)
    const [pokemons, setPokemons] = useState<PokemonDetails[]>([])
    useEffect(() => {
        async function getPokemon() {
            setLoading(true)
            const res = await fetch(`https://pokeapi.co/api/v2/type/${input}`)
            const data = await res.json()
            const promises = data?.pokemon.map(async (pokemon: any) => {
                const res = await fetch(pokemon?.pokemon.url)
                const data = await res.json()
                return data
            })
            const results = await Promise.all(promises)
            setPokemons(results)
            setLoading(false)
        }
        getPokemon()
    }, [input])
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
                    pokemons?.map((pokemon: PokemonDetails) => (
                        <Link href={pokemon.name} key={pokemon.id}>
                            <Pokemon image={pokemon.sprites.front_default} text={pokemon.name.toUpperCase()} types={pokemon.types} />
                        </Link>
                    ))
                }
            </Grid>
        </div>
    )
}

export default Types
