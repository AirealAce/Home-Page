// @vitest-environment node
import { it, expect, beforeAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import initSqlJs from "sql.js";
import { zipSync, strToU8 } from "fflate";
import { parsePackage } from "../src/services/apkgCore";
import { BUNDLED_DECKS } from "../src/data/bundledDecks";
const require = createRequire(import.meta.url);
let SQL;
beforeAll(async () => {
  SQL = await initSqlJs({
    wasmBinary: fs.readFileSync(require.resolve("sql.js/dist/sql-wasm.wasm")),
  });
});
function fixture() {
  const db = new SQL.Database();
  db.run(
    "CREATE TABLE col(models TEXT,decks TEXT);CREATE TABLE notes(id INTEGER,mid INTEGER,flds TEXT,tags TEXT);CREATE TABLE cards(id INTEGER,nid INTEGER,did INTEGER,ord INTEGER);",
  );
  db.run("INSERT INTO col VALUES (?,?)", [
    JSON.stringify({
      1: {
        type: 0,
        flds: [{ name: "Front" }, { name: "Back" }],
        tmpls: [{ qfmt: "{{Front}}", afmt: "{{FrontSide}}<hr>{{Back}}" }],
      },
    }),
    JSON.stringify({ 2: { name: "Importer test" } }),
  ]);
  db.run("INSERT INTO notes VALUES(1,1,?,?)", [
    'What shape is shown?<img src="shape.png" alt="A black square">\x1fA square. [sound:tone.wav]',
    "",
  ]);
  db.run("INSERT INTO notes VALUES(2,1,?,?)", [
    "What is two plus two?\x1fFour.",
    "",
  ]);
  db.run("INSERT INTO cards VALUES(11,1,2,0),(12,2,2,0)");
  const wav = Buffer.alloc(844);
  wav.write("RIFF", 0);
  wav.writeUInt32LE(836, 4);
  wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(8000, 24);
  wav.writeUInt32LE(8000, 28);
  wav.writeUInt16LE(1, 32);
  wav.writeUInt16LE(8, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(800, 40);
  for (let i = 0; i < 800; i++)
    wav[44 + i] =
      128 + Math.round(20 * Math.sin((i * 2 * Math.PI * 440) / 8000));
  const archive = zipSync({
    "collection.anki21": db.export(),
    "collection.anki2": strToU8("placeholder"),
    media: strToU8(JSON.stringify({ 0: "shape.png", 1: "tone.wav" })),
    0: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==",
      "base64",
    ),
    1: wav,
  });
  db.close();
  return archive;
}
it("reads actual anki21 instead of anki2 placeholder and preserves package media", () => {
  const data = fixture(),
    result = parsePackage(data, SQL, "test");
  expect(result.decks[0].cards).toHaveLength(2);
  expect(result.decks[0].cards[0].back).toContain("A square");
  expect(result.decks[0].media["tone.wav"].type).toBe("audio/wav");
  expect(result.warnings).toEqual([]);
  if (process.env.WRITE_TEST_FIXTURE)
    fs.writeFileSync(process.env.WRITE_TEST_FIXTURE, data);
});
it("gives actionable errors for newer compressed and invalid packages", () => {
  expect(() =>
    parsePackage(zipSync({ "collection.anki21b": strToU8("new") }), SQL, "x"),
  ).toThrow("Support older Anki versions");
  expect(() => parsePackage(zipSync({ x: strToU8("bad") }), SQL, "x")).toThrow(
    "No Anki collection",
  );
});
it("ships all six public packages with matching identities, 432 cards, and their media", () => {
  let total = 0;
  let mediaCount = 0;
  expect(BUNDLED_DECKS).toHaveLength(6);
  for (const entry of BUNDLED_DECKS) {
    const bytes = fs.readFileSync(
      path.join(import.meta.dirname, "../public/decks", entry.fileName),
    );
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(
      entry.packageId,
    );
    const result = parsePackage(bytes, SQL, entry.packageId);
    expect(result.warnings).toEqual([]);
    expect(result.decks).toHaveLength(1);
    expect(result.decks[0].name).toBe(entry.name);
    expect(result.decks[0].cards).toHaveLength(entry.cardCount);
    total += result.decks[0].cards.length;
    mediaCount += Object.keys(result.decks[0].media).length;
    expect(result.decks[0].cards[0].front).not.toContain("requires a newer");
  }
  expect(total).toBe(432);
  expect(mediaCount).toBe(3);
});
