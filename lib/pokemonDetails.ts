import type { PokemonDetails } from '../types/pokemonDetails';

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isNamedResource = (value: unknown): value is { name: string } =>
  isObject(value) && typeof value['name'] === 'string';

/** Keep only the Pokemon fields rendered by the app before sending them to the browser. */
export function normalizePokemonDetails(value: unknown): PokemonDetails {
  if (
    !isObject(value) ||
    typeof value['name'] !== 'string' ||
    !isObject(value['sprites']) ||
    !Array.isArray(value['types'])
  ) {
    throw new Error('Invalid Pokemon response');
  }

  const sprites = value['sprites'];
  const abilities = Array.isArray(value['abilities']) ? value['abilities'] : [];
  const stats = Array.isArray(value['stats']) ? value['stats'] : [];
  const types = value['types'];
  if (
    !abilities.every(entry => isObject(entry) && isNamedResource(entry['ability'])) ||
    !stats.every(
      entry =>
        isObject(entry) &&
        typeof entry['base_stat'] === 'number' &&
        isNamedResource(entry['stat'])
    ) ||
    !types.every(entry => isObject(entry) && isNamedResource(entry['type']))
  ) {
    throw new Error('Invalid Pokemon response');
  }

  const sprite = (key: string): string | null =>
    typeof sprites[key] === 'string' ? (sprites[key] as string) : null;

  return {
    id: typeof value['id'] === 'number' ? value['id'] : 0,
    name: value['name'],
    sprites: {
      front_default: sprite('front_default'),
      back_default: sprite('back_default'),
      front_shiny: sprite('front_shiny'),
      back_shiny: sprite('back_shiny'),
    },
    abilities: abilities.map(entry => ({
      ability: { name: (entry as { ability: { name: string } }).ability.name },
    })),
    stats: stats.map(entry => {
      const stat = entry as { base_stat: number; stat: { name: string } };
      return { base_stat: stat.base_stat, stat: { name: stat.stat.name } };
    }),
    types: types.map(entry => ({
      type: { name: (entry as { type: { name: string } }).type.name },
    })),
  };
}
