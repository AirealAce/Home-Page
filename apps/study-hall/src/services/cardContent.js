import DOMPurify from "dompurify";
export function questionText(raw, { preserveLines = false } = {}) {
  const clean = DOMPurify.sanitize(
    raw.replace(/\[sound:[^\]]+\]/g, " [Audio] "),
    {
      ALLOWED_TAGS: [
        "p",
        "div",
        "br",
        "li",
        "img",
        "audio",
        "span",
        "b",
        "strong",
        "i",
        "em",
        "ul",
        "ol",
        "table",
        "caption",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
        "blockquote",
        "pre",
        "code",
        "hr",
      ],
      ALLOWED_ATTR: ["alt"],
    },
  );
  const doc = new DOMParser().parseFromString(clean, "text/html");
  doc
    .querySelectorAll("img")
    .forEach((el) =>
      el.replaceWith(
        doc.createTextNode(
          ` [Image: ${el.getAttribute("alt") || "no description supplied"}] `,
        ),
      ),
    );
  doc
    .querySelectorAll("audio")
    .forEach((el) => el.replaceWith(doc.createTextNode(" [Audio] ")));
  doc
    .querySelectorAll("br,hr")
    .forEach((el) =>
      el.replaceWith(doc.createTextNode(preserveLines ? "\n" : " ")),
    );
  doc
    .querySelectorAll("th,td")
    .forEach((el) => el.append(doc.createTextNode("\t")));
  doc
    .querySelectorAll("p,div,li,ul,ol,blockquote,pre,caption,tr")
    .forEach((el) => {
      if (preserveLines) el.prepend(doc.createTextNode("\n"));
      el.append(doc.createTextNode(preserveLines ? "\n" : " "));
    });
  if (preserveLines) {
    // Flatten nested blocks before adding each marker, so <li><p>Text</p></li>
    // becomes "• Text", not a bullet followed by an empty line.
    [...doc.querySelectorAll("li")].reverse().forEach((el) => {
      const siblings = [...el.parentElement.children].filter(
        (item) => item.tagName === "LI",
      );
      const marker =
        el.parentElement.tagName === "OL"
          ? `${siblings.indexOf(el) + 1}.`
          : "•";
      const content = el.textContent.trim();
      el.replaceWith(
        doc.createTextNode(content ? `\n${marker} ${content}` : ""),
      );
    });
  }
  if (preserveLines)
    return doc.body.textContent
      .replace(/[^\S\n]+/g, " ")
      .replace(/ *\n */g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  return doc.body.textContent.replace(/\s+/g, " ").trim();
}
export function cardContent(raw, mediaUrls = {}) {
  const html = raw.replace(
    /\[sound:([^\]]+)\]/g,
    (_, name) => `<audio src="${name.replace(/"/g, "&quot;")}"></audio>`,
  );
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "div",
      "span",
      "br",
      "hr",
      "b",
      "strong",
      "i",
      "em",
      "u",
      "s",
      "sub",
      "sup",
      "ul",
      "ol",
      "li",
      "blockquote",
      "pre",
      "code",
      "table",
      "caption",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "img",
      "audio",
      "source",
      "a",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
    ],
    ALLOWED_ATTR: [
      "src",
      "alt",
      "href",
      "title",
      "colspan",
      "rowspan",
      "scope",
      "lang",
    ],
    ALLOW_DATA_ATTR: false,
  });
  const doc = new DOMParser().parseFromString(clean, "text/html");
  const audio = [];
  const missing = [];
  for (const el of doc.querySelectorAll("img,audio,source")) {
    const original =
      el.getAttribute("src") ||
      el.querySelector("source")?.getAttribute("src") ||
      "";
    let name = original;
    try {
      name = decodeURIComponent(original);
    } catch {
      /* retain original */
    }
    const url = Object.hasOwn(mediaUrls, name) ? mediaUrls[name] : undefined;
    if (el.tagName === "SOURCE") continue;
    if (!url) {
      const fallback = doc.createElement("span");
      fallback.textContent = `[${el.tagName === "IMG" ? "Image" : "Audio"} unavailable: ${el.getAttribute("alt") || name || "unnamed media"}]`;
      el.replaceWith(fallback);
      missing.push(name);
      continue;
    }
    if (el.tagName === "AUDIO") {
      audio.push(url);
      el.remove();
    } else {
      el.setAttribute("src", url);
      if (!el.hasAttribute("alt") || !el.getAttribute("alt")?.trim()) {
        el.setAttribute(
          "alt",
          "Study image. The original deck has no text description.",
        );
        const note = doc.createElement("small");
        note.textContent =
          "This image has no description in the original deck.";
        el.after(note);
      }
    }
  }
  doc.querySelectorAll("source").forEach((el) => el.remove());
  doc.querySelectorAll("h1,h2,h3,h4,h5,h6").forEach((el) => {
    const p = doc.createElement("p");
    const b = doc.createElement("strong");
    b.innerHTML = el.innerHTML;
    p.append(b);
    el.replaceWith(p);
  });
  doc.querySelectorAll("a").forEach((el) => {
    const href = el.getAttribute("href") || "";
    if (!/^https?:\/\//i.test(href)) el.removeAttribute("href");
    else {
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
      el.setAttribute("aria-label", `${el.textContent} (opens in a new tab)`);
    }
  });
  const text = doc.body.textContent.replace(/\s+/g, " ").trim();
  return {
    html: doc.body.innerHTML,
    text,
    audio: [...new Set(audio)],
    missing,
  };
}
