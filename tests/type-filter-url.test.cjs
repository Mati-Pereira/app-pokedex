const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { act, fireEvent, render, screen, waitFor } = require('./setup-dom.cjs');
const router = { isReady: true, query: {} };
const requests = [];
function MockPagination({ current, total, onPageChange }) {
  return React.createElement('button', {
    'data-testid': 'pagination',
    'data-current': current,
    'data-total': total,
    onClick: () => onPageChange(current < total ? current + 1 : 1),
  }, `Page ${current} of ${total}`);
}
function MockPokemon({ text }) {
  return React.createElement('article', { 'data-testid': 'pokemon' }, text);
}
const filename = path.resolve(__dirname, '../pages/types.tsx');
const loaded = new Module(filename, module);
loaded.filename = filename;
loaded.paths = Module._nodeModulePaths(path.dirname(filename));
const originalRequire = loaded.require.bind(loaded);
loaded.require = name => {
  if (name === 'next/router') return { useRouter: () => router };
  if (name === 'next/link') return { __esModule: true, default: ({ children }) => children };
  if (name === '../components/Grid') return { __esModule: true, default: ({ children }) => children };
  if (name === '../components/Pokemon') return { __esModule: true, default: MockPokemon };
    if (name === 'next/dynamic') return { __esModule: true, default: () => MockPagination };
    if (name === 'react-responsive-pagination') return { __esModule: true, default: MockPagination };
  return originalRequire(name);
};
loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText, filename);
const Types = loaded.exports.default;
const response = data => ({ ok: true, status: 200, json: async () => data });
async function api(url) {
  requests.push(url);
  if (url.includes('/type/')) {
    const type = url.split('/').pop();
    return response({ pokemon: Array.from({ length: 12 }, (_, i) => ({ pokemon: { url: `https://example.test/${type}/${i + 1}` } })) });
  }
  const parts = url.split('/');
  const id = Number(parts.pop());
  const type = parts.pop();
  return response({ id, name: `${type}-${id}`, types: [], sprites: { front_default: 'sprite.png' } });
}
async function setup(query, isReady, run) {
  const originalFetch = global.fetch;
  router.query = query;
  router.isReady = isReady;
  requests.length = 0;
  global.fetch = api;
  let view;
  try {
    view = render(React.createElement(Types));
    await run(view);
  } finally {
    if (view) view.unmount();
    global.fetch = originalFetch;
  }
}

test('direct URL restores the type without context and a fresh mount restores it again', async () => {
  for (let mount = 0; mount < 2; mount++) {
    await setup({ type: 'fire' }, true, async () => {
      assert.equal(requests[0], 'https://pokeapi.co/api/v2/type/fire');
      await waitFor(() => assert.equal(screen.getByTestId('pagination').dataset.current, '1'));
      assert.equal(screen.getAllByTestId('pokemon')[0].textContent, 'FIRE-1');
      assert.equal(screen.getAllByTestId('pokemon').length, 9);
    });
  }
});

test('query hydration waits for router readiness before fetching', async () => {
  await setup({}, false, async view => {
    assert.deepEqual(requests, []);
    router.query = { type: 'ice' };
    router.isReady = true;
    view.rerender(React.createElement(Types));
    assert.equal(requests[0], 'https://pokeapi.co/api/v2/type/ice');
    await waitFor(() => assert.equal(screen.getAllByTestId('pokemon')[0].textContent, 'ICE-1'));
  });
});

test('missing, unknown, and repeated query values do not request an invalid API endpoint', async () => {
  for (const query of [{}, { type: '' }, { type: 'unknown' }, { type: ['fire', 'water'] }]) {
    await setup(query, true, async () => {
      assert.deepEqual(requests, []);
      assert.equal(screen.queryAllByTestId('pokemon').length, 0);
    });
  }
});

test('changing type or returning to a previous type resets pagination and visible cards', async () => {
  await setup({ type: 'fire' }, true, async view => {
    await waitFor(() => assert.equal(screen.getAllByTestId('pokemon')[0].textContent, 'FIRE-1'));
    fireEvent.click(screen.getByTestId('pagination'));
    await waitFor(() => assert.equal(screen.getByTestId('pagination').dataset.current, '2'));
    assert.equal(screen.getAllByTestId('pokemon')[0].textContent, 'FIRE-10');
    for (const type of ['water', 'fire']) {
      router.query = { type };
      view.rerender(React.createElement(Types));
      await waitFor(() => assert.equal(screen.getAllByTestId('pokemon')[0].textContent, `${type.toUpperCase()}-1`));
      assert.equal(screen.getByTestId('pagination').dataset.current, '1');
    }
  });
});

test('a stale type response cannot replace results for the current URL', async () => {
  await setup({ type: 'fire' }, true, async view => {
    await waitFor(() => assert.equal(screen.getAllByTestId('pokemon')[0].textContent, 'FIRE-1'));
    let resolveIce;
    global.fetch = url => url.endsWith('/type/ice')
      ? new Promise(resolve => { resolveIce = resolve; }) : api(url);
    router.query = { type: 'ice' };
    view.rerender(React.createElement(Types));
    router.query = { type: 'water' };
    view.rerender(React.createElement(Types));
    await waitFor(() => assert.equal(screen.getAllByTestId('pokemon')[0].textContent, 'WATER-1'));
    await act(async () => {
      resolveIce(response({ pokemon: [{ pokemon: { url: 'https://example.test/ice/1' } }] }));
    });
    assert.equal(screen.getAllByTestId('pokemon')[0].textContent, 'WATER-1');
  });
});
