/**
 * Extracts text from a PDF in the browser, one line per visual line (items on the same baseline are
 * joined). The PDF library is loaded on demand so it never weighs on the other pages.
 */
export async function pdfToText(data: ArrayBuffer, workerSrc?: string): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // The bundler turns this URL into the worker file; `workerSrc` lets Node-based checks point at it directly.
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc ?? new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(data) }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    const lines: { y: number; parts: { x: number; text: string }[] }[] = [];
    for (const item of content.items) {
      if (!("str" in item) || !item.str) continue;
      const x = item.transform[4] as number;
      const y = item.transform[5] as number;
      const line = lines.find((l) => Math.abs(l.y - y) < 2);
      if (line) line.parts.push({ x, text: item.str });
      else lines.push({ y, parts: [{ x, text: item.str }] });
    }
    lines.sort((a, b) => b.y - a.y); // top of the page first
    pages.push(lines.map((l) => l.parts.sort((a, b) => a.x - b.x).map((p) => p.text).join("")).join("\n"));
  }
  return pages.join("\n");
}
