const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const ts = require('typescript');
const Module = require('node:module');

const filename = path.resolve(__dirname, '../lib/pokeapi.ts');
function loadModule() {
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  mod._compile(compiled, filename);
  return mod.exports;
}

async function inTempProject(phase, run) {
  const cwd = process.cwd();
  const originalFetch = global.fetch;
  const originalPhase = process.env.NEXT_PHASE;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pokeapi-cache-'));
  process.chdir(dir);
  if (phase === undefined) delete process.env.NEXT_PHASE; else process.env.NEXT_PHASE = phase;
  try {
    await run(dir);
  } finally {
    process.chdir(cwd);
    global.fetch = originalFetch;
    if (originalPhase === undefined) delete process.env.NEXT_PHASE; else process.env.NEXT_PHASE = originalPhase;
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const okResponse = (data) => ({ ok: true, status: 200, text: async () => JSON.stringify(data) });

test('outside the build every call goes straight to the API', async () => {
  await inTempProject(undefined, async (dir) => {
    let calls = 0;
    global.fetch = async () => { calls++; return okResponse({ n: calls }); };
    const { pokeApiFetch } = loadModule();
    await pokeApiFetch('https://pokeapi.co/api/v2/pokemon/1');
    await pokeApiFetch('https://pokeapi.co/api/v2/pokemon/1');
    assert.equal(calls, 2);
    assert.equal(fs.existsSync(path.join(dir, '.next')), false);
  });
});

test('during the build a URL is requested once, even concurrently', async () => {
  await inTempProject('phase-production-build', async () => {
    let calls = 0;
    global.fetch = async () => { calls++; return okResponse({ name: 'bulbasaur' }); };
    const { pokeApiFetch } = loadModule();
    const responses = await Promise.all([1, 2, 3].map(() => pokeApiFetch('https://pokeapi.co/api/v2/pokemon/1')));
    for (const res of responses) assert.deepEqual(await res.json(), { name: 'bulbasaur' });
    assert.equal(calls, 1);
  });
});

test('the disk cache is reused by a later build', async () => {
  await inTempProject('phase-production-build', async () => {
    let calls = 0;
    global.fetch = async () => { calls++; return okResponse({ name: 'ivysaur' }); };
    await loadModule().pokeApiFetch('https://pokeapi.co/api/v2/pokemon/2');
    global.fetch = async () => { throw new Error('API should not be called'); };
    const res = await loadModule().pokeApiFetch('https://pokeapi.co/api/v2/pokemon/2');
    assert.deepEqual(await res.json(), { name: 'ivysaur' });
    assert.equal(calls, 1);
  });
});

test('an expired disk cache entry is refreshed', async () => {
  await inTempProject('phase-production-build', async (dir) => {
    global.fetch = async () => okResponse({ v: 1 });
    await loadModule().pokeApiFetch('https://pokeapi.co/api/v2/pokemon/3');
    const cacheDir = path.join(dir, '.next', 'cache', 'pokeapi');
    const old = new Date(Date.now() - 48 * 60 * 60 * 1000);
    for (const f of fs.readdirSync(cacheDir)) fs.utimesSync(path.join(cacheDir, f), old, old);
    global.fetch = async () => okResponse({ v: 2 });
    const res = await loadModule().pokeApiFetch('https://pokeapi.co/api/v2/pokemon/3');
    assert.deepEqual(await res.json(), { v: 2 });
  });
});

test('failed responses are not cached and keep their real status', async () => {
  await inTempProject('phase-production-build', async (dir) => {
    let calls = 0;
    global.fetch = async () => { calls++; return { ok: false, status: 503, text: async () => 'x' }; };
    const { pokeApiFetch } = loadModule();
    assert.equal((await pokeApiFetch('https://pokeapi.co/api/v2/pokemon/4')).status, 503);
    assert.equal((await pokeApiFetch('https://pokeapi.co/api/v2/pokemon/4')).status, 503);
    assert.equal(calls, 4);
    assert.equal(fs.existsSync(path.join(dir, '.next', 'cache', 'pokeapi')), false);
  });
});
