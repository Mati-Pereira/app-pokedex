const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { act, createEvent, fireEvent, render, screen, waitFor } = require('./setup-dom.cjs');
const { clearPokeApiCacheForTests } = require('../lib/usePokeApi.ts');

const navigations = [];
let pushResult = () => Promise.resolve(true);
const router = {
  isReady: true,
  pathname: '/',
  query: {},
  push: url => {
    navigations.push(url);
    return pushResult();
  },
};
const context = React.createContext({ updateInput() {} });
function MockSelect(props) {
  const [localValue, setLocalValue] = React.useState('');
  const [menuOpen, setMenuOpen] = React.useState(false);
  const selected = props.value === undefined ? localValue : (props.value?.value ?? '');
  const choose = event => {
    const option = { value: event.target.value, label: event.target.value };
    setLocalValue(option.value);
    props.onChange(option);
  };
  return React.createElement(
    'div',
    null,
    React.createElement('input', {
      'aria-label': props['aria-label'],
      'data-testid': props.instanceId,
      value: selected,
      onFocus: props.onFocus,
      onChange: choose,
      onKeyDown: props.onKeyDown,
    }),
    React.createElement(
      'button',
      {
        type: 'button',
        'aria-label': `${props.instanceId} ${menuOpen ? 'close' : 'open'} options`,
        onClick: () => {
          if (menuOpen) props.onMenuClose();
          else props.onMenuOpen();
          setMenuOpen(!menuOpen);
        },
      },
      menuOpen ? 'Close options' : 'Open options'
    ),
    selected &&
      React.createElement(
        'button',
        {
          type: 'button',
          'aria-label': `Limpar ${props.instanceId}`,
          onClick: () => {
            setLocalValue('');
            props.onChange(null);
          },
        },
        'Limpar seleção'
      )
  );
}
function load(relative) {
  const filename = path.resolve(__dirname, '..', relative);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  const originalRequire = loaded.require.bind(loaded);
  loaded.require = name => {
    if (name === 'next/router') return { useRouter: () => router };
    if (name === 'next/link') return { __esModule: true, default: ({ children }) => children };
    if (name === 'react-select')
      return {
        __esModule: true,
        default: MockSelect,
        components: {},
        createFilter: () => () => true,
      };
    if (name === '../context/InputPokemon') return { InputContext: context };
    if (name === './Toggle') return { __esModule: true, default: () => null };
    if (name === './SearchField') return load('components/SearchField.tsx');
    return originalRequire(name);
  };
  loaded._compile(compiled, filename);
  return loaded.exports;
}
const Navbar = load('components/Navbar.tsx').default;

function press(input, key, composing = false) {
  const event = createEvent.keyDown(input, { key });
  Object.defineProperty(event, 'isComposing', { value: composing });
  fireEvent(input, event);
  return event;
}

for (const [index, label, first, second, expected] of [
  [0, 'name', 'pikachu', 'bulbasaur', '/bulbasaur'],
  [1, 'type', 'fire', 'water', '/types?type=water'],
]) {
  test(`${label} search preserves selection keys and submits only a valid closed-menu Enter or button`, async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => ({ ok: true, json: async () => ({ results: [] }) });
    navigations.length = 0;
    let view;
    try {
      view = render(React.createElement(Navbar));
      const input = screen.getByTestId(index === 0 ? 'pokemon-name' : 'pokemon-type');
      const button = () =>
        screen.getByRole('button', {
          name: index === 0 ? 'Buscar: nome do Pokémon' : 'Buscar: tipo do Pokémon',
        });

      assert.equal(press(input, 'Enter').defaultPrevented, false);
      fireEvent.click(button());
      assert.deepEqual(navigations, []);

      fireEvent.change(input, { target: { value: first } });
      for (const key of ['b', 'ArrowDown', 'ArrowUp', 'Backspace', 'Escape', 'Tab']) {
        assert.equal(press(input, key).defaultPrevented, false);
      }
      assert.deepEqual(navigations, []);

      fireEvent.click(
        screen.getByRole('button', {
          name: `${index === 0 ? 'pokemon-name' : 'pokemon-type'} open options`,
        })
      );
      assert.equal(press(input, 'Enter').defaultPrevented, false);
      assert.deepEqual(
        navigations,
        [],
        'Enter must allow the select to choose the highlighted option'
      );
      fireEvent.change(input, { target: { value: second } });
      fireEvent.click(
        screen.getByRole('button', {
          name: `${index === 0 ? 'pokemon-name' : 'pokemon-type'} close options`,
        })
      );
      assert.equal(press(input, 'Enter', true).defaultPrevented, false);
      assert.deepEqual(navigations, [], 'IME composition must not submit a search');
      assert.equal(press(input, 'Enter').defaultPrevented, true);
      assert.deepEqual(navigations, [expected]);
      await waitFor(() => assert.equal(button().getAttribute('aria-busy'), 'false'));
      fireEvent.click(button());
      await waitFor(() => assert.deepEqual(navigations, [expected, expected]));
      assert.deepEqual(navigations, [expected, expected]);
    } finally {
      if (view) view.unmount();
      global.fetch = originalFetch;
    }
  });
}

for (const [index, label] of [
  [0, 'name'],
  [1, 'type'],
]) {
  for (const outcome of ['success', 'false', 'cancelled', 'error']) {
    test(`${label} search keeps loading while pending and recovers after ${outcome}`, async () => {
      const originalFetch = global.fetch;
      global.fetch = async () => ({ ok: true, json: async () => ({ results: [] }) });
      let resolveNavigation;
      let rejectNavigation;
      pushResult = () =>
        new Promise((resolve, reject) => {
          resolveNavigation = resolve;
          rejectNavigation = reject;
        });
      navigations.length = 0;
      let view;
      try {
        view = render(React.createElement(Navbar));
        const inputs = [screen.getByTestId('pokemon-name'), screen.getByTestId('pokemon-type')];
        const buttons = [
          screen.getByRole('button', { name: 'Buscar: nome do Pokémon' }),
          screen.getByRole('button', { name: 'Buscar: tipo do Pokémon' }),
        ];
        fireEvent.change(inputs[0], { target: { value: 'pikachu' } });
        fireEvent.change(inputs[1], { target: { value: 'fire' } });
        fireEvent.click(buttons[index]);
        await waitFor(() => assert.equal(buttons[index].getAttribute('aria-busy'), 'true'));
        assert.equal(buttons[1 - index].getAttribute('aria-busy'), 'false');
        assert.equal(buttons[0].disabled, true);
        assert.equal(buttons[1].disabled, true);
        fireEvent.click(buttons[index]);
        fireEvent.click(buttons[1 - index]);
        press(inputs[index], 'Enter');
        assert.equal(
          navigations.length,
          1,
          'pending navigation must block duplicate and competing searches'
        );
        // An event-loop turn must not clear loading while router.push is unresolved.
        await act(async () => {
          await new Promise(setImmediate);
        });
        assert.equal(buttons[index].getAttribute('aria-busy'), 'true');
        await act(async () => {
          if (outcome === 'success') resolveNavigation(true);
          if (outcome === 'false') resolveNavigation(false);
          if (outcome === 'cancelled')
            rejectNavigation(Object.assign(new Error('Cancelled'), { cancelled: true }));
          if (outcome === 'error') rejectNavigation(new Error('Navigation failed'));
          await new Promise(setImmediate);
        });
        await waitFor(() => assert.equal(buttons[index].getAttribute('aria-busy'), 'false'));
        assert.equal(buttons[0].disabled, false);
        assert.equal(buttons[1].disabled, false);
        assert.equal(screen.queryAllByRole('alert').length, outcome === 'error' ? 1 : 0);
        pushResult = () => Promise.resolve(true);
        fireEvent.click(buttons[index]);
        await waitFor(() => assert.equal(navigations.length, 2));
        assert.equal(navigations.length, 2, 'a new search must work after completion or failure');
        assert.equal(screen.queryAllByRole('alert').length, 0);
      } finally {
        if (view) view.unmount();
        global.fetch = originalFetch;
        pushResult = () => Promise.resolve(true);
      }
    });
  }
}

test('type selection follows URL changes and submits the restored value', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({ ok: true, json: async () => ({ results: [] }) });
  router.pathname = '/types';
  router.query = { type: 'fire' };
  navigations.length = 0;
  let view;
  try {
    view = render(React.createElement(Navbar));
    const input = screen.getByTestId('pokemon-type');
    await waitFor(() => assert.equal(input.value, 'fire'));
    router.query = { type: 'water' };
    view.rerender(React.createElement(Navbar));
    await waitFor(() => assert.equal(input.value, 'water'));
    fireEvent.click(screen.getByRole('button', { name: 'Buscar: tipo do Pokémon' }));
    await waitFor(() => assert.deepEqual(navigations, ['/types?type=water']));
    assert.deepEqual(navigations, ['/types?type=water']);
    router.query = { type: 'unknown' };
    view.rerender(React.createElement(Navbar));
    await waitFor(() => assert.equal(input.value, ''));
  } finally {
    if (view) view.unmount();
    router.pathname = '/';
    router.query = {};
    global.fetch = originalFetch;
  }
});

test('clearing a selected name disables its search and clearing a type returns to the catalog', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({ ok: true, json: async () => ({ results: [] }) });
  router.pathname = '/types';
  router.query = { type: 'fire' };
  navigations.length = 0;
  let view;
  try {
    view = render(React.createElement(Navbar));
    await waitFor(() => assert.equal(screen.getByTestId('pokemon-type').value, 'fire'));
    fireEvent.click(screen.getByRole('button', { name: 'Limpar pokemon-type' }));
    await waitFor(() => assert.deepEqual(navigations, ['/']));

    const nameInput = screen.getByTestId('pokemon-name');
    fireEvent.change(nameInput, { target: { value: 'pikachu' } });
    const nameSearch = screen.getByRole('button', { name: 'Buscar: nome do Pokémon' });
    assert.equal(nameSearch.disabled, false);
    fireEvent.click(screen.getByRole('button', { name: 'Limpar pokemon-name' }));
    await waitFor(() => assert.equal(nameSearch.disabled, true));
    assert.equal(nameInput.value, '');
  } finally {
    if (view) view.unmount();
    router.pathname = '/';
    router.query = {};
    global.fetch = originalFetch;
  }
});

test('name options load on focus without a duplicate request from the idle prefetch', async () => {
  const originalFetch = global.fetch;
  const requestedUrls = [];
  clearPokeApiCacheForTests();
  global.fetch = async url => {
    requestedUrls.push(url);
    return { ok: true, status: 200, json: async () => ({ results: [{ name: 'pikachu' }] }) };
  };
  let view;
  try {
    view = render(React.createElement(Navbar));
    assert.deepEqual(requestedUrls, []);
    fireEvent.focus(screen.getByTestId('pokemon-name'));
    await waitFor(() => assert.equal(requestedUrls.length, 1));
    assert.equal(requestedUrls[0], 'https://pokeapi.co/api/v2/pokemon?limit=100000&offset=0');
    await act(async () => {
      await new Promise(resolve => global.setTimeout(resolve, 350));
    });
    assert.equal(requestedUrls.length, 1);
  } finally {
    if (view) view.unmount();
    global.fetch = originalFetch;
  }
});
