import { GetStaticPaths, GetStaticProps } from "next";
import Pokemon from "../components/Pokemon";
import { PokemonDetails } from "../types/pokemonDetails";

interface DetailsProps {
  data: PokemonDetails;
}

function Details({ data }: DetailsProps) {
  return (
    <div className="flex justify-center items-center h-[calc(100vh-200px)] w-screen">
      <section className="flex justify-center items-center bg-slate-100 dark:bg-slate-800 dark:text-gray-100">
        <Pokemon image={data.sprites.front_default} text={data.name} types={data.types} />
      </section>
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