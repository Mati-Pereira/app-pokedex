import { useEffect, useRef, useState } from 'react';
import type { NamedResource, PokemonListResponse, TypeResponse } from '../types/pokeapi';
import type { PokemonDetails } from '../types/pokemonDetails';
import { normalizePokemonDetails } from './pokemonDetails';

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

async function getJson(url: string, signal: AbortSignal, label: string): Promise<unknown> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`${label} request failed: HTTP ${res.status}`);
  return res.json();
}

export async function fetchPokemonList(
  url: string,
  signal: AbortSignal
): Promise<PokemonListResponse> {
  const data = await getJson(url, signal, 'Pokemon list');
  if (
    !isObject(data) ||
    typeof data['count'] !== 'number' ||
    !Number.isSafeInteger(data['count']) ||
    data['count'] < 0 ||
    !Array.isArray(data['results'])
  ) {
    throw new Error('Invalid Pokemon list response');
  }
  return data as unknown as PokemonListResponse;
}

export async function fetchPokemonNames(
  url: string,
  signal: AbortSignal
): Promise<{ name: string }[]> {
  const data = await getJson(url, signal, 'Pokemon names');
  if (
    !isObject(data) ||
    !Array.isArray(data['results']) ||
    !data['results'].every(entry => isObject(entry) && typeof entry['name'] === 'string')
  ) {
    throw new Error('Invalid Pokemon names response');
  }
  return data['results'] as { name: string }[];
}

export async function fetchTypeMembers(url: string, signal: AbortSignal): Promise<NamedResource[]> {
  const data = await getJson(url, signal, 'Type');
  if (!isObject(data) || !Array.isArray(data['pokemon'])) throw new Error('Invalid type response');
  return (data as unknown as TypeResponse).pokemon.map(entry => entry.pokemon);
}

export function fetchPokemonDetails(
  resources: { url: string }[],
  signal: AbortSignal
): Promise<PokemonDetails[]> {
  return Promise.all(
    resources.map(async ({ url }) => {
      const detail = await getJson(url, signal, 'Pokemon');
      return normalizePokemonDetails(detail);
    })
  );
}

interface PokeApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: string;
  retry: () => void;
}

/**
 * Runs `load` whenever `key` changes (or `retry` is called) and tracks loading/error state.
 * A `null` key skips loading. Stale and aborted requests never update state.
 */
export function usePokeApi<T>(
  key: string | null,
  load: (signal: AbortSignal) => Promise<T>,
  errorMessage: string
): PokeApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setLoading] = useState(key !== null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const latest = useRef({ load, errorMessage });
  latest.current = { load, errorMessage };

  useEffect(() => {
    setData(null);
    setError('');
    if (key === null) {
      setLoading(false);
      return;
    }
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    latest.current
      .load(controller.signal)
      .then(result => {
        if (active) setData(result);
      })
      .catch(() => {
        controller.abort();
        if (active) setError(latest.current.errorMessage);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [key, attempt]);

  return { data, isLoading, error, retry: () => setAttempt(value => value + 1) };
}
