const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { render, screen, cleanup } = require('./setup-dom.cjs');

const filename = path.resolve(__dirname, '../components/Pokemon.tsx');
const loaded = new Module(filename, module);
loaded.filename = filename;
loaded.paths = Module._nodeModulePaths(path.dirname(filename));
const originalRequire = loaded.require.bind(loaded);
loaded.require = name => {
  if (name === './Types') return { __esModule: true, default: () => null };
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
const Pokemon = loaded.exports.default;

test('prioritizes the first visible sprite and keeps other card images lazy', () => {
  const types = [];
  const first = render(
    React.createElement(Pokemon, {
      image: '/first.png',
      text: 'BULBASAUR',
      types,
      priority: true,
    })
  );
  const firstImage = screen.getByRole('img');
  assert.equal(firstImage.getAttribute('loading'), 'eager');
  assert.equal(firstImage.getAttribute('fetchpriority'), 'high');
  first.unmount();

  render(React.createElement(Pokemon, { image: '/next.png', text: 'IVYSAUR', types }));
  const nextImage = screen.getByRole('img');
  assert.equal(nextImage.getAttribute('loading'), 'lazy');
  assert.equal(nextImage.getAttribute('fetchpriority'), 'auto');
  cleanup();
});
