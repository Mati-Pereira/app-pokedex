const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { create, act } = require('react-test-renderer');
const router = { isReady: true, query: {} };
const requests = [];
function MockPagination() { return null; }
function MockPokemon() { return null; }
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
  let tree;
  try {
    await act(async () => { tree = create(React.createElement(Types)); });
    await run(tree);
  } finally {
    if (tree) act(() => tree.unmount());
    global.fetch = originalFetch;
  }
}

test('direct URL restores the type without context and a fresh mount restores it again', async () => {
  for (let mount = 0; mount < 2; mount++) {
    await setup({ type: 'fire' }, true, async tree => {
      assert.equal(requests[0], 'https://pokeapi.co/api/v2/type/fire');
      assert.equal(tree.root.findByType(MockPagination).props.current, 1);
      assert.equal(tree.root.findAllByType(MockPokemon)[0].props.text, 'FIRE-1');
      assert.equal(tree.root.findAllByType(MockPokemon).length, 9);
    });
  }
});

test('query hydration waits for router readiness before fetching', async () => {
  await setup({}, false, async tree => {
    assert.deepEqual(requests, []);
    router.query = { type: 'ice' };
    router.isReady = true;
    await act(async () => { tree.update(React.createElement(Types)); });
    assert.equal(requests[0], 'https://pokeapi.co/api/v2/type/ice');
    assert.equal(tree.root.findAllByType(MockPokemon)[0].props.text, 'ICE-1');
  });
});

test('missing, unknown, and repeated query values do not request an invalid API endpoint', async () => {
  for (const query of [{}, { type: '' }, { type: 'unknown' }, { type: ['fire', 'water'] }]) {
    await setup(query, true, async tree => {
      assert.deepEqual(requests, []);
      assert.equal(tree.root.findAllByType(MockPokemon).length, 0);
    });
  }
});

test('changing type or returning to a previous type resets pagination and visible cards', async () => {
  await setup({ type: 'fire' }, true, async tree => {
    act(() => tree.root.findByType(MockPagination).props.onPageChange(2));
    assert.equal(tree.root.findByType(MockPagination).props.current, 2);
    assert.equal(tree.root.findAllByType(MockPokemon)[0].props.text, 'FIRE-10');
    for (const type of ['water', 'fire']) {
      router.query = { type };
      await act(async () => { tree.update(React.createElement(Types)); });
      assert.equal(tree.root.findByType(MockPagination).props.current, 1);
      assert.equal(tree.root.findAllByType(MockPokemon)[0].props.text, `${type.toUpperCase()}-1`);
    }
  });
});

test('a stale type response cannot replace results for the current URL', async () => {
  await setup({ type: 'fire' }, true, async tree => {
    let resolveIce;
    global.fetch = url => url.endsWith('/type/ice')
      ? new Promise(resolve => { resolveIce = resolve; }) : api(url);
    router.query = { type: 'ice' };
    await act(async () => { tree.update(React.createElement(Types)); });
    router.query = { type: 'water' };
    await act(async () => { tree.update(React.createElement(Types)); });
    await act(async () => {
      resolveIce(response({ pokemon: [{ pokemon: { url: 'https://example.test/ice/1' } }] }));
    });
    assert.equal(tree.root.findAllByType(MockPokemon)[0].props.text, 'WATER-1');
  });
});
