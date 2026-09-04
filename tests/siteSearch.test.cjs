const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

// Use the project's TypeScript compiler without adding a test-runtime dependency.
require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  });
  module._compile(outputText, filename);
};

const { projectCards, writingCards, siteSections, entryId } = require('../src/data/siteContent.ts');
const { createSearchEntries, parseSearchQuery, getSearchResults, getEnterAction } = require('../src/utils/siteSearch.ts');
const entries = createSearchEntries(projectCards, writingCards);
const search = query => getSearchResults(parseSearchQuery(query), entries);

test('indexes every content button with a unique rendered target ID', () => {
  assert.equal(entries.length, 27);
  assert.equal(new Set(entries.map(entry => entry.id)).size, entries.length);
  for (const card of projectCards) {
    for (const link of card.links) {
      assert.ok(entries.some(entry => entry.id === entryId('projects', card.id, link.id)));
    }
  }
  assert.equal(search('t ha')[0].entry.text, 'Habit Hall');
  assert.equal(search('t ha')[0].entry.cardTitle, 'Websites');
  assert.equal(search('t ha')[0].entry.sectionTitle, 'Projects');
});

test('matches label fragments case-insensitively and ranks exact labels first', () => {
  assert.equal(search('  hABIt   HALL ')[0].entry.text, 'Habit Hall');
  assert.equal(search('flashcards')[0].entry.text, 'Flashcards');
  assert.equal(search('flash 2')[0].entry.text, 'Flashcards 2');
  assert.deepEqual(search('does-not-exist'), []);
});

test('normal searches exclude section names, card headings, and non-content controls', () => {
  for (const query of ['Websites', 'Writings', 'Twitter', 'animations', 'LAYOUT']) {
    assert.deepEqual(search(query), []);
  }
});

test('section prefix offers only section suggestions until a section is resolved', () => {
  assert.deepEqual(search('section:').map(result => result.section.id), siteSections.map(section => section.id));
  assert.deepEqual(search('section: wr').map(result => result.section.id), ['writings']);
  assert.deepEqual(search('section: missing'), []);
  assert.equal(search('section: {pro')[0].section.id, 'profile');
});

test('section filters accept plain, braced, and quoted names', () => {
  for (const query of ['section: projects', ' SECTION : PROJECTS ', 'section: {Projects}', 'section: "Projects"', "section: 'Projects'"]) {
    const parsed = parseSearchQuery(query);
    assert.equal(parsed.section.id, 'projects');
    assert.equal(parsed.query, '');
    assert.equal(getSearchResults(parsed, entries).length, entries.length);
  }
  assert.equal(search('section: Projects t ha')[0].entry.text, 'Habit Hall');
  assert.equal(search('section: {Projects} flash 2')[0].entry.text, 'Flashcards 2');
  assert.deepEqual(search('section: Writings'), []);
  assert.deepEqual(search('section: About habit'), []);
});

test('indexes the correct carousel page for buttons that are initially hidden', () => {
  assert.equal(search('Demo Game')[0].entry.linkPage, 1);
  assert.equal(search('Preneur Manure')[0].entry.linkPage, 2);
  assert.equal(search('Project 0')[0].entry.linkPage, 0);
});

test('new writing links, including the fourth card, join the same index automatically', () => {
  const futureWritings = writingCards.map((card, index) => ({
    ...card,
    links: [{ id: `note-${index}`, text: index === 3 ? '日本語のノート' : `Reading Note ${index}`, href: '/note' }]
  }));
  const futureEntries = createSearchEntries(projectCards, futureWritings);
  const results = getSearchResults(parseSearchQuery('section: Writings'), futureEntries);
  assert.equal(results.length, 4);
  assert.ok(results.every(result => result.entry.sectionId === 'writings'));
  const japanese = getSearchResults(parseSearchQuery('日本語'), futureEntries)[0].entry;
  assert.equal(japanese.cardTitle, '日本語');
  assert.equal(japanese.cardPage, 1);
  assert.equal(japanese.id, entryId('writings', 'japanese', 'note-3'));
});

test('Enter first selects a partial section as a filter, then locates the exact section', () => {
  const partial = parseSearchQuery('section: proj');
  const selected = getEnterAction(partial, getSearchResults(partial, entries), -1);
  assert.equal(selected.kind, 'section');
  assert.equal(selected.section.id, 'projects');

  const exact = parseSearchQuery(`section: ${selected.section.title} `);
  const results = getSearchResults(exact, entries);
  assert.equal(getEnterAction(exact, results, -1).kind, 'locate-section');
  assert.equal(getEnterAction(exact, results, 0).kind, 'entry');
  assert.equal(getEnterAction(exact, results, 1).entry.text, 'Insert Sight');
});

test('Enter locates the first matching button, selected button, or an empty section', () => {
  const parsed = parseSearchQuery('flashcards');
  const results = getSearchResults(parsed, entries);
  assert.equal(getEnterAction(parsed, results, -1).entry.text, 'Flashcards');
  assert.equal(getEnterAction(parsed, results, 1).entry.text, 'Flashcards 2');
  assert.equal(getEnterAction(parseSearchQuery('section: Writings'), [], -1).section.id, 'writings');
  assert.equal(getEnterAction(parseSearchQuery('no match'), [], -1), undefined);
});

test('actual links use the shared IDs and focus only after pagination commits', () => {
  const source = readFileSync(path.join(__dirname, '../src/app/page.tsx'), 'utf8');
  assert.ok(source.includes("id={entryId('projects', card.id, link.id)}"));
  assert.ok(source.includes("id={entryId('writings', card.id, link.id)}"));
  assert.ok(source.includes('setWritingsPage(entry.cardPage)'));
  assert.ok(source.includes('[entry.cardId]: entry.linkPage'));
  assert.ok(source.includes('target.focus({ preventScroll: true })'));
  assert.ok(source.includes('target.scrollIntoView('));
});
