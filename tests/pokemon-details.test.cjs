const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const path = require('node:path');

// Let the page import local .ts modules (lib/pokeapi.ts) when loaded outside Next.js.
require.extensions['.ts'] = (mod, file) => {
  mod._compile(
    ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
    }).outputText,
    file
  );
};

// Load the existing page without adding a test framework or changing Next.js.
const filename = path.resolve(__dirname, '../pages/[slug].tsx');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const page = new Module(filename, module);
page.filename = filename;
page.paths = Module._nodeModulePaths(path.dirname(filename));
const originalRequire = page.require.bind(page);
page.require = name => {
  if (name === '../components/EvolutionChain') return { __esModule: true, default: () => null };
  return originalRequire(name);
};
page._compile(compiled, filename);
const { getStaticProps, getStaticPaths } = page.exports;

async function withFetch(mock, run) {
  const original = global.fetch;
  global.fetch = mock;
  try {
    await run();
  } finally {
    global.fetch = original;
  }
}

test('missing or invalid slugs return 404 without requesting the API', async () => {
  await withFetch(
    () => {
      throw new Error('Unexpected fetch');
    },
    async () => {
      for (const slug of [undefined, '', ' ', ['bulbasaur']]) {
        assert.deepEqual(await getStaticProps({ params: { slug } }), { notFound: true });
      }
    }
  );
});

test('a nonexistent Pokemon returns 404 without parsing the error body', async () => {
  await withFetch(
    async () => ({
      status: 404,
      ok: false,
      json() {
        throw new Error('Unexpected JSON parsing');
      },
    }),
    async () => {
      assert.deepEqual(await getStaticProps({ params: { slug: 'pokemon-inexistente' } }), {
        notFound: true,
      });
    }
  );
});

test('temporary API errors are not treated as nonexistent Pokemon', async () => {
  await withFetch(
    async () => ({ status: 503, ok: false }),
    async () => {
      await assert.rejects(getStaticProps({ params: { slug: 'bulbasaur' } }), /HTTP 503/);
    }
  );
});

test('invalid successful responses fail before rendering details', async () => {
  for (const data of [null, {}, { name: 1 }]) {
    await withFetch(
      async () => ({ status: 200, ok: true, json: async () => data }),
      async () => {
        await assert.rejects(
          getStaticProps({ params: { slug: 'bulbasaur' } }),
          /Invalid Pokemon details response/
        );
      }
    );
  }
});

test('valid details are preserved without runtime revalidation', async () => {
  const response = {
    name: 'bulbasaur',
    id: 1,
    species: { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon-species/1/' },
    sprites: {
      front_default: 'front.png',
      back_default: 'back.png',
      front_shiny: 'front-shiny.png',
      back_shiny: 'back-shiny.png',
      other: { officialArtwork: 'unused.png' },
    },
    abilities: [{ ability: { name: 'overgrow', url: '/abilities/overgrow' }, is_hidden: false }],
    stats: [{ base_stat: 45, effort: 0, stat: { name: 'hp', url: '/stats/hp' } }],
    types: [{ slot: 1, type: { name: 'grass', url: '/types/grass' } }],
    unusedApiField: 'should not reach the browser',
  };
  const data = {
    id: 1,
    name: 'bulbasaur',
    sprites: {
      front_default: 'front.png',
      back_default: 'back.png',
      front_shiny: 'front-shiny.png',
      back_shiny: 'back-shiny.png',
    },
    abilities: [{ ability: { name: 'overgrow' } }],
    stats: [{ base_stat: 45, stat: { name: 'hp' } }],
    types: [{ type: { name: 'grass' } }],
  };
  await withFetch(
    async url => {
      assert.equal(url, 'https://pokeapi.co/api/v2/pokemon/bulbasaur');
      return { status: 200, ok: true, json: async () => response };
    },
    async () => {
      assert.deepEqual(await getStaticProps({ params: { slug: 'bulbasaur' } }), {
        props: {
          data,
          speciesUrl: 'https://pokeapi.co/api/v2/pokemon-species/1/',
          speciesName: 'bulbasaur',
        },
      });
    }
  );
});

test('uses the API species resource for alternate Pokemon forms', async () => {
  const response = {
    name: 'deoxys-attack',
    id: 10001,
    species: { name: 'deoxys', url: 'https://pokeapi.co/api/v2/pokemon-species/386/' },
    sprites: {},
    types: [],
  };
  await withFetch(
    async url => {
      assert.equal(url, 'https://pokeapi.co/api/v2/pokemon/deoxys-attack');
      return { status: 200, ok: true, json: async () => response };
    },
    async () => {
      const result = await getStaticProps({ params: { slug: 'deoxys-attack' } });
      assert.equal(result.props.speciesUrl, 'https://pokeapi.co/api/v2/pokemon-species/386/');
      assert.equal(result.props.speciesName, 'deoxys');
    }
  );
});

test('network failures remain observable', async () => {
  await withFetch(
    async () => {
      throw new Error('Network unavailable');
    },
    async () => {
      await assert.rejects(
        getStaticProps({ params: { slug: 'bulbasaur' } }),
        /Network unavailable/
      );
    }
  );
});

test('getStaticPaths pre-renders all valid Pokemon and disables runtime fallback', async () => {
  await withFetch(
    async url => {
      assert.match(url, /limit=100000$/);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          results: [
            { name: 'bulbasaur' },
            { name: 'mr-mime' },
            { name: '../bad' },
            { name: 1 },
            null,
          ],
        }),
      };
    },
    async () => {
      assert.deepEqual(await getStaticPaths({}), {
        paths: [{ params: { slug: 'bulbasaur' } }, { params: { slug: 'mr-mime' } }],
        fallback: false,
      });
    }
  );
});

test('getStaticPaths fails closed if the Pokemon catalog cannot be loaded', async () => {
  const error = console.error;
  console.error = () => {};
  try {
    for (const mock of [
      async () => ({ ok: false, status: 503 }),
      async () => ({ ok: true, status: 200, json: async () => ({}) }),
      async () => {
        throw new Error('network down');
      },
    ]) {
      await withFetch(mock, async () => {
        await assert.rejects(getStaticPaths({}));
      });
    }
  } finally {
    console.error = error;
  }
});
