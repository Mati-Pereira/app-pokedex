const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { render, screen } = require('./setup-dom.cjs');

function MockPagination() {
  return React.createElement('div', { 'data-testid': 'pagination' });
}

function MockPokemon({ text, priority }) {
  return React.createElement(
    'article',
    { 'data-testid': 'pokemon', 'data-priority': String(priority) },
    text
  );
}

function loadIndex() {
  const filename = path.resolve(__dirname, '../pages/index.tsx');
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  const originalRequire = loaded.require.bind(loaded);
  loaded.require = name => {
    if (name === 'next/link') return { __esModule: true, default: ({ children }) => children };
    if (name === 'next/dynamic') return { __esModule: true, default: () => MockPagination };
    if (name === '../components/Grid')
      return { __esModule: true, default: ({ children }) => children };
    if (name === '../components/Pokemon') return { __esModule: true, default: MockPokemon };
    if (name === '@uiball/loaders') return { Waveform: () => null };
    if (name === '../context/LanguageContext') {
      return { useLanguage: () => ({ language: 'pt-BR' }) };
    }
    return originalRequire(name);
  };
  loaded._compile(
    ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText,
    filename
  );
  return loaded.exports;
}

const { default: Index, getStaticProps } = loadIndex();

const detail = (name, id) => ({
  id,
  name,
  sprites: { front_default: `sprite-${id}.png` },
  abilities: [],
  stats: [],
  types: [{ type: { name: 'grass' } }],
});

test('home is statically populated and revalidates after six hours', async () => {
  const originalFetch = global.fetch;
  const requests = [];
  global.fetch = async url => {
    requests.push(url);
    if (url.includes('?offset=0&limit=9')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          count: 1500,
          results: [{ name: 'bulbasaur' }, { name: 'ivysaur' }],
        }),
      };
    }
    const name = url.split('/').pop();
    const id = name === 'bulbasaur' ? 1 : 2;
    return { ok: true, status: 200, json: async () => detail(name, id) };
  };

  try {
    const result = await getStaticProps({});
    assert.equal(result.revalidate, 6 * 60 * 60);
    assert.equal(result.props.initialData.count, 1500);
    assert.deepEqual(
      result.props.initialData.pokemons.map(pokemon => pokemon.name),
      ['bulbasaur', 'ivysaur']
    );
    assert.equal(requests.length, 3);

    global.fetch = async () => {
      throw new Error('Initial page should not fetch in the browser');
    };
    const view = render(React.createElement(Index, { initialData: result.props.initialData }));
    assert.equal(screen.getAllByTestId('pokemon').length, 2);
    assert.equal(screen.getAllByTestId('pokemon')[0].dataset.priority, 'true');
    assert.equal(screen.getAllByTestId('pokemon')[1].dataset.priority, 'false');
    assert.equal(screen.queryByRole('status'), null);
    view.unmount();
  } finally {
    global.fetch = originalFetch;
  }
});

test('home generation fails closed for unavailable or malformed catalog data', async () => {
  const originalFetch = global.fetch;
  try {
    for (const badResponse of [
      { ok: false, status: 503 },
      { ok: true, status: 200, json: async () => ({ count: -1, results: [] }) },
      { ok: true, status: 200, json: async () => ({ count: 1, results: [{ name: '../bad' }] }) },
    ]) {
      global.fetch = async () => badResponse;
      await assert.rejects(getStaticProps({}));
    }
  } finally {
    global.fetch = originalFetch;
  }
});
