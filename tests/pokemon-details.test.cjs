const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const path = require('node:path');

// Load the existing page without adding a test framework or changing Next.js.
const filename = path.resolve(__dirname, '../pages/[slug].tsx');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const page = new Module(filename, module);
page.filename = filename;
page.paths = Module._nodeModulePaths(path.dirname(filename));
page._compile(compiled, filename);
const { getStaticProps, getStaticPaths } = page.exports;

async function withFetch(mock, run) {
  const original = global.fetch;
  global.fetch = mock;
  try { await run(); } finally { global.fetch = original; }
}

test('missing or invalid slugs return 404 without requesting the API', async () => {
  await withFetch(() => { throw new Error('Unexpected fetch'); }, async () => {
    for (const slug of [undefined, '', ' ', ['bulbasaur']]) {
      assert.deepEqual(await getStaticProps({ params: { slug } }), { notFound: true });
    }
  });
});

test('a nonexistent Pokemon returns 404 without parsing the error body', async () => {
  await withFetch(async () => ({ status: 404, ok: false, json() { throw new Error('Unexpected JSON parsing'); } }), async () => {
    assert.deepEqual(await getStaticProps({ params: { slug: 'pokemon-inexistente' } }), { notFound: true });
  });
});

test('temporary API errors are not treated as nonexistent Pokemon', async () => {
  await withFetch(async () => ({ status: 503, ok: false }), async () => {
    await assert.rejects(getStaticProps({ params: { slug: 'bulbasaur' } }), /HTTP 503/);
  });
});

test('invalid successful responses fail before rendering details', async () => {
  for (const data of [null, {}, { name: 1 }]) {
    await withFetch(async () => ({ status: 200, ok: true, json: async () => data }), async () => {
      await assert.rejects(getStaticProps({ params: { slug: 'bulbasaur' } }), /Invalid Pokemon details response/);
    });
  }
});

test('valid details are preserved and the slug is URL encoded', async () => {
  const data = { name: 'bulbasaur', id: 1 };
  await withFetch(async (url) => {
    assert.equal(url, 'https://pokeapi.co/api/v2/pokemon/bulbasaur%2Fextra');
    return { status: 200, ok: true, json: async () => data };
  }, async () => {
    assert.deepEqual(await getStaticProps({ params: { slug: 'bulbasaur/extra' } }), { props: { data }, revalidate: 86400 });
  });
});

test('network failures remain observable', async () => {
  await withFetch(async () => { throw new Error('Network unavailable'); }, async () => {
    await assert.rejects(getStaticProps({ params: { slug: 'bulbasaur' } }), /Network unavailable/);
  });
});

test('getStaticPaths pre-renders only a small, bounded set of Pokemon', async () => {
  await withFetch(async (url) => {
    assert.match(url, /limit=50$/);
    return { ok: true, status: 200, json: async () => ({ results: [{ name: 'bulbasaur' }, { name: 1 }, null] }) };
  }, async () => {
    assert.deepEqual(await getStaticPaths({}), {
      paths: [{ params: { slug: 'bulbasaur' } }],
      fallback: 'blocking',
    });
  });
});

test('getStaticPaths falls back to on-demand rendering when the API fails', async () => {
  const warn = console.warn;
  console.warn = () => {};
  try {
    for (const mock of [
      async () => ({ ok: false, status: 503 }),
      async () => ({ ok: true, status: 200, json: async () => ({}) }),
      async () => { throw new Error('network down'); },
    ]) {
      await withFetch(mock, async () => {
        assert.deepEqual(await getStaticPaths({}), { paths: [], fallback: 'blocking' });
      });
    }
  } finally { console.warn = warn; }
});
