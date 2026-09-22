import { unzipSync, strFromU8 } from "fflate";
import { renderTemplate } from "./templates";
const MAX_EXPANDED = 250 * 1024 * 1024;
const typeFor = (name) =>
  ({
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    avif: "image/avif",
    mp3: "audio/mpeg",
    ogg: "audio/ogg",
    wav: "audio/wav",
    m4a: "audio/mp4",
    mp4: "video/mp4",
  })[name.split(".").pop().toLowerCase()] || "application/octet-stream";
export function parsePackage(bytes, SQL, packageId) {
  let size = 0;
  const archive = unzipSync(bytes, {
    filter: (entry) => {
      size += entry.originalSize;
      if (size > MAX_EXPANDED)
        throw new Error(
          "This package expands beyond the 250 MB import limit. Export a smaller deck.",
        );
      return true;
    },
  });
  if (archive["collection.anki21b"])
    throw new Error(
      "This newer Anki package uses a format not supported yet. In Anki, export again with “Support older Anki versions” enabled and include media.",
    );
  const data = archive["collection.anki21"] || archive["collection.anki2"];
  if (!data)
    throw new Error(
      "No Anki collection was found. Select an exported .apkg deck.",
    );
  const db = new SQL.Database(data);
  try {
    const row = db.exec("SELECT models, decks FROM col")[0]?.values[0];
    if (!row)
      throw new Error("This Anki database has no collection information.");
    const models = JSON.parse(row[0]),
      deckInfo = JSON.parse(row[1]);
    const mediaMap = archive.media ? JSON.parse(strFromU8(archive.media)) : {};
    const media = Object.create(null);
    const warnings = new Set();
    for (const [entry, name] of Object.entries(mediaMap)) {
      if (typeof name !== "string") continue;
      if (archive[entry])
        media[name] = new Blob([archive[entry]], { type: typeFor(name) });
      else
        warnings.add(
          "Some referenced media files are missing from the package.",
        );
    }
    const rows =
      db.exec(
        "SELECT CAST(c.id AS TEXT), CAST(c.did AS TEXT), c.ord, CAST(n.mid AS TEXT), n.flds, n.tags FROM cards c JOIN notes n ON c.nid=n.id ORDER BY c.id",
      )[0]?.values || [];
    if (rows.length > 25000)
      throw new Error(
        "This deck has more than 25,000 cards. Export smaller decks to study here.",
      );
    const groups = new Map();
    let skipped = 0;
    for (const [id, did, ordinal, mid, values, tags] of rows) {
      const model = models[mid];
      const name = deckInfo[did]?.name || "Imported deck";
      if (!model || ![0, 1].includes(model.type)) {
        skipped++;
        continue;
      }
      const template = model.tmpls[model.type === 1 ? 0 : ordinal];
      if (!template) {
        skipped++;
        continue;
      }
      try {
        const fieldValues = values.split("\x1f");
        const fields = Object.fromEntries(
          model.flds.map((f, i) => [f.name, fieldValues[i] || ""]),
        );
        if (
          Object.values(fields).some((v) =>
            v.includes("This file requires a newer version of Anki."),
          )
        )
          throw new Error("Compatibility placeholder");
        const options = { ordinal, deckName: name, tags };
        const front = renderTemplate(template.qfmt, fields, {
          ...options,
          side: "front",
        });
        const back = renderTemplate(template.afmt, fields, {
          ...options,
          side: "back",
        });
        if (!front.trim()) {
          skipped++;
          continue;
        }
        if (!groups.has(did))
          groups.set(did, {
            id: `${packageId}:${did}`,
            packageId,
            name,
            cards: [],
            media,
            importedAt: Date.now(),
          });
        groups.get(did).cards.push({ id, front, back });
        if (/<script|{{tts|\[latex\]|\[\$/.test(front + back))
          warnings.add(
            "Scripts, text-to-speech templates, and rendered LaTeX are not supported.",
          );
      } catch {
        skipped++;
      }
    }
    if (!groups.size)
      throw new Error(
        "No supported cards were found. Export a Basic or Cloze deck with “Support older Anki versions” enabled.",
      );
    if (skipped)
      warnings.add(
        `${skipped} unsupported or empty cards were skipped. Basic, reversed, and standard Cloze cards are supported.`,
      );
    return { decks: [...groups.values()], warnings: [...warnings] };
  } finally {
    db.close();
  }
}
