import { isPokemonSlug } from './pokemonSlug';
import { normalizePokemonDetails } from './pokemonDetails';
import { pokeApiFetch } from './pokeapi';
import type { PokemonDetails } from '../types/pokemonDetails';

export interface PokemonCatalogPage {
  count: number;
  pokemons: PokemonDetails[];
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export async function getPokemonCatalogPage(
  offset: number,
  limit: number
): Promise<PokemonCatalogPage> {
  if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(limit) || limit < 1) {
    throw new Error('Invalid Pokemon catalog page');
  }

  const listResponse = await pokeApiFetch(
    `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`
  );
  if (!listResponse.ok) {
    throw new Error(`Pokemon list request failed: HTTP ${listResponse.status}`);
  }

  const list: unknown = await listResponse.json();
  if (
    !isObject(list) ||
    typeof list['count'] !== 'number' ||
    !Number.isSafeInteger(list['count']) ||
    list['count'] < 0 ||
    !Array.isArray(list['results']) ||
    list['results'].length > limit ||
    !list['results'].every(entry => isObject(entry) && isPokemonSlug(entry['name']))
  ) {
    throw new Error('Invalid Pokemon list response');
  }

  const pokemons = await Promise.all(
    list['results'].map(async entry => {
      const name = (entry as { name: string }).name;
      const detailResponse = await pokeApiFetch(
        `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(name)}`
      );
      if (!detailResponse.ok) {
        throw new Error(`Pokemon details request failed: HTTP ${detailResponse.status}`);
      }
      const detail: unknown = await detailResponse.json();
      return normalizePokemonDetails(detail);
    })
  );

  return { count: list['count'], pokemons };
}
