let connection;
function database() {
  return (connection ||= new Promise((resolve, reject) => {
    const request = indexedDB.open("study-hall", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore("decks", { keyPath: "id" });
      db.createObjectStore("results", { keyPath: "id" });
      db.createObjectStore("meta");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      connection = null;
      reject(request.error);
    };
    request.onblocked = () => {
      connection = null;
      reject(
        new Error("Close other Study Hall tabs and reload to update storage."),
      );
    };
  }));
}
async function transaction(store, mode, run) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode),
      request = run(tx.objectStore(store));
    tx.oncomplete = () => resolve(request?.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () =>
      reject(tx.error || new Error("Local save was interrupted."));
  });
}
export const storageService = {
  listDecks: () => transaction("decks", "readonly", (s) => s.getAll()),
  saveDecks: (decks) =>
    transaction("decks", "readwrite", (s) => {
      for (const deck of decks) s.put(deck);
    }),
  getSetting: (key) => transaction("meta", "readonly", (s) => s.get(key)),
  setSetting: (key, value) =>
    transaction("meta", "readwrite", (s) => s.put(value, key)),
  listResults: () => transaction("results", "readonly", (s) => s.getAll()),
  saveResult: (result) =>
    transaction("results", "readwrite", (s) => s.put(result)),
};
