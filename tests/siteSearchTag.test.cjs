const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { createRequire } = require('node:module');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText, filename);
};

const { projectCards, writingCards } = require('../src/data/siteContent.ts');
const { createSearchEntries } = require('../src/utils/siteSearch.ts');
const entries = createSearchEntries(projectCards, writingCards.map((card, index) => ({
  ...card, links: index === 0 ? [{ id: 'reading-note', text: 'Reading Note', href: '/reading-note' }] : []
})));
const componentPath = path.resolve(__dirname, '../src/components/SiteSearch.tsx');
const componentRequire = createRequire(componentPath);
const { outputText } = ts.transpileModule(readFileSync(componentPath, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 }
});

// Exercise the component's real event handlers and state transitions without a
// browser or an additional UI-test dependency. Effects are not needed for tags.
function mountSearch() {
  const state = [];
  let cursor = 0;
  let tree;
  let focusCount = 0;
  const locatedEntries = [];
  const locatedSections = [];
  const useState = initial => {
    const index = cursor++;
    if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
    return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
  };
  const jsx = (type, props) => ({ type, props });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    require: name => {
      if (name === 'react') return {
        useState, useRef: value => useState({ current: value })[0],
        useMemo: callback => callback(), useEffect() {}, useId: () => 'test-search'
      };
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
      if (name === '@fortawesome/react-fontawesome') return { FontAwesomeIcon: 'icon' };
      if (name === '@fortawesome/free-solid-svg-icons') return { faMagnifyingGlass: 'search', faXmark: 'remove' };
      return componentRequire(name);
    }
  });
  const nodes = node => {
    if (Array.isArray(node)) return node.flatMap(child => nodes(child));
    if (!node || typeof node !== 'object') return [];
    return [node, ...nodes(node.props?.children)];
  };
  const find = predicate => nodes(tree).find(predicate);
  const input = () => find(node => node.type === 'input');
  const render = () => {
    cursor = 0;
    tree = exports.SiteSearch({ entries, onLocateEntry: entry => locatedEntries.push(entry), onLocateSection: section => locatedSections.push(section) });
    input().props.ref.current = { focus: () => { focusCount += 1; } };
  };
  render();
  return {
    input, find, locatedEntries, locatedSections,
    get focusCount() { return focusCount; },
    tag: () => find(node => node.props?.className === 'site-search-section-tag'),
    options: () => nodes(tree).filter(node => node.props?.role === 'option'),
    change(value) { input().props.onChange({ target: { value } }); render(); },
    key(key) {
      let prevented = false;
      input().props.onKeyDown({ key, nativeEvent: { isComposing: false }, preventDefault: () => { prevented = true; } });
      render();
      return prevented;
    },
    click(node) { assert.ok(node, 'Expected clickable element'); node.props.onClick(); render(); },
    compositionStart() { input().props.onCompositionStart(); },
    compositionEnd(value) { input().props.onCompositionEnd({ currentTarget: { value } }); render(); }
  };
}

test('typing a complete section name waits for Space before creating a tag', () => {
  const search = mountSearch();
  for (const character of 'section: writings') {
    search.change(search.input().props.value + character);
    assert.equal(search.tag(), undefined);
  }
  assert.equal(search.input().props.value, 'section: writings');
  search.change(search.input().props.value + ' ');
  assert.equal(search.tag().props['aria-label'], 'Section filter: Writings');
  assert.equal(search.input().props.value, '');
  assert.equal(search.input().props['aria-label'], 'Search buttons in Writings');
  assert.equal(search.options().length, 1);
});

test('quoted and braced section names also need a following space', () => {
  for (const value of ['section: {Projects}', 'section: "Projects"', "section: 'Projects'"]) {
    const search = mountSearch();
    search.change(value);
    assert.equal(search.tag(), undefined);
    assert.equal(search.input().props.value, value);
    search.change(value + ' ');
    assert.equal(search.tag().props['aria-label'], 'Section filter: Projects');
  }
});

test('clicking a partial section suggestion creates the tag and keeps typing focused', () => {
  const search = mountSearch();
  search.change('section: wr');
  assert.equal(search.tag(), undefined);
  search.click(search.options()[0]);
  assert.equal(search.tag().props['aria-label'], 'Section filter: Writings');
  assert.equal(search.input().props.value, '');
  assert.equal(search.options().length, 1);
  assert.ok(search.focusCount > 0);
});

test('keyboard selection creates a tag; Enter alone still locates the section', () => {
  const search = mountSearch();
  search.change('section: proj');
  search.key('ArrowDown');
  search.key('Enter');
  assert.equal(search.tag().props['aria-label'], 'Section filter: Projects');
  assert.equal(search.locatedSections.length, 0);
  search.key('Enter');
  assert.equal(search.locatedSections[0].id, 'projects');
  assert.equal(search.locatedEntries.length, 0);
});

test('query beside a tag narrows results and Enter locates the selected button', () => {
  const search = mountSearch();
  search.change('section: Projects ');
  search.change('habit');
  assert.equal(search.options().length, 1);
  search.key('ArrowDown');
  search.key('Enter');
  assert.equal(search.locatedEntries[0].text, 'Habit Hall');
  assert.equal(search.tag().props['aria-label'], 'Section filter: Projects');
  assert.equal(search.input().props['aria-expanded'], false);
});

test('pasted filters preserve the trailing query; removing the tag keeps that text', () => {
  const search = mountSearch();
  search.change('section: {Projects} flash 2');
  assert.equal(search.input().props.value, 'flash 2');
  assert.equal(search.options().length, 1);
  search.click(search.find(node => node.props?.['aria-label'] === 'Remove Projects section filter'));
  assert.equal(search.tag(), undefined);
  assert.equal(search.input().props.value, 'flash 2');
});

test('Backspace removes the tag only when the adjacent text is empty', () => {
  const search = mountSearch();
  search.change('section: Projects habit');
  assert.equal(search.key('Backspace'), false);
  assert.ok(search.tag());
  search.change('');
  assert.equal(search.key('Backspace'), true);
  assert.equal(search.tag(), undefined);
  assert.equal(search.options().length, 28);
});

test('incomplete and unknown section names remain editable text', () => {
  const search = mountSearch();
  for (const value of ['section:', 'section: Pro', 'section: Not a section']) {
    search.change(value);
    assert.equal(search.tag(), undefined);
    assert.equal(search.input().props.value, value);
  }
});

test('IME composition is not interrupted by tag creation or Enter', () => {
  const search = mountSearch();
  search.compositionStart();
  search.change('section: Projects');
  assert.equal(search.tag(), undefined);
  assert.equal(search.key('Enter'), false);
  assert.equal(search.locatedSections.length, 0);
  search.compositionEnd('section: Projects');
  assert.equal(search.tag(), undefined);
  search.change('section: Projects ');
  assert.equal(search.tag().props['aria-label'], 'Section filter: Projects');
});

test('a new section query replaces the tag; clear-all removes both tag and text', () => {
  const search = mountSearch();
  search.change('section: Projects ');
  search.change('section: wr');
  search.click(search.options()[0]);
  assert.equal(search.tag().props['aria-label'], 'Section filter: Writings');
  search.change('note');
  search.click(search.find(node => node.props?.['aria-label'] === 'Clear search and section filter'));
  assert.equal(search.tag(), undefined);
  assert.equal(search.input().props.value, '');
  assert.equal(search.options().length, 28);
});
