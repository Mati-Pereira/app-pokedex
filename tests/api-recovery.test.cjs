const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { act, fireEvent, render, screen, waitFor } = require('./setup-dom.cjs');
let latestPageChange;
function MockPokemon({ text }) { return React.createElement('article', { 'data-testid': 'pokemon' }, text); }
function MockPagination({ current, total, onPageChange }) {
  latestPageChange = onPageChange;
  return React.createElement('button', {
    'data-testid': 'pagination',
    'data-current': current,
    'data-total': total,
    onClick: () => onPageChange(current < total ? current + 1 : 1),
  }, `Page ${current} of ${total}`);
}
function MockSelect({ instanceId, options, isLoading, onChange }) {
  return React.createElement('input', {
    'aria-label': instanceId,
    'data-testid': `select-${instanceId}`,
    'data-option-count': options?.length ?? 0,
    'data-loading': String(!!isLoading),
    onChange: event => onChange({ value: event.target.value, label: event.target.value }),
  });
}
function MockLoader() { return React.createElement('span', { 'data-testid': 'loader' }, 'Loading'); }
const context = React.createContext({ updateInput() {} });
const router = { isReady: true, pathname: '/types', query: { type: 'fire' }, push: async () => true };
function loadModule(relative) {
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
    if (name === 'next/dynamic') return { __esModule: true, default: () => MockPagination };
    if (name === 'react-responsive-pagination') return { __esModule: true, default: MockPagination };
    if (name === 'react-select') return { __esModule: true, default: MockSelect, components: {}, createFilter: () => () => true };
    if (name === '../context/InputPokemon') return { InputContext: context };
    if (name === './SearchField') return { __esModule: true, default: loadModule('components/SearchField.tsx') };
    if (name === './Toggle') return { __esModule: true, default: () => null };
    if (name === '@uiball/loaders') return { Waveform: MockLoader, Ring: MockLoader };
    return originalRequire(name);
  };
  loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText, filename);
  return loaded.exports.default;
}
const load = loadModule;
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
      let view;
      global.fetch = url => failing ? badApi() : Promise.resolve(goodApi(kind, url));
      try {
        view = render(React.createElement(components[kind]));
        await waitFor(() => assert.ok(screen.getByRole('alert')));
        assert.equal(screen.queryByTestId('loader'), null);
        if (kind === 'names') assert.equal(screen.getByTestId('select-pokemon-name').dataset.loading, 'false');
        failing = false;
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
        await waitFor(() => assert.equal(screen.queryByRole('alert'), null));
        if (kind === 'names') {
          assert.equal(screen.getByTestId('select-pokemon-name').dataset.optionCount, '1');
          assert.equal(screen.getByTestId('select-pokemon-name').dataset.loading, 'false');
        } else {
          await waitFor(() => assert.equal(screen.getByTestId('pokemon').textContent, 'CHARMANDER'));
        }
      } finally {
        if (view) view.unmount();
        global.fetch = originalFetch;
      }
    });
  }
}
for (const kind of ['list', 'type']) {
  test(`${kind} handles a failed individual Pokemon request and an invalid detail response`, async () => {
    for (const badDetail of [() => ({ ok: false, status: 500 }), () => response({ name: 'charmander' })]) {
      const originalFetch = global.fetch;
      let view;
      global.fetch = async url => url.startsWith('https://example.test/') ? badDetail() : goodApi(kind, url);
      try {
        view = render(React.createElement(components[kind]));
        await waitFor(() => assert.ok(screen.getByRole('alert')));
        assert.equal(screen.queryByTestId('loader'), null);
        assert.equal(screen.queryAllByTestId('pokemon').length, 0);
      } finally {
        if (view) view.unmount();
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
    let view;
    global.fetch = (url, options) => {
      signal = options.signal;
      return new Promise((resolve, rejectPromise) => { reject = rejectPromise; });
    };
    try {
      view = render(React.createElement(components[kind]));
      await waitFor(() => assert.ok(signal));
      assert.equal(signal.aborted, false);
      view.unmount();
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
  let view;
  global.fetch = async url => {
    if (url.includes('offset=9&')) return new Promise(resolve => { resolveOld = resolve; });
    return goodApi('list', url);
  };
  try {
    view = render(React.createElement(components.list));
    await waitFor(() => assert.equal(screen.getByTestId('pagination').dataset.current, '1'));
    const changePage = latestPageChange;
    await act(async () => { changePage(2); });
    await waitFor(() => assert.equal(typeof resolveOld, 'function'));
    await act(async () => { changePage(3); });
    await waitFor(() => assert.equal(screen.getByTestId('pagination').dataset.current, '3'));
    await act(async () => { resolveOld(response({ count: 27, results: [] })); });
    assert.equal(screen.getByTestId('pagination').dataset.current, '3');
    assert.equal(screen.getByTestId('pokemon').textContent, 'CHARMANDER');
  } finally {
    if (view) view.unmount();
    global.fetch = originalFetch;
  }
});
