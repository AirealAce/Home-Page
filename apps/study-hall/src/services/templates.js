const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function renderTemplate(
  template,
  fields,
  { side, ordinal, deckName, tags = "" },
) {
  let result = template;
  for (let i = 0; i < 15 && /{{[#^]/.test(result); i++) {
    const before = result;
    result = result.replace(
      /{{([#^])([^{}]+)}}((?:(?!{{[#^])[\s\S])*?){{\/\2}}/g,
      (_, type, name, body) =>
        !!String(fields[name] ?? "").trim() === (type === "#") ? body : "",
    );
    if (before === result) break;
  }
  result = result.replace(/{{([^{}]+)}}/g, (_, key) => {
    if (key === "FrontSide") return ""; // The question remains above the answer in our UI.
    if (key === "Deck" || key === "Subdeck") return escape(deckName);
    if (key === "Tags") return escape(tags);
    const parts = key.split(":");
    const field = parts.pop();
    if (!Object.hasOwn(fields, field))
      throw new Error(`Unsupported template field: ${key}`);
    let value = fields[field];
    if (/{{c\d+::(?:(?!}})[\s\S])*{{c\d+::/.test(value)) {
      throw new Error("Nested Cloze cards are not supported");
    }
    for (const filter of parts.reverse()) {
      if (filter === "cloze")
        value = value.replace(
          /{{c(\d+)::([\s\S]*?)(?:::(.*?))?}}/g,
          (all, n, text, hint) =>
            Number(n) === ordinal + 1
              ? side === "front"
                ? `<strong>[${escape(hint || "…")}]</strong>`
                : `<strong>${text}</strong>`
              : text,
        );
      else if (filter === "text")
        value = escape(value.replace(/<[^>]*>/g, " "));
      else if (filter === "type")
        value =
          side === "front"
            ? "<p>Recall the answer, then select Show Answer.</p>"
            : value;
      else throw new Error(`Unsupported template filter: ${filter}`);
    }
    return value;
  });
  if (/{{[#^/]/.test(result))
    throw new Error("Unsupported nested template or cloze syntax");
  return result;
}
