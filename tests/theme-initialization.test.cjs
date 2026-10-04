const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
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
const script = Document().props.children[0].props.children.props.dangerouslySetInnerHTML.__html;
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
    const toggle = screen.getByRole('button', { name: 'Color mode switch button' });
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
