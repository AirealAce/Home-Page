import { it, expect } from "vitest";
import { cardContent, questionText } from "../src/services/cardContent";
import { renderTemplate } from "../src/services/templates";
it("preserves question text and image descriptions in result rows", () => {
  expect(
    questionText(
      '<div>First line</div><div>Second line</div><img alt="A diagram" src="image.png">',
    ),
  ).toBe("First line Second line [Image: A diagram]");
});
it("preserves paragraphs, list items, table rows, and alternatives for line-by-line reading", () => {
  expect(
    questionText(
      '<p>One<br>Two</p><ul><li>Alpha</li><li>Beta</li></ul><img alt="Diagram" src="x">',
      { preserveLines: true },
    ),
  ).toBe("One\nTwo\n\n• Alpha\n\n• Beta\n[Image: Diagram]");
  expect(
    questionText(
      "<table><tr><th>Model</th><th>Example</th></tr><tr><td>Social</td><td>Barriers</td></tr></table>",
      { preserveLines: true },
    ),
  ).toBe("Model Example\n\nSocial Barriers");
  expect(
    questionText("<ol><li>First</li><li>Second</li></ol>", {
      preserveLines: true,
    }),
  ).toBe("1. First\n\n2. Second");
});
it("removes active markup, remote media, colors and event handlers", () => {
  const c = cardContent(
    '<script>alert(1)</script><img src="https://tracker.test/a" onerror="evil()"><span style="color:black" id="main">Readable</span><a href="javascript:evil()">Bad</a>',
  );
  expect(c.html).not.toMatch(/script|onerror|style=|id=|src=|href=/);
  expect(c.text).toContain("Readable");
});
it("resolves package images and extracts replay audio without autoplay", () => {
  const c = cardContent(
    '<img src="picture.png" alt="A triangle">[sound:voice.mp3]',
    { "picture.png": "blob:picture", "voice.mp3": "blob:voice" },
  );
  expect(c.html).toContain("blob:picture");
  expect(c.html).toContain("A triangle");
  expect(c.audio).toEqual(["blob:voice"]);
  expect(c.html).not.toContain("<audio");
});
it("announces missing image alternatives instead of inventing a description", () => {
  expect(
    cardContent('<img src="p.png">', { "p.png": "blob:p" }).html,
  ).toContain("original deck has no text description");
});
it("renders standard cloze hints and correct card ordinals", () => {
  const fields = { Text: "The {{c1::cat::animal}} sat on {{c2::a mat}}." };
  expect(
    renderTemplate("{{cloze:Text}}", fields, { side: "front", ordinal: 0 }),
  ).toContain("[animal]");
  expect(
    renderTemplate("{{cloze:Text}}", fields, { side: "back", ordinal: 0 }),
  ).toContain("<strong>cat</strong>");
  expect(
    renderTemplate("{{cloze:Text}}", fields, { side: "front", ordinal: 1 }),
  ).toContain("The cat sat on <strong>[…]</strong>");
});
it("handles nested conditionals and rejects unknown filters", () => {
  expect(
    renderTemplate(
      "{{#A}}one {{#B}}{{B}}{{/B}}{{/A}}",
      { A: "yes", B: "two" },
      { side: "front", ordinal: 0 },
    ),
  ).toBe("one two");
  expect(() =>
    renderTemplate(
      "{{unknown:A}}",
      { A: "yes" },
      { side: "front", ordinal: 0 },
    ),
  ).toThrow("Unsupported");
});
