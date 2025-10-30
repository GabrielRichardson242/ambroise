import { compressGlbToDraco } from "../lib/compressGlb";

// Declare worker global for TS
declare const self: DedicatedWorkerGlobalScope;
export default null; // Vite requires this to treat the file as a module

self.onmessage = async (e: MessageEvent<ArrayBuffer | Uint8Array>) => {
  try {
    // Normalise input to a typed array
    const input: Uint8Array =
      e.data instanceof Uint8Array ? e.data : new Uint8Array(e.data);

    // Clone the buffer safely for transfer
    const arrayBuffer: ArrayBuffer = input.buffer.slice(0);

    console.log("Worker: received", input.byteLength, "bytes");

    // Compress using Draco
    const out: Uint8Array = await compressGlbToDraco(arrayBuffer);

    console.log("Worker: compression done, returning", out.byteLength, "bytes");

    // Send back the compressed data
    self.postMessage(out, [out.buffer]);
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "string"
        ? err
        : "Unknown error";
    self.postMessage({ __error: message });
  }
};