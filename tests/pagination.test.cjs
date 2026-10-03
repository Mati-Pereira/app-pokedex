const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { create, act } = require('react-test-renderer');
function MockPokemon() { return null; }
function MockPagination() { return null; }
function MockSelect() { return null; }
function MockLoader() { return null; }
const context = React.createContext({ updateInput() {} });
const router = { isReady: true, pathname: '/types', query: { type: 'fire' }, push: async () => true };
function load(relative) {
  const filename = path.resolve(__dirname, '..', relative);
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
    if (name === 'react-windowed-select') return { __esModule: true, default: MockSelect, createFilter: () => () => true };
    if (name === '../context/InputPokemon') return { InputContext: context };
    if (name === './Toggle') return { __esModule: true, default: () => null };
    if (name === '@uiball/loaders') return { Waveform: MockLoader, Ring: MockLoader };
    return originalRequire(name);
  };
  loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText, filename);
  return loaded.exports.default;
}

const Index = load('pages/index.tsx');
const response = data => ({ ok: true, status: 200, json: async () => data });
async function setup(count, run) {
  const originalFetch = global.fetch;
  const requests = [];
  let tree;
  global.fetch = async url => {
    requests.push(url);
    if (url.includes('?offset=')) {
      const params = new URL(url).searchParams;
      const offset = Number(params.get('offset'));
      const length = Number.isSafeInteger(count) && count >= 0 ? Math.max(0, Math.min(9, count - offset)) : 0;
      return response({ count, results: Array.from({ length }, (_, i) => ({ url: 'https://example.test/' + (offset + i + 1) })) });
    }
    const id = Number(url.split('/').pop());
    return response({ id, name: 'pokemon-' + id, types: [], sprites: { front_default: 'sprite.png' } });
  };
  try {
    await act(async () => { tree = create(React.createElement(Index)); });
    await run(tree, requests);
  } finally {
    if (tree) act(() => tree.unmount());
    global.fetch = originalFetch;
  }
}
test('page totals follow API counts including empty and exact page boundaries', async () => {
  for (const count of [0, 1, 9, 10, 18, 19, 1300]) {
    await setup(count, async tree => {
      assert.equal(tree.root.findByType(MockPagination).props.total, Math.ceil(count / 9));
      assert.equal(tree.root.findAllByType(MockPokemon).length, Math.min(count, 9));
    });
  }
});
test('last page requests the correct offset and displays only remaining Pokemon', async () => {
  await setup(19, async (tree, requests) => {
    await act(async () => { tree.root.findByType(MockPagination).props.onPageChange(3); });
    assert.ok(requests.includes('https://pokeapi.co/api/v2/pokemon?offset=18&limit=9'));
    assert.equal(tree.root.findByType(MockPagination).props.current, 3);
    assert.equal(tree.root.findByType(MockPagination).props.total, 3);
    assert.equal(tree.root.findAllByType(MockPokemon).length, 1);
    assert.equal(tree.root.findByType(MockPokemon).props.text, 'POKEMON-19');
  });
});
test('invalid API counts show the recoverable error instead of incorrect pagination', async () => {
  for (const count of [undefined, null, '19', -1, 1.5]) {
    await setup(count, async tree => {
      assert.equal(tree.root.findAllByProps({ role: 'alert' }).length, 1);
      assert.equal(tree.root.findAllByType(MockPagination).length, 0);
      assert.ok(tree.root.findAllByType('button').some(button => button.props.children === 'Try again'));
    });
  }
});
