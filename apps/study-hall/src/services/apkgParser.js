export async function importApkg(file) {
  if (!file.name.toLowerCase().endsWith(".apkg"))
    throw new Error("Choose a file ending in .apkg.");
  if (file.size > 100 * 1024 * 1024)
    throw new Error(
      "This file exceeds the 100 MB import limit. Export a smaller deck with its media.",
    );
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  const packageId = Array.from(new Uint8Array(digest), (x) =>
    x.toString(16).padStart(2, "0"),
  ).join("");
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./apkg.worker.js", import.meta.url), {
      type: "module",
    });
    const done = (error, result) => {
      clearTimeout(timer);
      worker.terminate();
      error ? reject(new Error(error)) : resolve(result);
    };
    const timer = setTimeout(
      () => done("Import timed out. Try exporting a smaller deck."),
      60000,
    );
    worker.onmessage = ({ data }) => done(data.error, data.result);
    worker.onerror = () =>
      done(
        "The package could not be read. Try re-exporting it from Anki with support for older versions.",
      );
    worker.postMessage({ buffer, packageId }, [buffer]);
  });
}
