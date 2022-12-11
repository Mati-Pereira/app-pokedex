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
          <a href="#item1" className="btn btn-xs h-full" title="pokemon"><img src={data.sprites.front_default} alt="front" /></a>
          <a href="#item2" className="btn btn-xs h-full" title="pokemon"><img src={data.sprites.back_default} alt="back" /></a>
          <a href="#item3" className="btn btn-xs h-full" title="pokemon"><img src={data.sprites.front_shiny} alt="front_shiny" /></a>
          <a href="#item4" className="btn btn-xs h-full" title="pokemon"><img src={data.sprites.back_shiny} alt="back_shiny" /></a>
        </div>
      </div>
      <div className="flex justify-center items-center w-full md:w-1/2 px-12">
        dsfgadsfgasd
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