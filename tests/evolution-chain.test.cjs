const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { act, fireEvent, render, screen, waitFor } = require('./setup-dom.cjs');
const { clearPokeApiCacheForTests } = require('../lib/usePokeApi.ts');
const {
  fetchEvolutionChain,
  getEvolutionSpriteUrl,
  isPokemonSpeciesUrl,
} = require('../lib/evolution.ts');
const { getEvolutionConditionLabels } = require('../lib/evolutionText.ts');

const api = 'https://pokeapi.co/api/v2';
const speciesUrl = `${api}/pokemon-species/1/`;
const response = data => ({ ok: true, status: 200, json: async () => data });
const resource = (name, id, group = 'pokemon-species') => ({
  name,
  url: `${api}/${group}/${id}/`,
});

function details(overrides = {}) {
  return {
    trigger: resource('level-up', 1, 'evolution-trigger'),
    item: null,
    gender: null,
    held_item: null,
    known_move: null,
    known_move_type: null,
    location: null,
    min_level: null,
    min_happiness: null,
    min_beauty: null,
    min_affection: null,
    needs_overworld_rain: false,
    party_species: null,
    party_type: null,
    relative_physical_stats: null,
    time_of_day: '',
    trade_species: null,
    turn_upside_down: false,
    ...overrides,
  };
}

function loadEvolutionComponent(language = 'pt-BR') {
  const filename = path.resolve(__dirname, '../components/EvolutionChain.tsx');
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  const originalRequire = loaded.require.bind(loaded);
  loaded.require = name => {
    if (name === 'next/link') {
      return {
        __esModule: true,
        default: ({ children, ...props }) => React.createElement('a', props, children),
      };
    }
    if (name === '../context/LanguageContext') {
      return { useLanguage: () => ({ language }) };
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

test('loads a validated linear evolution chain through species and chain resources', async () => {
  clearPokeApiCacheForTests();
  const urls = [];
  const originalFetch = global.fetch;
  global.fetch = async url => {
    urls.push(url);
    if (url === speciesUrl) {
      return response({ evolution_chain: { url: `${api}/evolution-chain/1/` } });
    }
    return response({
      chain: {
        species: resource('bulbasaur', 1),
        evolution_details: [],
        evolves_to: [
          {
            species: resource('ivysaur', 2),
            evolution_details: [details({ min_level: 16 })],
            evolves_to: [],
          },
        ],
      },
    });
  };

  try {
    const chain = await fetchEvolutionChain(speciesUrl, new AbortController().signal);
    assert.deepEqual(
      chain.evolves_to.map(node => node.species.name),
      ['ivysaur']
    );
    assert.equal(chain.evolves_to[0].evolution_details[0].min_level, 16);
    assert.deepEqual(urls, [`${api}/pokemon-species/1/`, `${api}/evolution-chain/1/`]);
  } finally {
    global.fetch = originalFetch;
    clearPokeApiCacheForTests();
  }
});

test('keeps every branch and its condition attached to the correct destination', async () => {
  clearPokeApiCacheForTests();
  const originalFetch = global.fetch;
  global.fetch = async url =>
    url.endsWith('/pokemon-species/133/')
      ? response({ evolution_chain: { url: `${api}/evolution-chain/67/` } })
      : response({
          chain: {
            species: resource('eevee', 133),
            evolution_details: [],
            evolves_to: [
              {
                species: resource('vaporeon', 134),
                evolution_details: [
                  details({
                    trigger: resource('use-item', 3, 'evolution-trigger'),
                    item: resource('water-stone', 84, 'item'),
                  }),
                ],
                evolves_to: [],
              },
              {
                species: resource('jolteon', 135),
                evolution_details: [
                  details({
                    trigger: resource('use-item', 3, 'evolution-trigger'),
                    item: resource('thunder-stone', 83, 'item'),
                  }),
                ],
                evolves_to: [],
              },
            ],
          },
        });

  try {
    const chain = await fetchEvolutionChain(
      `${api}/pokemon-species/133/`,
      new AbortController().signal
    );
    assert.deepEqual(
      chain.evolves_to.map(node => node.species.name),
      ['vaporeon', 'jolteon']
    );
    assert.match(
      getEvolutionConditionLabels(chain.evolves_to[0].evolution_details, 'en')[0],
      /water stone/i
    );
    assert.match(
      getEvolutionConditionLabels(chain.evolves_to[1].evolution_details, 'en')[0],
      /thunder stone/i
    );
  } finally {
    global.fetch = originalFetch;
    clearPokeApiCacheForTests();
  }
});

test('formats levels, special conditions, missing conditions and both languages', () => {
  const condition = details({
    min_level: 20,
    min_happiness: 160,
    time_of_day: 'night',
    known_move_type: resource('fairy', 18, 'type'),
    needs_overworld_rain: true,
  });
  const portuguese = getEvolutionConditionLabels([condition], 'pt-BR')[0];
  const english = getEvolutionConditionLabels([condition], 'en')[0];
  assert.match(portuguese, /Nível 20/);
  assert.match(portuguese, /Felicidade mínima: 160/);
  assert.match(portuguese, /a noite/);
  assert.match(portuguese, /Fada/);
  assert.match(english, /Level 20/);
  assert.match(english, /Minimum happiness: 160/);
  assert.match(english, /the night/);
  assert.match(english, /Fairy/);
  assert.deepEqual(getEvolutionConditionLabels([], 'en'), ['Condition not provided']);
});

test('rejects invalid ids and malformed or untrusted evolution responses', async () => {
  clearPokeApiCacheForTests();
  await assert.rejects(
    fetchEvolutionChain(
      'https://example.test/api/v2/pokemon-species/1/',
      new AbortController().signal
    ),
    /Invalid Pokemon species URL/
  );
  const originalFetch = global.fetch;
  global.fetch = async url =>
    url.endsWith('/pokemon-species/1/')
      ? response({ evolution_chain: { url: 'https://example.test/chain' } })
      : response({ chain: { species: 'bulbasaur', evolves_to: [], evolution_details: [] } });
  try {
    await assert.rejects(
      fetchEvolutionChain(speciesUrl, new AbortController().signal),
      /Invalid evolution chain URL/
    );
    clearPokeApiCacheForTests();
    global.fetch = async url =>
      url.endsWith('/pokemon-species/1/')
        ? response({ evolution_chain: { url: `${api}/evolution-chain/1/` } })
        : response({ chain: { species: 'bulbasaur', evolves_to: [], evolution_details: [] } });
    await assert.rejects(
      fetchEvolutionChain(speciesUrl, new AbortController().signal),
      /Invalid evolution resource/
    );
  } finally {
    global.fetch = originalFetch;
    clearPokeApiCacheForTests();
  }
});

test('only derives sprites from canonical PokeAPI species URLs', () => {
  assert.equal(
    getEvolutionSpriteUrl(`${api}/pokemon-species/133/`),
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/133.png'
  );
  assert.equal(getEvolutionSpriteUrl('https://example.test/pokemon-species/133/'), null);
  assert.equal(getEvolutionSpriteUrl(`${api}/pokemon/133/`), null);
  assert.equal(isPokemonSpeciesUrl(speciesUrl), true);
  assert.equal(isPokemonSpeciesUrl('https://pokeapi.co/api/v2/pokemon/133/'), false);
});

test('defers requests until the section approaches the viewport and renders the evolution UI', async () => {
  clearPokeApiCacheForTests();
  const requests = [];
  const originalFetch = global.fetch;
  const originalObserver = global.IntersectionObserver;
  let observerCallback;
  global.IntersectionObserver = class {
    constructor(callback) {
      observerCallback = callback;
    }
    observe() {}
    disconnect() {}
  };
  global.fetch = async url => {
    requests.push(url);
    if (url.endsWith('/pokemon-species/1/')) {
      return response({ evolution_chain: { url: `${api}/evolution-chain/1/` } });
    }
    return response({
      chain: {
        species: resource('bulbasaur', 1),
        evolution_details: [],
        evolves_to: [
          {
            species: resource('ivysaur', 2),
            evolution_details: [details({ min_level: 16 })],
            evolves_to: [],
          },
        ],
      },
    });
  };

  const { default: EvolutionChain } = loadEvolutionComponent();
  const view = render(
    React.createElement(EvolutionChain, { speciesUrl, currentName: 'bulbasaur' })
  );
  try {
    assert.equal(requests.length, 0);
    assert.ok(screen.getByRole('heading', { name: 'Linha de evolução' }));
    act(() => observerCallback([{ isIntersecting: true }]));
    await waitFor(() => assert.ok(screen.getByRole('link', { name: 'Ver detalhes de ivysaur' })));
    assert.equal(requests.length, 2);
    assert.ok(
      screen.getByTestId('evolution-arrow').querySelector('svg.hidden')?.classList.contains('h-9')
    );
    assert.equal(
      screen.getByRole('link', { name: 'Ver detalhes de bulbasaur' }).getAttribute('aria-current'),
      'page'
    );
    assert.ok(screen.getAllByText('Nível 16').length >= 1);
  } finally {
    view.unmount();
    global.fetch = originalFetch;
    global.IntersectionObserver = originalObserver;
    clearPokeApiCacheForTests();
  }
});

test('shows retry after a failed chain request and cancels observation on unmount', async () => {
  clearPokeApiCacheForTests();
  const originalFetch = global.fetch;
  const originalObserver = global.IntersectionObserver;
  let observerCallback;
  let calls = 0;
  global.IntersectionObserver = class {
    constructor(callback) {
      observerCallback = callback;
    }
    observe() {}
    disconnect() {}
  };
  global.fetch = async url => {
    calls += 1;
    if (url.endsWith('/pokemon-species/1/')) {
      return response({ evolution_chain: { url: `${api}/evolution-chain/1/` } });
    }
    if (calls === 2) return { ok: false, status: 503, json: async () => ({}) };
    return response({
      chain: { species: resource('bulbasaur', 1), evolves_to: [], evolution_details: [] },
    });
  };

  const { default: EvolutionChain } = loadEvolutionComponent();
  const view = render(
    React.createElement(EvolutionChain, { speciesUrl, currentName: 'bulbasaur' })
  );
  try {
    act(() => observerCallback([{ isIntersecting: true }]));
    await waitFor(() => assert.ok(screen.getByRole('button', { name: 'Tentar novamente' })));
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    await waitFor(() => assert.ok(screen.getByRole('link', { name: 'Ver detalhes de bulbasaur' })));
    assert.equal(calls, 3);
  } finally {
    view.unmount();
    global.fetch = originalFetch;
    global.IntersectionObserver = originalObserver;
    clearPokeApiCacheForTests();
  }
});

test('aborts the in-flight API request when the evolution section unmounts', async () => {
  clearPokeApiCacheForTests();
  const originalFetch = global.fetch;
  const originalObserver = global.IntersectionObserver;
  let observerCallback;
  let requestSignal;
  global.IntersectionObserver = class {
    constructor(callback) {
      observerCallback = callback;
    }
    observe() {}
    disconnect() {}
  };
  global.fetch = async (_url, { signal }) =>
    new Promise((_resolve, reject) => {
      requestSignal = signal;
      signal.addEventListener('abort', () => reject(signal.reason), { once: true });
    });

  const { default: EvolutionChain } = loadEvolutionComponent();
  const view = render(
    React.createElement(EvolutionChain, { speciesUrl, currentName: 'bulbasaur' })
  );
  try {
    act(() => observerCallback([{ isIntersecting: true }]));
    await waitFor(() => assert.ok(requestSignal));
    view.unmount();
    await waitFor(() => assert.equal(requestSignal.aborted, true));
  } finally {
    global.fetch = originalFetch;
    global.IntersectionObserver = originalObserver;
    clearPokeApiCacheForTests();
  }
});

test('groups Eevee evolutions into responsive branches with clear arrows', () => {
  const { EvolutionTreeView } = loadEvolutionComponent();
  const node = {
    species: resource('eevee', 133),
    evolution_details: [],
    evolves_to: [
      ['vaporeon', 134],
      ['jolteon', 135],
      ['flareon', 136],
      ['espeon', 196],
      ['umbreon', 197],
      ['leafeon', 470],
      ['glaceon', 471],
      ['sylveon', 700],
    ].map(([name, id]) => ({
      species: resource(name, id),
      evolution_details: [details({ min_level: 20 })],
      evolves_to: [],
    })),
  };
  const view = render(React.createElement(EvolutionTreeView, { node, currentName: 'eevee' }));
  try {
    const tree = screen.getByTestId('evolution-tree');
    const branch = screen.getByTestId('evolution-branch');
    assert.equal(branch.querySelectorAll('[data-testid="evolution-arrow"]').length, 8);
    assert.ok(branch.querySelector('ul')?.classList.contains('grid-cols-1'));
    assert.ok(branch.querySelector('ul')?.classList.contains('sm:grid-cols-2'));
    assert.equal(tree.textContent.includes('Nível 20'), false);
    assert.equal(tree.querySelectorAll('[data-selected="true"]').length, 1);
    assert.equal(screen.getAllByRole('link').length, 9);
    assert.equal(
      screen.getByRole('link', { name: 'Ver detalhes de eevee' }).getAttribute('aria-current'),
      'page'
    );
    assert.equal(tree.querySelector('[class*="min-w-[48rem]"]'), null);
    const optionGroups = screen.getByTestId('evolution-option-groups');
    assert.equal(optionGroups.querySelectorAll('section').length, 1);
    assert.ok(optionGroups.querySelector('section')?.classList.contains('lg:col-span-2'));
    assert.ok(
      optionGroups
        .querySelector('ul')
        ?.className.includes('grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))]')
    );
  } finally {
    view.unmount();
  }
});

test('keeps a three-Pokemon linear evolution aligned as one compact chain', () => {
  const { EvolutionTreeView } = loadEvolutionComponent();
  const node = {
    species: resource('gastly', 92),
    evolution_details: [],
    evolves_to: [
      {
        species: resource('haunter', 93),
        evolution_details: [details({ min_level: 25 })],
        evolves_to: [
          {
            species: resource('gengar', 94),
            evolution_details: [details({ trigger: resource('trade', 2, 'evolution-trigger') })],
            evolves_to: [],
          },
        ],
      },
    ],
  };
  const view = render(React.createElement(EvolutionTreeView, { node, currentName: 'haunter' }));
  try {
    const tree = screen.getByTestId('evolution-tree');
    const chain = tree.querySelector('[data-testid="evolution-chain"][data-compact="false"]');
    assert.ok(chain?.classList.contains('w-fit'));
    assert.ok(chain?.classList.contains('sm:flex-row'));
    assert.equal(chain?.querySelectorAll('[data-testid="evolution-arrow"]').length, 2);
    assert.equal(chain?.querySelectorAll('a').length, 3);
    assert.equal(
      chain?.querySelectorAll('[data-testid="evolution-chain"][data-compact="false"]').length,
      1
    );
    assert.equal(screen.getAllByRole('link').length, 3);
    const optionGroups = screen.getByTestId('evolution-option-groups');
    assert.equal(optionGroups.querySelectorAll('section').length, 2);
    assert.ok(optionGroups.classList.contains('lg:grid-cols-2'));
  } finally {
    view.unmount();
  }
});

test('moves evolution conditions off the arrows and groups required and alternative conditions', () => {
  const { EvolutionTreeView } = loadEvolutionComponent('en');
  const node = {
    species: resource('eevee', 133),
    evolution_details: [],
    evolves_to: [
      {
        species: resource('sylveon', 700),
        evolution_details: [
          details({
            known_move: resource('baby-doll-eyes', 608, 'move'),
            min_affection: 2,
          }),
          details({
            known_move_type: resource('fairy', 18, 'type'),
            min_happiness: 160,
          }),
        ],
        evolves_to: [],
      },
      {
        species: resource('vaporeon', 134),
        evolution_details: [
          details({
            trigger: resource('use-item', 3, 'evolution-trigger'),
            item: resource('water-stone', 84, 'item'),
          }),
        ],
        evolves_to: [],
      },
    ],
  };
  const view = render(React.createElement(EvolutionTreeView, { node, currentName: 'eevee' }));
  try {
    const map = screen.getByTestId('evolution-tree');
    const optionsPanel = screen.getByRole('complementary');
    const explorerLayout = map.parentElement;
    assert.ok(explorerLayout?.className.includes('flex-col'));
    assert.ok(map.compareDocumentPosition(optionsPanel) & 4);
    assert.equal(map.querySelectorAll('[data-testid="evolution-arrow"] li').length, 0);
    assert.ok(screen.getByRole('button', { name: /SYLVEON Selected 2 possible methods/ }));

    fireEvent.click(screen.getByRole('button', { name: 'View conditions for sylveon' }));
    assert.ok(screen.getByRole('heading', { name: 'Conditions for SYLVEON' }));
    assert.ok(screen.getByText('Knows baby doll eyes'));
    assert.ok(screen.getByText('Minimum affection: 2'));
    assert.ok(screen.getByText('Knows a Fairy-type move'));
    assert.ok(screen.getByText('Minimum happiness: 160'));
    assert.equal(
      screen
        .getByRole('button', { name: 'View conditions for sylveon' })
        .getAttribute('aria-pressed'),
      'true'
    );
    assert.equal(
      map
        .querySelector('[data-testid="evolution-arrow"][data-target="sylveon"]')
        .getAttribute('data-selected'),
      'true'
    );
    assert.ok(screen.getByRole('link', { name: 'View sylveon details' }));
  } finally {
    view.unmount();
  }
});
