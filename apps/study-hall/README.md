# Study Hall

A small, accessible Anki study app built with React, Vite, semantic HTML, and IndexedDB. No account, backend, Supabase setup, or environment variables are needed.

## Run locally

Use Node.js 22 or newer:

```sh
npm install
npm run dev
```

`npm test` runs the parser, content-safety, template, and study-engine tests. `npm run build` produces `dist/`; `npm run preview` serves that production build. The lockfile makes `npm ci` available for repeatable installs.

## Import and study

Choose **Import Anki Deck**, or use the labeled file picker. Multiple `.apkg` files can be selected together. Imports run in a Web Worker: fflate expands the package, SQL.js reads the embedded SQLite database, and the Anki model templates turn notes into cards. `collection.anki21` takes precedence over the compatibility placeholder in `collection.anki2`. Imported cards are never hard-coded into the app.

Text, lists, tables, package images, and `[sound:filename]`/HTML audio are supported. Package media is stored as Blobs in IndexedDB and displayed through temporary object URLs. Imported scripts and styles are removed; remote media is not fetched. An image without original alternative text gets an explicit missing-description notice, not an invented description. Browser-supported audio formats can be replayed, stopped, or optionally autoplayed.

Select a deck, recall the answer, reveal it, and choose Again, Hard, Good, or Easy. Again moves the card to the end of the queue. Hard, Good, and Easy complete the card. A session ends when all cards have succeeded. The score is the rounded percentage completed on the first attempt; the other totals and the semantic results table show every response separately.

Decks, preferences, the most recent unfinished session, last selected deck, and completed results stay in this browser. Reloading preserves the session, including whether its answer was revealed. Return to the library to resume it. Starting a different deck replaces the single paused session. Clearing site data removes saved data. Keep the original `.apkg` files. Different devices, browsers, profiles, and site domains have separate libraries. Use one study tab at a time.

## Keyboard and screen readers

- Every action has a native button; all functionality works without hotkeys.
- Shortcuts are **off by default**. Enable or remap them in **Keyboard & settings**.
- With shortcuts enabled and the study content focused: Space/Enter reveals; 1 Again, 2 Hard, 3 Good, 4 Easy; R replays available audio.
- Character shortcuts do not run in form controls, links, buttons, editable areas, or dialogs. Modifier combinations, composition, and key repeats are left alone.
- JAWS/NVDA browse mode can intercept character keys. Native buttons work in browse mode. To send optional shortcuts to the page, use your screen reader’s forms/focus mode. The page does not force `role="application"`.
- Starting or rating a card focuses its question group, with the card number as its name and the question as its description. Reveal focuses the answer group. Finishing focuses the results heading with the score. The dialog uses native modal behavior and restores its trigger’s focus.
- A skip link, headings, landmarks, labeled progress, visible focus indicators, and real table headers support navigation. The results table scrolls horizontally at narrow widths; the rest of the interface reflows. Reduced-motion and forced-color preferences are supported.

The workflow was inspected in Chrome with native accessibility-tree output and keyboard actions. This is **not a claim of completed live JAWS/NVDA testing or WCAG certification**. A final pass with the user’s actual screen reader is still valuable, particularly for long rich-text answers and image descriptions supplied by deck authors.

## Supported formats and limits

Basic, reversed, optional-reversed, standard Cloze, common field conditionals, and text/type filters are supported. Type-answer templates use self-assessment instead of a typing comparison. Template CSS is intentionally removed to preserve readable contrast.

Newer compressed `collection.anki21b` exports, nested Cloze, image-occlusion templates, custom Anki add-ons/filters, scripts, text-to-speech directives, video, and rendered LaTeX are outside this MVP. Unsupported packages get an actionable error; unsupported/empty cards are skipped with a count. Re-export in Anki with **Support older Anki versions** and media included. Limits are 100 MB compressed, 250 MB expanded, 25,000 cards, and a 60-second import timeout. Reimporting the identical package does not duplicate its decks; changed exports are treated as new packages.

This is a session-based learning queue, not Anki’s long-term scheduler or AnkiWeb sync. It does not evaluate factual answers. Card content has not been checked for current exam accuracy. Fonts are requested from Google Fonts, with readable system fallbacks; deck content is not transmitted. There is no service-worker/offline-install feature.

## Architecture and future Supabase

- `src/services/apkgCore.js`, `apkgParser.js`, `apkg.worker.js`, `templates.js`: package parsing and card generation.
- `cardContent.js`: safe, readable content and package-media rendering.
- `studyEngine.js`: pure queue, rating, and statistics functions; independent of React and persistence.
- `storageService.js`: asynchronous storage boundary (`listDecks`, `saveDecks`, `getSetting`, `setSetting`, `listResults`, `saveResult`).
- `audioService.js`: playback and cancellation.
- `src/components`: deck library, study workflow, results, and settings dialog.

A future `supabaseStorageService` should implement the same asynchronous methods, with a user-scoped data model and Blob/media handling. Inject it where `App.jsx` currently imports `storageService`. Authentication and synchronization can be added without changing queue/statistics logic or the study components. No credentials belong in the bundle.

## Home-page deployment

In `AirealAce/Home-Page`, this source lives in `apps/study-hall`. The root build installs the app’s locked dependencies, builds it with base `/study-hall/` into `public/study-hall`, then runs the existing Next.js static export. The generated files are ignored in Git. Cloudflare Pages serves the app at `https://aaronmills.co/study-hall/` (and the other domains on that same Pages project). The home-page link is in **Projects → Websites**, and the existing search index includes it automatically. No Cloudflare database or new service is needed.

## Validation

The six supplied CPACC packages were imported in the browser and parser tests: Categories 159, Demographics 19, Laws 40, Quiz 106, Theoretical Models 27, Universal Design 81 — **432 cards**, with three packaged images. These personal input files are not distributed with the application.

For the optional integration test, set `CPACC_DECK_DIR` to the folder containing those packages before `npm test`. Without it, only that local-fixture test is skipped. A generated two-card fixture tests audio, image rendering, Again requeueing, a 50% first-attempt result, and complete per-card statistics in the browser.

References: [Anki export options](https://docs.ankiweb.net/exporting.html), [SQL.js](https://github.com/sql-js/sql.js), [W3C character-key shortcut guidance](https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts), [Cloudflare build image configuration](https://developers.cloudflare.com/pages/configuration/build-image/).
