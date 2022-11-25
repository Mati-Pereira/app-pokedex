import Link from 'next/link';

const Search = () => {

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
  )
}

export default Search
