const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const nextConfigModule = require('../next.config.js');
const { fireEvent, render, screen } = require('./setup-dom.cjs');
function load(relative) {
  const filename = path.resolve(__dirname, '..', relative);
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  const originalRequire = loaded.require.bind(loaded);
  loaded.require = name => name === 'next/document' ? { Html: 'html', Head: 'head', Main: 'main', NextScript: 'script' } : originalRequire(name);
  loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, filename);
  return loaded.exports.default;
}
const Document = load('pages/_document.tsx');
const Toggle = load('components/Toggle.tsx');
const nextConfig = fs.readFileSync(path.resolve(__dirname, '../next.config.js'), 'utf8');
const headChildren = React.Children.toArray(Document().props.children[0].props.children);
const faviconLink = headChildren.find(child => child.type === 'link' && child.props.rel === 'icon');
const themeInitializer = headChildren.find(child => child.type === 'script');
const script = themeInitializer.props.dangerouslySetInnerHTML.__html;

test('document includes the Pokeball SVG favicon', () => {
  assert.equal(faviconLink.props.href, '/favicon.svg');
  assert.equal(faviconLink.props.type, 'image/svg+xml');
  assert.match(fs.readFileSync(path.resolve(__dirname, '../public/favicon.svg'), 'utf8'), /<svg\b/);
});

test('document initializes the theme in the head before page content', () => {
  assert.equal(themeInitializer.type, 'script');
  assert.equal(themeInitializer.props.src, undefined);
});
test('CSP allows the exact static theme initializer by hash', () => {
  const hash = crypto.createHash('sha256').update(script).digest('base64');
  assert.ok(nextConfig.includes(`'sha256-${hash}'`));
});
test('production security headers are restrictive and HSTS is production-only on Vercel', async () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalVercelEnv = process.env.VERCEL_ENV;
  try {
    process.env.NODE_ENV = 'production';
    process.env.VERCEL_ENV = 'production';
    const productionHeaders = (await nextConfigModule.headers())[0].headers;
    const production = Object.fromEntries(productionHeaders.map(({ key, value }) => [key, value]));
    assert.match(production['Content-Security-Policy'], /default-src 'self'/);
    assert.match(production['Content-Security-Policy'], /frame-ancestors 'none'/);
    assert.equal(production['X-Content-Type-Options'], 'nosniff');
    assert.equal(production['X-Frame-Options'], 'DENY');
    assert.equal(production['Strict-Transport-Security'], 'max-age=31536000');

    process.env.VERCEL_ENV = 'preview';
    const previewHeaders = (await nextConfigModule.headers())[0].headers;
    assert.equal(
      previewHeaders.some(({ key }) => key === 'Strict-Transport-Security'),
      false
    );
  } finally {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    if (originalVercelEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = originalVercelEnv;
  }
});
test('initial theme honors saved preference before rendering and otherwise follows the system', () => {
  for (const [saved, system, expected] of [['dark', false, true], ['light', true, false], [null, true, true], [null, false, false]]) {
    let applied;
    vm.runInNewContext(script, {
      localStorage: { getItem: () => saved },
      window: { matchMedia: () => ({ matches: system }) },
      document: { documentElement: { classList: { toggle: (name, value) => { assert.equal(name, 'dark'); applied = value; } } } },
    });
    assert.equal(applied, expected);
  }
});
test('blocked storage does not interrupt initial document execution', () => {
  assert.doesNotThrow(() => vm.runInNewContext(script, { localStorage: { getItem() { throw new Error('Storage blocked'); } } }));
});
test('toggle reads the applied theme and switches even if storage cannot be written', () => {
  const originalStorage = global.localStorage;
  let saved;
  global.document.documentElement.classList.add('dark');
  global.localStorage = { setItem: (name, value) => { assert.equal(name, 'theme'); saved = value; } };
  try {
    render(React.createElement(Toggle));
    const toggle = screen.getByRole('button', { name: 'Alternar tema de cores' });
    fireEvent.click(toggle);
    assert.equal(global.document.documentElement.classList.contains('dark'), false);
    assert.equal(saved, 'light');
    fireEvent.click(toggle);
    assert.equal(global.document.documentElement.classList.contains('dark'), true);
    assert.equal(saved, 'dark');
    global.localStorage = { setItem() { throw new Error('Blocked'); } };
    fireEvent.click(toggle);
    assert.equal(global.document.documentElement.classList.contains('dark'), false);
  } finally {
    global.document.documentElement.classList.remove('dark');
    global.localStorage = originalStorage;
  }
});
