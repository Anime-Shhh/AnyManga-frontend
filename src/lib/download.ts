export const maxDownloadBytes = 128 * 1024 * 1024;

// Fetch exposes body chunks as the Go service emits each PDF page. A missing
// trailer means generation/transport failed, even if HTTP headers were 200.
export async function receivePDF(response: Response, signal: AbortSignal, onBytes: (bytes: number) => void): Promise<Blob> {
  if (!response.headers.get("content-type")?.startsWith("application/pdf") || !response.body) {
    throw new Error("The server did not return a PDF. Please try again.");
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let received = 0;
  let tail = new Uint8Array(0);
  try {
    while (true) {
      if (signal.aborted) throw new DOMException("Download cancelled", "AbortError");
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > maxDownloadBytes) throw new Error("The PDF exceeds the download size limit. Select fewer chapters.");
      chunks.push(new Uint8Array(value));
      const last = new Uint8Array(tail.length + value.length);
      last.set(tail); last.set(value, tail.length);
      tail = last.slice(-1024);
      onBytes(received);
    }
    if (signal.aborted) throw new DOMException("Download cancelled", "AbortError");
    const blob = new Blob(chunks, { type: "application/pdf" });
    if (!(await blob.slice(0, 8).text()).startsWith("%PDF-") || !/%%EOF\s*$/.test(new TextDecoder().decode(tail))) {
      throw new Error("The download was interrupted before the PDF finished. Please retry or select fewer chapters.");
    }
    return blob;
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally { reader.releaseLock(); }
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
}
