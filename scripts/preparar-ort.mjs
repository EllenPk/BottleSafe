import { copyFile, mkdir } from "node:fs/promises";

const output = new URL("../public/ort/", import.meta.url);
const distribution = new URL("../node_modules/onnxruntime-web/dist/", import.meta.url);
await mkdir(output, { recursive: true });

await Promise.all(
  ["ort-wasm-simd-threaded.mjs", "ort-wasm-simd-threaded.wasm"]
    .map(name => copyFile(new URL(name, distribution), new URL(name, output)))
);
