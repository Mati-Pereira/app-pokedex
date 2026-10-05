interface CachedValue {
  value: unknown;
  expiresAt: number;
}

interface InFlightRequest {
  controller: AbortController;
  promise: Promise<unknown>;
  subscribers: number;
  settled: boolean;
}

interface PokeApiJsonCacheOptions {
  ttlMs?: number;
  maxEntries?: number;
  now?: () => number;
  fetcher?: (url: string, init: { signal: AbortSignal }) => Promise<Response>;
}

const cacheTtlMs = 10 * 60 * 1000;
const cacheEntryLimit = 300;

function createAbortError(signal: AbortSignal): unknown {
  return signal.reason ?? new DOMException('The operation was aborted', 'AbortError');
}

function waitForRequest<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(createAbortError(signal));

  return new Promise((resolve, reject) => {
    const cleanUp = () => signal.removeEventListener('abort', onAbort);
    const onAbort = () => {
      cleanUp();
      reject(createAbortError(signal));
    };

    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(
      value => {
        cleanUp();
        resolve(value);
      },
      error => {
        cleanUp();
        reject(error);
      }
    );
  });
}

function isPokeApiUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.origin === 'https://pokeapi.co' &&
      !url.username &&
      !url.password &&
      url.pathname.startsWith('/api/v2/')
    );
  } catch {
    return false;
  }
}

export function createPokeApiJsonCache({
  ttlMs = cacheTtlMs,
  maxEntries = cacheEntryLimit,
  now = Date.now,
  fetcher = (url, init) => fetch(url, init),
}: PokeApiJsonCacheOptions = {}) {
  const cache = new Map<string, CachedValue>();
  const inFlight = new Map<string, InFlightRequest>();

  const invalidate = (url: string) => cache.delete(url);
  const clear = () => {
    cache.clear();
    for (const request of inFlight.values()) request.controller.abort();
    inFlight.clear();
  };

  const get = async (url: string, signal: AbortSignal): Promise<unknown> => {
    if (!isPokeApiUrl(url)) throw new Error('Untrusted PokeAPI URL');
    if (signal.aborted) throw createAbortError(signal);

    const cached = cache.get(url);
    if (cached && cached.expiresAt > now()) {
      cache.delete(url);
      cache.set(url, cached);
      return cached.value;
    }
    if (cached) cache.delete(url);

    let request = inFlight.get(url);
    if (!request) {
      const controller = new AbortController();
      request = {
        controller,
        promise: Promise.resolve(),
        subscribers: 0,
        settled: false,
      };
      const currentRequest = request;
      currentRequest.promise = fetcher(url, { signal: controller.signal })
        .then(async response => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const value: unknown = await response.json();
          cache.set(url, { value, expiresAt: now() + ttlMs });
          while (cache.size > maxEntries) {
            const oldest = cache.keys().next().value;
            if (oldest === undefined) break;
            cache.delete(oldest);
          }
          return value;
        })
        .finally(() => {
          currentRequest.settled = true;
          if (inFlight.get(url) === currentRequest) inFlight.delete(url);
        });
      inFlight.set(url, currentRequest);
      request = currentRequest;
    }

    request.subscribers += 1;
    try {
      return await waitForRequest(request.promise, signal);
    } finally {
      request.subscribers -= 1;
      if (request.subscribers === 0 && !request.settled) {
        request.controller.abort();
        if (inFlight.get(url) === request) inFlight.delete(url);
      }
    }
  };

  return { get, invalidate, clear };
}
