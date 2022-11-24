import { useEffect, useState } from 'react';
import Grid from '../components/Grid';
const Search = () => {
  const [filterPokemon, setFilterPokemon] = useState([])
  useEffect(() => {
    async function getData() {
      const input = localStorage.getItem("input")
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=0&limit=100000`)
      const data = await res.json()
      const results = data?.results
      console.log("🚀 ~ file: search.tsx ~ line 11 ~ getData ~ results", results)
      
      const filteredPokemons = results?.filter((pokemon: { name: string }) => pokemon.name.includes(input!))
      setFilterPokemon(filteredPokemons)
    }
    getData()
  }, []);
  console.log(filterPokemon);

  return (
    <div className="bg-slate-100 dark:bg-slate-800 dark:text-slate-50 px-6 py-8 ring-1 ring-slate-900/5 shadow-xl">
      <Grid>
        {/* {
          pokemon.map((pokemon: PokemonDetails) => (
            <Link href={pokemon.name} key={pokemon.id}>
              <Pokemon image={pokemon.sprites.front_default} text={pokemon.name} types={pokemon.types} />
            </Link>
          ))
        } */}
      </Grid>
      <div className="w-100 mx-auto">
        {/* <Pagination
          current={currentPage}
          total={pageCount}
          onPageChange={handlePageChange}
        /> */}
      </div>
    </div>
  )
}

export default Search
