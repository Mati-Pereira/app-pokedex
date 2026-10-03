const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { create, act } = require('react-test-renderer');

const navigations = [];
let pushResult = () => Promise.resolve(true);
const router = { push: (url) => { navigations.push(url); return pushResult(); } };
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
      act(() => { button().props.onClick(); });
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
      await act(async () => {});
      await act(async () => { await button().props.onClick(); });
      assert.deepEqual(navigations, [expected, expected]);
    } finally {
      if (tree) act(() => tree.unmount());
      global.fetch = originalFetch;
      global.setTimeout = originalTimeout;
    }
  });
}

for (const [index, label] of [[0, 'name'], [1, 'type']]) {
  for (const outcome of ['success', 'false', 'cancelled', 'error']) {
    test(`${label} search keeps loading while pending and recovers after ${outcome}`, async () => {
      const originalFetch = global.fetch;
      global.fetch = async () => ({ json: async () => ({ results: [] }) });
      let resolveNavigation;
      let rejectNavigation;
      pushResult = () => new Promise((resolve, reject) => {
        resolveNavigation = resolve;
        rejectNavigation = reject;
      });
      navigations.length = 0;
      let tree;
      try {
        await act(async () => { tree = create(React.createElement(Navbar)); });
        const selects = () => tree.root.findAllByType(MockSelect);
        const buttons = () => tree.root.findAllByType('button');
        act(() => {
          selects()[0].props.onChange({ value: 'pikachu', label: 'pikachu' });
          selects()[1].props.onChange({ value: 'fire', label: 'fire' });
        });
        let pending;
        act(() => { pending = buttons()[index].props.onClick(); });
        assert.equal(buttons()[index].props['aria-busy'], true);
        assert.equal(buttons()[1 - index].props['aria-busy'], false);
        assert.equal(buttons()[0].props.disabled, true);
        assert.equal(buttons()[1].props.disabled, true);
        act(() => {
          buttons()[index].props.onClick();
          buttons()[1 - index].props.onClick();
          selects()[index].props.onKeyDown(keyEvent('Enter'));
        });
        assert.equal(navigations.length, 1, 'pending navigation must block duplicate and competing searches');
        // An event-loop turn must not clear loading while router.push is unresolved.
        await act(async () => { await new Promise(setImmediate); });
        assert.equal(buttons()[index].props['aria-busy'], true);
        await act(async () => {
          if (outcome === 'success') resolveNavigation(true);
          if (outcome === 'false') resolveNavigation(false);
          if (outcome === 'cancelled') rejectNavigation(Object.assign(new Error('Cancelled'), { cancelled: true }));
          if (outcome === 'error') rejectNavigation(new Error('Navigation failed'));
          await pending;
        });
        assert.equal(buttons()[index].props['aria-busy'], false);
        assert.equal(buttons()[0].props.disabled, false);
        assert.equal(buttons()[1].props.disabled, false);
        const alerts = tree.root.findAllByProps({ role: 'alert' });
        assert.equal(alerts.length, outcome === 'error' ? 1 : 0);
        pushResult = () => Promise.resolve(true);
        await act(async () => { await buttons()[index].props.onClick(); });
        assert.equal(navigations.length, 2, 'a new search must work after completion or failure');
        assert.equal(tree.root.findAllByProps({ role: 'alert' }).length, 0);
      } finally {
        if (tree) act(() => tree.unmount());
        global.fetch = originalFetch;
        pushResult = () => Promise.resolve(true);
      }
    });
  }
}
