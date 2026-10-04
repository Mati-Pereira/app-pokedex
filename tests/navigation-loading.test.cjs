const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { act, render, screen } = require('./setup-dom.cjs');
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
  const originals = { localStorage: global.localStorage };
  global.localStorage = { theme: 'light' };
  function Page() { return React.createElement('p', null, 'Current page'); }
  try {
    const view = render(React.createElement(App, { Component: Page, pageProps: {} }));
    await screen.findByText('Current page');
    for (const end of ['routeChangeComplete', 'routeChangeError']) {
      act(() => listeners.get('routeChangeStart')('/pikachu', { shallow: false }));
      assert.equal(screen.getByRole('status').textContent, 'Carregando página...');
      assert.ok(screen.getByText('Current page'));
      act(() => listeners.get(end)(...(end === 'routeChangeError' ? [new Error('Cancelled')] : [])));
      assert.equal(screen.queryByRole('status'), null);
    }
    act(() => listeners.get('routeChangeStart')('/?page=2', { shallow: true }));
    assert.equal(screen.queryByRole('status'), null);
    view.unmount();
    assert.equal(listeners.size, 0);
  } finally {
    Object.assign(global, originals);
  }
});
