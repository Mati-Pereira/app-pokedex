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
const components = { list: load('pages/index.tsx'), type: load('pages/types.tsx'), names: load('components/Navbar.tsx') };
const response = data => ({ ok: true, status: 200, json: async () => data });
const detail = { id: 1, name: 'charmander', types: [], sprites: { front_default: 'sprite.png' } };
function goodApi(kind, url) {
  if (kind === 'names') return response({ results: [{ name: 'charmander' }] });
  if (url.includes('/type/')) return response({ pokemon: [{ pokemon: { url: 'https://example.test/pokemon/1' } }] });
  if (url.includes('?offset=')) return response({ count: 27, results: [{ url: 'https://example.test/pokemon/1' }] });
  return response(detail);
}
const failures = {
  http: async () => ({ ok: false, status: 503 }),
  network: async () => { throw new Error('Offline'); },
  json: async () => ({ ok: true, json: async () => { throw new SyntaxError('Invalid JSON'); } }),
  malformed: async () => response({}),
};
for (const kind of ['list', 'type', 'names']) {
  for (const [failure, badApi] of Object.entries(failures)) {
    test(`${kind} reports ${failure} failure, stops loading, and retries successfully`, async () => {
      const originalFetch = global.fetch;
      let failing = true;
      let tree;
      global.fetch = url => failing ? badApi() : Promise.resolve(goodApi(kind, url));
      try {
        await act(async () => { tree = create(React.createElement(components[kind])); });
        assert.equal(tree.root.findAllByProps({ role: 'alert' }).length, 1);
        assert.equal(tree.root.findAllByType(MockLoader).length, 0);
        if (kind === 'names') assert.equal(tree.root.findAllByType(MockSelect)[0].props.isLoading, false);
        failing = false;
        const retry = tree.root.findAllByType('button').find(button => button.props.children === 'Try again');
        assert.ok(retry);
        await act(async () => { retry.props.onClick(); });
        assert.equal(tree.root.findAllByProps({ role: 'alert' }).length, 0);
        if (kind === 'names') {
          assert.equal(tree.root.findAllByType(MockSelect)[0].props.options[0].value, 'charmander');
          assert.equal(tree.root.findAllByType(MockSelect)[0].props.isLoading, false);
        } else {
          assert.equal(tree.root.findAllByType(MockPokemon)[0].props.text, 'CHARMANDER');
        }
      } finally {
        if (tree) act(() => tree.unmount());
        global.fetch = originalFetch;
      }
    });
  }
}
for (const kind of ['list', 'type']) {
  test(`${kind} handles a failed individual Pokemon request and an invalid detail response`, async () => {
    for (const badDetail of [() => ({ ok: false, status: 500 }), () => response({ name: 'charmander' })]) {
      const originalFetch = global.fetch;
      let tree;
      global.fetch = async url => url.startsWith('https://example.test/') ? badDetail() : goodApi(kind, url);
      try {
        await act(async () => { tree = create(React.createElement(components[kind])); });
        assert.equal(tree.root.findAllByProps({ role: 'alert' }).length, 1);
        assert.equal(tree.root.findAllByType(MockLoader).length, 0);
        assert.equal(tree.root.findAllByType(MockPokemon).length, 0);
      } finally {
        if (tree) act(() => tree.unmount());
        global.fetch = originalFetch;
      }
    }
  });
}
for (const kind of ['list', 'type', 'names']) {
  test(`${kind} cancels pending requests when unmounted`, async () => {
    const originalFetch = global.fetch;
    let signal;
    let reject;
    let tree;
    global.fetch = (url, options) => {
      signal = options.signal;
      return new Promise((resolve, rejectPromise) => { reject = rejectPromise; });
    };
    try {
      await act(async () => { tree = create(React.createElement(components[kind])); });
      assert.equal(signal.aborted, false);
      act(() => tree.unmount());
      assert.equal(signal.aborted, true);
      await act(async () => { reject(new Error('Cancelled')); });
    } finally {
      global.fetch = originalFetch;
    }
  });
}

test('list ignores an old page response even when the API mock does not honor cancellation', async () => {
  const originalFetch = global.fetch;
  let resolveOld;
  let tree;
  global.fetch = async url => {
    if (url.includes('offset=9&')) return new Promise(resolve => { resolveOld = resolve; });
    return goodApi('list', url);
  };
  try {
    await act(async () => { tree = create(React.createElement(components.list)); });
    const changePage = tree.root.findByType(MockPagination).props.onPageChange;
    await act(async () => { changePage(2); });
    await act(async () => { changePage(3); });
    await act(async () => { resolveOld(response({ count: 27, results: [] })); });
    assert.equal(tree.root.findByType(MockPagination).props.current, 3);
    assert.equal(tree.root.findAllByType(MockPokemon)[0].props.text, 'CHARMANDER');
  } finally {
    if (tree) act(() => tree.unmount());
    global.fetch = originalFetch;
  }
});
