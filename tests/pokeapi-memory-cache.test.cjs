const test = require('node:test');
const assert = require('node:assert/strict');
const { createPokeApiJsonCache } = require('../lib/pokeApiCache.ts');

const url = id => `https://pokeapi.co/api/v2/pokemon/${id}`;
const response = (data, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
});

test('reuses successful JSON until its absolute TTL expires', async () => {
  let now = 1000;
  let calls = 0;
  const cache = createPokeApiJsonCache({
    ttlMs: 50,
    now: () => now,
    fetcher: async () => response({ calls: ++calls }),
  });
  const signal = new AbortController().signal;

  assert.deepEqual(await cache.get(url(1), signal), { calls: 1 });
  assert.deepEqual(await cache.get(url(1), signal), { calls: 1 });
  assert.equal(calls, 1);
  now += 50;
  assert.deepEqual(await cache.get(url(1), signal), { calls: 2 });
  assert.equal(calls, 2);
});

test('evicts least recently used entries when the cache is full', async () => {
  let calls = 0;
  const cache = createPokeApiJsonCache({
    maxEntries: 2,
    fetcher: async () => response({ calls: ++calls }),
  });
  const signal = new AbortController().signal;

  await cache.get(url(1), signal);
  await cache.get(url(2), signal);
  await cache.get(url(1), signal);
  await cache.get(url(3), signal);
  await cache.get(url(1), signal);
  await cache.get(url(2), signal);
  assert.equal(calls, 4);
});

test('deduplicates concurrent requests and keeps them alive while one consumer remains', async () => {
  let calls = 0;
  let resolveFetch;
  let underlyingAborted = false;
  const cache = createPokeApiJsonCache({
    fetcher: (_url, { signal }) => {
      calls += 1;
      signal.addEventListener('abort', () => {
        underlyingAborted = true;
      });
      return new Promise(resolve => {
        resolveFetch = resolve;
      });
    },
  });
  const firstController = new AbortController();
  const secondController = new AbortController();
  const first = cache.get(url(1), firstController.signal).catch(error => error);
  const second = cache.get(url(1), secondController.signal);
  await new Promise(setImmediate);

  assert.equal(calls, 1);
  firstController.abort();
  await first;
  assert.equal(underlyingAborted, false);
  resolveFetch(response({ name: 'bulbasaur' }));
  assert.deepEqual(await second, { name: 'bulbasaur' });
});

test('aborting the last consumer cancels the request and does not cache it', async () => {
  let calls = 0;
  let underlyingAborted = false;
  const cache = createPokeApiJsonCache({
    fetcher: (_url, { signal }) => {
      calls += 1;
      return new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => {
          underlyingAborted = true;
          reject(signal.reason);
        });
      });
    },
  });
  const controller = new AbortController();
  const pending = cache.get(url(1), controller.signal).catch(error => error);
  await new Promise(setImmediate);
  controller.abort();
  await pending;
  assert.equal(underlyingAborted, true);
  assert.equal(calls, 1);
});

test('does not cache HTTP or JSON failures', async () => {
  let calls = 0;
  const cache = createPokeApiJsonCache({
    fetcher: async () => {
      calls += 1;
      if (calls === 1) return response({}, 503);
      if (calls === 2)
        return {
          ok: true,
          status: 200,
          json: async () => {
            throw new Error('Bad JSON');
          },
        };
      return response({ name: 'bulbasaur' });
    },
  });
  const signal = new AbortController().signal;

  await assert.rejects(cache.get(url(1), signal), /HTTP 503/);
  await assert.rejects(cache.get(url(1), signal), /Bad JSON/);
  assert.deepEqual(await cache.get(url(1), signal), { name: 'bulbasaur' });
  assert.equal(calls, 3);
});

test('rejects URLs outside the fixed PokeAPI origin', async () => {
  let calls = 0;
  const cache = createPokeApiJsonCache({
    fetcher: async () => {
      calls += 1;
      return response({});
    },
  });
  await assert.rejects(
    cache.get('https://example.test/api/v2/pokemon/1', new AbortController().signal),
    /Untrusted PokeAPI URL/
  );
  assert.equal(calls, 0);
});
