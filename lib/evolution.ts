import type { EvolutionDetails, EvolutionNode, EvolutionResource } from '../types/evolution';
import { isPokemonSlug } from './pokemonSlug';
import { getPokeApiJson, invalidatePokeApiResponse } from './usePokeApi';

const apiOrigin = 'https://pokeapi.co';
const maxEvolutionNodes = 100;
const maxEvolutionDepth = 20;
const speciesPathPattern = /^\/api\/v2\/pokemon-species\/[a-z0-9-]+\/$/;
const evolutionChainPathPattern = /^\/api\/v2\/evolution-chain\/\d+\/$/;

export function isPokemonSpeciesUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return (
      url.origin === apiOrigin &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      speciesPathPattern.test(url.pathname)
    );
  } catch {
    return false;
  }
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

function normalizeResource(value: unknown): EvolutionResource {
  if (
    !isObject(value) ||
    typeof value['name'] !== 'string' ||
    !isPokemonSlug(value['name']) ||
    typeof value['url'] !== 'string'
  ) {
    throw new Error('Invalid evolution resource');
  }
  return { name: value['name'], url: value['url'] };
}

function nullableResource(value: unknown): EvolutionResource | null {
  return value === null ? null : normalizeResource(value);
}

function nullableNumber(value: unknown): number | null {
  if (value === null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error('Invalid evolution condition');
  }
  return value;
}

function normalizeDetails(value: unknown): EvolutionDetails {
  if (!isObject(value)) throw new Error('Invalid evolution details');
  const timeOfDay = value['time_of_day'];
  const needsRain = value['needs_overworld_rain'];
  const turnUpsideDown = value['turn_upside_down'];
  if (
    typeof timeOfDay !== 'string' ||
    typeof needsRain !== 'boolean' ||
    typeof turnUpsideDown !== 'boolean'
  ) {
    throw new Error('Invalid evolution details');
  }

  return {
    trigger: normalizeResource(value['trigger']),
    item: nullableResource(value['item']),
    gender: nullableNumber(value['gender']),
    held_item: nullableResource(value['held_item']),
    known_move: nullableResource(value['known_move']),
    known_move_type: nullableResource(value['known_move_type']),
    location: nullableResource(value['location']),
    min_level: nullableNumber(value['min_level']),
    min_happiness: nullableNumber(value['min_happiness']),
    min_beauty: nullableNumber(value['min_beauty']),
    min_affection: nullableNumber(value['min_affection']),
    needs_overworld_rain: needsRain,
    party_species: nullableResource(value['party_species']),
    party_type: nullableResource(value['party_type']),
    relative_physical_stats: nullableNumber(value['relative_physical_stats']),
    time_of_day: timeOfDay,
    trade_species: nullableResource(value['trade_species']),
    turn_upside_down: turnUpsideDown,
  };
}

function normalizeNode(value: unknown, state: { count: number }, depth: number): EvolutionNode {
  if (
    !isObject(value) ||
    !Array.isArray(value['evolves_to']) ||
    !Array.isArray(value['evolution_details']) ||
    depth > maxEvolutionDepth
  ) {
    throw new Error('Invalid evolution chain');
  }
  state.count += 1;
  if (state.count > maxEvolutionNodes) throw new Error('Evolution chain is too large');

  return {
    species: normalizeResource(value['species']),
    evolution_details: value['evolution_details'].map(normalizeDetails),
    evolves_to: value['evolves_to'].map(child => normalizeNode(child, state, depth + 1)),
  };
}

/** Loads and validates the species evolution chain through the existing allowlisted cache. */
export async function fetchEvolutionChain(
  speciesUrl: string,
  signal: AbortSignal
): Promise<EvolutionNode> {
  if (!isPokemonSpeciesUrl(speciesUrl)) {
    throw new Error('Invalid Pokemon species URL');
  }

  const species = await getPokeApiJson(speciesUrl, signal, 'Pokemon species');
  const chainUrl =
    isObject(species) && isObject(species['evolution_chain'])
      ? species['evolution_chain']['url']
      : null;
  if (typeof chainUrl !== 'string') {
    invalidatePokeApiResponse(speciesUrl);
    throw new Error('Invalid Pokemon species response');
  }
  if (!isPokeApiResourceUrl(chainUrl, evolutionChainPathPattern)) {
    invalidatePokeApiResponse(speciesUrl);
    throw new Error('Invalid evolution chain URL');
  }

  const chainData = await getPokeApiJson(chainUrl, signal, 'Evolution chain');
  if (!isObject(chainData) || !isObject(chainData['chain'])) {
    invalidatePokeApiResponse(chainUrl);
    throw new Error('Invalid evolution chain response');
  }
  try {
    return normalizeNode(chainData['chain'], { count: 0 }, 0);
  } catch (error) {
    invalidatePokeApiResponse(chainUrl);
    throw error;
  }
}

function isPokeApiResourceUrl(value: string, pathPattern: RegExp): boolean {
  try {
    const url = new URL(value);
    return (
      url.origin === apiOrigin &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      pathPattern.test(url.pathname)
    );
  } catch {
    return false;
  }
}

export function getEvolutionSpriteUrl(speciesUrl: string): string | null {
  try {
    const url = new URL(speciesUrl);
    const match = /^\/api\/v2\/pokemon-species\/(\d+)\/$/.exec(url.pathname);
    if (url.origin !== apiOrigin || !match) return null;
    const id = Number(match[1]);
    if (!Number.isSafeInteger(id) || id < 1) return null;
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
  } catch {
    return null;
  }
}
