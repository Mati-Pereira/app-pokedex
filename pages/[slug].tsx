/* eslint-disable @next/next/no-img-element */
import { GetStaticPaths, GetStaticProps } from 'next';
import Link from 'next/link';
import { pokeApiFetch } from '../lib/pokeapi';
import { normalizePokemonDetails } from '../lib/pokemonDetails';
import { PokemonDetails } from '../types/pokemonDetails';
import { useLanguage } from '../context/LanguageContext';
import { localizedStat, localizedType, t } from '../lib/i18n';
import { isPokemonSlug } from '../lib/pokemonSlug';
import EvolutionChain from '../components/EvolutionChain';
import { isPokemonSpeciesUrl } from '../lib/evolution';

const pokemonNameLimit = 100000;
interface DetailsProps {
  data: PokemonDetails;
  speciesUrl: string;
  speciesName: string;
}

function Details({ data, speciesUrl, speciesName }: DetailsProps) {
  const { language } = useLanguage();
  return (
    <main className="text-paper-ink mx-auto min-h-[calc(100vh-5rem)] max-w-6xl px-4 py-5 sm:px-6 sm:py-8 dark:text-slate-100">
      <Link
        href="/"
        className="text-pokedex hover:bg-pokedex-soft focus-visible:outline-pokedex inline-flex min-h-11 items-center gap-2 rounded-lg px-3 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-blue-200 dark:hover:bg-slate-700 dark:focus-visible:outline-blue-700"
      >
        <span aria-hidden="true">←</span> {t(language, 'detailsBack')}
      </Link>
      <h1 className="py-5 text-center text-3xl font-extrabold tracking-wide text-slate-900 sm:py-8 sm:text-4xl dark:text-white">
        {data.name.toUpperCase()}
      </h1>
      <div className="grid gap-5 md:grid-cols-2 md:gap-8">
        <section
          aria-label={t(language, 'gallery', { name: data.name })}
          className="border-paper-border bg-paper-card rounded-2xl border p-3 shadow-md sm:p-5 dark:border-slate-600 dark:bg-slate-900"
        >
          <div className="carousel w-full rounded-xl bg-[#f2eadd] dark:bg-sky-900">
            <div
              id="item1"
              className="carousel-item aspect-square w-full items-center justify-center"
            >
              <img
                src={data.sprites.front_default ?? undefined}
                className="h-full w-full object-contain [image-rendering:pixelated]"
                alt={t(language, 'frontAlt', { name: data.name })}
              />
            </div>
            <div
              id="item2"
              className="carousel-item aspect-square w-full items-center justify-center"
            >
              <img
                src={data.sprites.back_default ?? undefined}
                className="h-full w-full object-contain [image-rendering:pixelated]"
                alt={t(language, 'backAlt', { name: data.name })}
              />
            </div>
            <div
              id="item3"
              className="carousel-item aspect-square w-full items-center justify-center"
            >
              <img
                src={data.sprites.front_shiny ?? undefined}
                className="h-full w-full object-contain [image-rendering:pixelated]"
                alt={t(language, 'shinyFrontAlt', { name: data.name })}
              />
            </div>
            <div
              id="item4"
              className="carousel-item aspect-square w-full items-center justify-center"
            >
              <img
                src={data.sprites.back_shiny ?? undefined}
                className="h-full w-full object-contain [image-rendering:pixelated]"
                alt={t(language, 'shinyBackAlt', { name: data.name })}
              />
            </div>
          </div>
          <nav
            aria-label={t(language, 'chooseImage')}
            className="grid grid-cols-2 gap-2 pt-3 sm:grid-cols-4"
          >
            {[
              { id: 'item1', src: data.sprites.front_default, label: t(language, 'frontSprite') },
              { id: 'item2', src: data.sprites.back_default, label: t(language, 'backSprite') },
              {
                id: 'item3',
                src: data.sprites.front_shiny,
                label: t(language, 'shinyFrontSprite'),
              },
              { id: 'item4', src: data.sprites.back_shiny, label: t(language, 'shinyBackSprite') },
            ].map(sprite => (
              <a
                key={sprite.id}
                href={`#${sprite.id}`}
                aria-label={sprite.label}
                title={sprite.label}
                className="border-paper-border bg-paper hover:bg-pokedex-soft focus-visible:outline-pokedex flex min-h-16 items-center justify-center rounded-lg border p-2 focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600 dark:focus-visible:outline-blue-700"
              >
                <img
                  src={sprite.src ?? undefined}
                  alt=""
                  aria-hidden="true"
                  className="h-12 w-12 object-contain [image-rendering:pixelated]"
                />
              </a>
            ))}
          </nav>
        </section>

        <div className="flex flex-col gap-5">
          <section
            aria-labelledby="types-heading"
            className="border-paper-border bg-paper-card rounded-2xl border p-5 shadow-md dark:border-slate-600 dark:bg-slate-900"
          >
            <h2 id="types-heading" className="mb-3 text-xl font-bold">
              {t(language, 'types')}
            </h2>
            <div className="flex flex-wrap gap-2">
              {data.types.map(type => (
                <span
                  key={type.type.name}
                  className="rounded-full bg-slate-200 px-3 py-1 text-sm font-semibold text-slate-800 dark:bg-slate-700 dark:text-slate-100"
                >
                  {localizedType(language, type.type.name)}
                </span>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="abilities-heading"
            className="border-paper-border bg-paper-card rounded-2xl border p-5 shadow-md dark:border-slate-600 dark:bg-slate-900"
          >
            <h2 id="abilities-heading" className="mb-3 text-xl font-bold">
              {t(language, 'abilities')}
            </h2>
            <ul className="flex flex-wrap gap-2">
              {data.abilities.map(ability => (
                <li
                  key={ability.ability.name}
                  className="bg-pokedex-soft text-pokedex-soft-ink rounded-full px-4 py-2 font-semibold dark:bg-sky-900 dark:text-white"
                >
                  {ability.ability.name.replaceAll('-', ' ')}
                </li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="stats-heading"
            className="border-paper-border bg-paper-card rounded-2xl border p-5 shadow-md dark:border-slate-600 dark:bg-slate-900"
          >
            <h2 id="stats-heading" className="mb-4 text-xl font-bold">
              {t(language, 'stats')}
            </h2>
            <ul className="space-y-4">
              {data.stats.map(stat => {
                const label = localizedStat(language, stat.stat.name);
                const percentage = Math.min(100, (stat.base_stat / 255) * 100);
                return (
                  <li key={stat.stat.name}>
                    <div className="mb-1 flex justify-between gap-3 text-sm font-semibold">
                      <span>{label}</span>
                      <span>{stat.base_stat}</span>
                    </div>
                    <div
                      role="meter"
                      aria-label={label}
                      aria-valuemin={0}
                      aria-valuemax={255}
                      aria-valuenow={stat.base_stat}
                      className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
                    >
                      <div
                        aria-hidden="true"
                        className="bg-pokedex h-full rounded-full dark:bg-sky-400"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>
      <EvolutionChain speciesUrl={speciesUrl} currentName={speciesName} />
    </main>
  );
}
export default Details;
export const getStaticProps: GetStaticProps = async context => {
  const slug = context.params ? context.params['slug'] : undefined;
  if (!isPokemonSlug(slug)) {
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
  if (
    !data ||
    typeof data.name !== 'string' ||
    !data.species ||
    typeof data.species.name !== 'string' ||
    !isPokemonSlug(data.species.name) ||
    !isPokemonSpeciesUrl(data.species.url)
  ) {
    throw new Error('Invalid Pokemon details response');
  }
  const details = normalizePokemonDetails(data);
  return {
    props: {
      data: details,
      speciesUrl: data.species.url,
      speciesName: data.species.name,
    },
  };
};
export const getStaticPaths: GetStaticPaths = async () => {
  // Generate all known detail pages during the build. Disabling runtime fallback
  // prevents arbitrary request paths from triggering server-side PokeAPI calls.
  try {
    const res = await pokeApiFetch(
      `https://pokeapi.co/api/v2/pokemon?offset=0&limit=${pokemonNameLimit}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data?.results)) throw new Error('Invalid Pokemon list response');
    const paths = (data.results as unknown[]).flatMap((entry): { params: { slug: string } }[] => {
      if (
        typeof entry !== 'object' ||
        entry === null ||
        !('name' in entry) ||
        !isPokemonSlug(entry.name)
      ) {
        return [];
      }
      return [{ params: { slug: entry.name } }];
    });
    if (paths.length === 0) throw new Error('Pokemon list is empty');
    return { paths, fallback: false };
  } catch (error) {
    console.error('Unable to load Pokemon paths during build:', error);
    throw error;
  }
};
