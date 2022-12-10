import { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import { PokemonDetails } from "../types/pokemonDetails";

interface DetailsProps {
  data: PokemonDetails;
}

function Details({ data }: DetailsProps) {
  return (
    <div>
      <section className="flex py-44 justify-center items-center bg-slate-100 dark:bg-slate-800 dark:text-gray-100">
        <div className="container flex flex-col items-center justify-center px-5 mx-auto ">
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