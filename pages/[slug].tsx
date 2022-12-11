/* eslint-disable @next/next/no-img-element */
import { GetStaticPaths, GetStaticProps } from "next";
import { PokemonDetails } from "../types/pokemonDetails";

interface DetailsProps {
  data: PokemonDetails;
}

function Details({ data }: DetailsProps) {
  return (
    <div className="flex flex-col md:flex-row h-full md:h-[calc(100vh-73px)]">
      <div className="bg-slate-100 dark:bg-slate-800 dark:text-gray-100 w-full md:w-1/2 px-12 flex items-center justify-center flex-col">
        <div className="carousel w-full bg-slate-100 dark:bg-slate-800 py-10">
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
        <div className="grid grid-cols-2 md:grid-cols-4 w-full py-2 gap-2">
          <a href="#item1" className="btn btn-xs h-full border-none bg-slate-300 dark:bg-slate-500 dark:hover:bg-slate-300 hover:bg-slate-500" title="pokemon"><img src={data.sprites.front_default} alt="front" /></a>
          <a href="#item2" className="btn btn-xs h-full border-none bg-slate-300 dark:bg-slate-500 dark:hover:bg-slate-300 hover:bg-slate-500" title="pokemon"><img src={data.sprites.back_default} alt="back" /></a>
          <a href="#item3" className="btn btn-xs h-full border-none bg-slate-300 dark:bg-slate-500 dark:hover:bg-slate-300 hover:bg-slate-500" title="pokemon"><img src={data.sprites.front_shiny} alt="front_shiny" /></a>
          <a href="#item4" className="btn btn-xs h-full border-none bg-slate-300 dark:bg-slate-500 dark:hover:bg-slate-300 hover:bg-slate-500" title="pokemon"><img src={data.sprites.back_shiny} alt="back_shiny" /></a>
        </div>
      </div>
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 px-12">
        <h1 className="text-4xl text-slate-800 mb-10 dark:text-white">{data.name}</h1>
        <h2 className="text-slate-800 text-2xl mb-5 dark:text-white">Habilidades</h2>
        {data.abilities.map((ability, i) => <p key={i} className="flex gap-6 text-slate-800 dark:text-white">{ability.ability.name}</p>)}
        <div className="flex flex-col">
          <div className="overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 inline-block min-w-full sm:px-6 lg:px-8">
              <div className="overflow-hidden">
                <table className="min-w-full">
                  <tbody>
                    <tr className="bg-slate-100 dark:bg-slate-800 dark:border-slate-100 border-b border-slate-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800 mb-10 dark:text-white">1</td>
                      <td className="text-sm text-slate-800 mb-10 dark:text-white font-light px-6 py-4 whitespace-nowrap">
                        Mark
                      </td>
                    </tr>
                    <tr className="bg-slate-100 dark:bg-slate-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800 mb-10 dark:text-white">2</td>
                      <td className="text-sm text-slate-800 mb-10 dark:text-white font-light px-6 py-4 whitespace-nowrap">
                        Jacob
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Details;

export const getStaticProps: GetStaticProps = async context => {
  const slug = context.params?.slug
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${slug}`)
  const data = await res.json()
  return {
    props: {
      data
    },
  };
};


export const getStaticPaths: GetStaticPaths = async (ctx) => {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=0&limit=100000`)
  const data = await res.json()
  const results = data?.results
  const paths = results.map((p: { name: string }) => {
    return {
      params: {
        slug: p.name
      }
    }
  })
  return {
    paths,
    fallback: "blocking"
  }
}