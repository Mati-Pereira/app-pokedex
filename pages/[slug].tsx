/* eslint-disable @next/next/no-img-element */
import { GetStaticPaths, GetStaticProps } from 'next';
import { pokeApiFetch } from '../lib/pokeapi';
import { PokemonDetails } from '../types/pokemonDetails';
const prerenderedPokemons = 50;
interface DetailsProps {
  data: PokemonDetails;
}
function Details({ data }: DetailsProps) {
  return (
    <>
      <h1 className="flex w-full justify-center py-10 text-4xl font-bold text-slate-800 dark:text-white">
        {data.name.toUpperCase()}
      </h1>
      <div className="flex flex-col md:flex-row">
        <div className="flex w-full flex-col items-center justify-center bg-slate-100 px-12 dark:bg-slate-800 dark:text-gray-100 md:w-1/2">
          <div className="carousel w-full bg-slate-100 dark:bg-slate-800">
            <div id="item1" className="carousel-item w-full">
              <img src={data.sprites.front_default} className="w-full" alt="pokemon" />
            </div>
            <div id="item2" className="carousel-item w-full">
              <img src={data.sprites.back_default} className="w-full" alt="pokemon" />
            </div>
            <div id="item3" className="carousel-item w-full">
              <img src={data.sprites.front_shiny} className="w-full" alt="pokemon" />
            </div>
            <div id="item4" className="carousel-item w-full">
              <img src={data.sprites.back_shiny} className="w-full" alt="pokemon" />
            </div>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 py-2 md:grid-cols-4">
            <a
              href="#item1"
              className="btn-xs btn h-full border-none bg-slate-300 hover:bg-slate-500 dark:bg-slate-500 dark:hover:bg-slate-300"
              title="pokemon"
            >
              <img src={data.sprites.front_default} alt="front" />
            </a>
            <a
              href="#item2"
              className="btn-xs btn h-full border-none bg-slate-300 hover:bg-slate-500 dark:bg-slate-500 dark:hover:bg-slate-300"
              title="pokemon"
            >
              <img src={data.sprites.back_default} alt="back" />
            </a>
            <a
              href="#item3"
              className="btn-xs btn h-full border-none bg-slate-300 hover:bg-slate-500 dark:bg-slate-500 dark:hover:bg-slate-300"
              title="pokemon"
            >
              <img src={data.sprites.front_shiny} alt="front_shiny" />
            </a>
            <a
              href="#item4"
              className="btn-xs btn h-full border-none bg-slate-300 hover:bg-slate-500 dark:bg-slate-500 dark:hover:bg-slate-300"
              title="pokemon"
            >
              <img src={data.sprites.back_shiny} alt="back_shiny" />
            </a>
          </div>
        </div>
        <div className="flex w-full flex-col items-center justify-center gap-6 px-12 md:w-1/2">
          <div className="py-10 text-center">
            <h2 className="mb-5 text-2xl font-semibold text-slate-800 dark:text-white">
              Abilities
            </h2>
            <div className="flex gap-3">
              {data.abilities.map((ability, i) => (
                <span
                  key={i}
                  className="my-5 overflow-hidden rounded-full bg-gray-200 px-5 py-3 text-slate-800 shadow-lg dark:bg-sky-900 dark:text-white"
                >
                  {ability.ability.name}
                </span>
              ))}
            </div>
          </div>
          <table className="flex w-fit flex-col justify-around pb-10">
            <tbody className="flex flex-col justify-evenly border-slate-800 bg-slate-100 dark:border-slate-100 dark:bg-slate-800">
              {data.stats.map(stat => (
                <tr key={stat.stat.name}>
                  <td className="mb-10 w-36 whitespace-nowrap border-b border-slate-600 px-6 py-4 text-sm font-medium text-slate-800 dark:text-white md:w-40 lg:w-48">
                    {stat.stat.name}
                  </td>
                  <td className="mb-10 w-32 whitespace-nowrap border-b border-slate-600 px-6 py-4 text-center text-sm font-light text-slate-800 dark:text-white md:w-36 lg:w-48">
                    {stat.base_stat}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
export default Details;
export const getStaticProps: GetStaticProps = async context => {
  const slug = context.params ? context.params['slug'] : undefined;
  if (typeof slug !== 'string' || !slug.trim()) {
    return { notFound: true };
  }
  const res = await pokeApiFetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(slug)}`);
  if (res.status === 404) {
    return { notFound: true };
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch Pokemon details: HTTP ${res.status}`);
  }
  const data = await res.json();
  if (!data || typeof data.name !== 'string') {
    throw new Error('Invalid Pokemon details response');
  }
  return {
    props: {
      data,
    },
    // Pokemon data rarely changes; refresh cached pages at most once a day.
    revalidate: 60 * 60 * 24,
  };
};
export const getStaticPaths: GetStaticPaths = async () => {
  // Only the first Pokemon are pre-rendered; the rest are generated on first
  // request (fallback: 'blocking') and then cached. If the API is unavailable
  // at build time, the build still succeeds and every page is built on demand.
  try {
    const res = await pokeApiFetch(`https://pokeapi.co/api/v2/pokemon?offset=0&limit=${prerenderedPokemons}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data?.results)) throw new Error('Invalid Pokemon list response');
    const paths = data.results
      .filter((p: { name?: unknown }) => typeof p?.name === 'string')
      .map((p: { name: string }) => ({ params: { slug: p.name } }));
    return { paths, fallback: 'blocking' };
  } catch (error) {
    console.warn('Skipping Pokemon pre-rendering:', error);
    return { paths: [], fallback: 'blocking' };
  }
};
