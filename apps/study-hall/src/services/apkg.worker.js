import initSqlJs from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import { parsePackage } from "./apkgCore";
self.onmessage = async ({ data }) => {
  try {
    const SQL = await initSqlJs({ locateFile: () => wasmUrl });
    self.postMessage({
      result: parsePackage(new Uint8Array(data.buffer), SQL, data.packageId),
    });
  } catch (error) {
    self.postMessage({
      error: error.message || "This package could not be read.",
    });
  }
};
