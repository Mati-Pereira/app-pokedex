const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { create, act } = require('react-test-renderer');

const navigations = [];
const router = { push: (url) => { navigations.push(url); return Promise.resolve(true); } };
const context = React.createContext({ updateInput() {} });
function MockSelect() { return null; }
const filename = path.resolve(__dirname, '../components/Navbar.tsx');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const loaded = new Module(filename, module);
loaded.filename = filename;
loaded.paths = Module._nodeModulePaths(path.dirname(filename));
const originalRequire = loaded.require.bind(loaded);
loaded.require = (name) => {
  if (name === 'next/router') return { useRouter: () => router };
  if (name === 'next/link') return { __esModule: true, default: ({ children }) => children };
  if (name === 'react-windowed-select') return { __esModule: true, default: MockSelect, createFilter: () => () => true };
  if (name === '../context/InputPokemon') return { InputContext: context };
  if (name === './Toggle') return { __esModule: true, default: () => null };
  return originalRequire(name);
};
loaded._compile(compiled, filename);
const Navbar = loaded.exports.default;

function keyEvent(key, composing = false) {
  return { key, nativeEvent: { isComposing: composing }, defaultPrevented: false,
    preventDefault() { this.defaultPrevented = true; } };
}

for (const [index, label, first, second, expected] of [
  [0, 'name', 'pikachu', 'bulbasaur', '/bulbasaur'],
  [1, 'type', 'fire', 'water', '/types'],
]) {
  test(`${label} search preserves selection keys and submits only a valid closed-menu Enter or button`, async () => {
    const originalFetch = global.fetch;
    const originalTimeout = global.setTimeout;
    global.fetch = async () => ({ json: async () => ({ results: [] }) });
    global.setTimeout = (callback) => { callback(); return 0; };
    navigations.length = 0;
    let tree;
    try {
      await act(async () => { tree = create(React.createElement(Navbar)); });
      const select = () => tree.root.findAllByType(MockSelect)[index];
      const press = (key, composing) => {
        const event = keyEvent(key, composing);
        act(() => select().props.onKeyDown(event));
        return event;
      };
      const button = () => tree.root.findAllByType('button')[index];

      assert.equal(press('Enter').defaultPrevented, false);
      act(() => button().props.onClick());
      assert.deepEqual(navigations, []);

      act(() => select().props.onChange({ value: first, label: first }));
      for (const key of ['b', 'ArrowDown', 'ArrowUp', 'Backspace', 'Escape', 'Tab']) {
        assert.equal(press(key).defaultPrevented, false);
      }
      assert.deepEqual(navigations, []);

      act(() => select().props.onMenuOpen());
      assert.equal(press('Enter').defaultPrevented, false);
      assert.deepEqual(navigations, [], 'Enter must allow the select to choose the highlighted option');
      act(() => {
        select().props.onChange({ value: second, label: second });
        select().props.onMenuClose();
      });
      assert.equal(press('Enter', true).defaultPrevented, false);
      assert.deepEqual(navigations, [], 'IME composition must not submit a search');
      assert.equal(press('Enter').defaultPrevented, true);
      assert.deepEqual(navigations, [expected]);
      act(() => button().props.onClick());
      assert.deepEqual(navigations, [expected, expected]);
    } finally {
      if (tree) act(() => tree.unmount());
      global.fetch = originalFetch;
      global.setTimeout = originalTimeout;
    }
  });
}
