import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const cacheTtlMs = 24 * 60 * 60 * 1000;
const cacheDir = () => path.join(process.cwd(), '.next', 'cache', 'pokeapi');

// Responses already fetched during this build, keyed by URL. Storing the promise
// also collapses concurrent requests for the same URL into a single call.
const inFlight = new Map<string, Promise<string | null>>();

const isBuildPhase = () => process.env['NEXT_PHASE'] === 'phase-production-build';

async function readDiskCache(file: string): Promise<string | null> {
  try {
    const { mtimeMs } = await stat(file);
    if (Date.now() - mtimeMs > cacheTtlMs) return null;
    return await readFile(file, 'utf8');
  } catch {
    return null;
  }
}

async function load(url: string): Promise<string | null> {
  const file = path.join(cacheDir(), `${createHash('sha1').update(url).digest('hex')}.json`);
  const cached = await readDiskCache(file);
  if (cached !== null) return cached;

  const res = await fetch(url);
  if (!res.ok) return null;
  const body = await res.text();
  try {
    await mkdir(cacheDir(), { recursive: true });
    await writeFile(file, body);
  } catch {
    // The cache is an optimization; failing to write it must not fail the build.
  }
  return body;
}

/**
 * Fetches a PokeAPI URL. While building, successful responses are cached in memory
 * and in `.next/cache` (kept between builds by Vercel/CI), so repeated builds do not
 * call the API again. At runtime this is a plain `fetch`: ISR already caches pages.
 * Failed responses are never cached and are re-requested so callers see the real status.
 */
export async function pokeApiFetch(url: string): Promise<Response> {
  if (!isBuildPhase()) return fetch(url);

  let pending = inFlight.get(url);
  if (!pending) {
    pending = load(url);
    inFlight.set(url, pending);
  }
  const body = await pending;
  if (body === null) {
    inFlight.delete(url);
    return fetch(url);
  }
  return new Response(body, { status: 200, headers: { 'content-type': 'application/json' } });
}
