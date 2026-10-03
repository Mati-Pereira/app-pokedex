const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { create, act } = require('react-test-renderer');
const listeners = new Map();
const events = {
  on(name, callback) { listeners.set(name, callback); },
  off(name, callback) { if (listeners.get(name) === callback) listeners.delete(name); },
};
const filename = path.resolve(__dirname, '../pages/_app.tsx');
const loaded = new Module(filename, module);
loaded.filename = filename;
loaded.paths = Module._nodeModulePaths(path.dirname(filename));
const originalRequire = loaded.require.bind(loaded);
loaded.require = name => {
  if (name === 'next/router') return { useRouter: () => ({ events }) };
  if (name === '../components/Navbar') return { __esModule: true, default: () => null };
  if (name === '../context/InputPokemon') return { ContextInput: ({ children }) => children };
  if (name === '../styles/globals.css') return {};
  if (name === '@uiball/loaders') return { Waveform: () => null };
  return originalRequire(name);
};
loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText, filename);
const App = loaded.exports.default;
test('navigation shows immediate feedback, preserves the page, and clears on completion or error', async () => {
  const originals = { localStorage: global.localStorage, document: global.document, setTimeout: global.setTimeout };
  global.localStorage = { theme: 'light' };
  global.document = { documentElement: { classList: { add() {}, remove() {} } } };
  global.setTimeout = callback => { callback(); return 0; };
  let tree;
  function Page() { return React.createElement('p', null, 'Current page'); }
  try {
    await act(async () => { tree = create(React.createElement(App, { Component: Page, pageProps: {} })); });
    for (const end of ['routeChangeComplete', 'routeChangeError']) {
      act(() => listeners.get('routeChangeStart')('/pikachu', { shallow: false }));
      assert.equal(tree.root.findByProps({ role: 'status' }).findByType('p').props.children, 'Loading...');
      assert.equal(tree.root.findAllByType(Page).length, 1);
      act(() => listeners.get(end)(...(end === 'routeChangeError' ? [new Error('Cancelled')] : [])));
      assert.equal(tree.root.findAllByProps({ role: 'status' }).length, 0);
    }
    act(() => listeners.get('routeChangeStart')('/?page=2', { shallow: true }));
    assert.equal(tree.root.findAllByProps({ role: 'status' }).length, 0);
    act(() => tree.unmount());
    tree = null;
    assert.equal(listeners.size, 0);
  } finally {
    if (tree) act(() => tree.unmount());
    Object.assign(global, originals);
  }
});
