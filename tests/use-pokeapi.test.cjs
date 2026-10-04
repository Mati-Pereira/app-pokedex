const test = require('node:test');
const assert = require('node:assert/strict');
const { act, renderHook, waitFor } = require('./setup-dom.cjs');
const {
  usePokeApi,
  fetchPokemonList,
  fetchPokemonNames,
  fetchPokemonDetails,
} = require('../lib/usePokeApi.ts');

const ok = data => ({ ok: true, status: 200, json: async () => data });

function mount(key, load) {
  const view = renderHook(({ k }) => usePokeApi(k, load, 'failed'), {
    initialProps: { k: key },
  });
  return {
    get state() { return view.result; },
    render: async k => view.rerender({ k }),
    unmount: view.unmount,
  };
}

test('loads data and clears the loading flag', async () => {
  const h = mount('a', async () => 'value');
  await waitFor(() => assert.equal(h.state.current.data, 'value'));
  assert.deepEqual(
    {
      data: h.state.current.data,
      isLoading: h.state.current.isLoading,
      error: h.state.current.error,
    },
    { data: 'value', isLoading: false, error: '' }
  );
});

test('reports the error message when loading fails', async () => {
  const h = mount('a', async () => {
    throw new Error('boom');
  });
  await waitFor(() => assert.equal(h.state.current.error, 'failed'));
  assert.equal(h.state.current.error, 'failed');
  assert.equal(h.state.current.data, null);
  assert.equal(h.state.current.isLoading, false);
});

test('a null key skips loading', async () => {
  let calls = 0;
  const h = mount(null, async () => {
    calls++;
  });
  await h.render(null);
  assert.equal(calls, 0);
  assert.equal(h.state.current.isLoading, false);
});

test('retry reloads after a failure', async () => {
  let calls = 0;
  const h = mount('a', async () => {
    if (++calls === 1) throw new Error('first');
    return 'second';
  });
  await waitFor(() => assert.equal(h.state.current.error, 'failed'));
  assert.equal(h.state.current.error, 'failed');
  await act(async () => h.state.current.retry());
  assert.equal(h.state.current.data, 'second');
  assert.equal(h.state.current.error, '');
});

test('a stale response cannot replace the current key result', async () => {
  const resolvers = {};
  const h = mount(
    'a',
    () =>
      new Promise(resolve => {
        resolvers[Object.keys(resolvers).length] = resolve;
      })
  );
  await h.render('a');
  await h.render('b');
  await waitFor(() => assert.equal(Object.keys(resolvers).length, 2));
  await act(async () => {
    resolvers[1]('B');
  });
  await act(async () => {
    resolvers[0]('A');
  });
  assert.equal(h.state.current.data, 'B');
});

test('the request is aborted on unmount', async () => {
  let signal;
  const h = mount('a', async s => {
    signal = s;
    return new Promise(() => {});
  });
  await h.render('a');
  await h.unmount();
  assert.equal(signal.aborted, true);
});

test('fetch helpers reject HTTP errors and invalid bodies', async () => {
  const signal = new AbortController().signal;
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({ ok: false, status: 503 });
    await assert.rejects(fetchPokemonList('u', signal), /HTTP 503/);
    globalThis.fetch = async () => ok({ count: -1, results: [] });
    await assert.rejects(fetchPokemonList('u', signal), /Invalid Pokemon list/);
    globalThis.fetch = async () => ok({ results: [{ name: 1 }] });
    await assert.rejects(fetchPokemonNames('u', signal), /Invalid Pokemon names/);
    globalThis.fetch = async () => ok({ name: 'x' });
    await assert.rejects(fetchPokemonDetails([{ url: 'u' }], signal), /Invalid Pokemon response/);
    globalThis.fetch = async () => ok({ name: 'x', sprites: {}, types: [] });
    assert.equal((await fetchPokemonDetails([{ url: 'u' }], signal))[0].name, 'x');
  } finally {
    globalThis.fetch = original;
  }
});
