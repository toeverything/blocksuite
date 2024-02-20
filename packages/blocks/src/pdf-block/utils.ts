import type { Page } from '@blocksuite/store';
import pdfWorkerjs from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

export class PDFException extends Error {
  type: 'module' | 'parsing';

  constructor(type: PDFException['type'], message: string, cause: Error) {
    super(message);
    this.name = 'PDFException';
    this.type = type;
    this.cause = cause;
  }
}

export async function savePDFFile(page: Page, pdfFile: File) {
  const sourceId = await page.blob.set(pdfFile);
  const blob = await page.blob.get(sourceId);

  return { blob: blob!, sourceId };
}

export const pdfModule = () => {
  return import('pdfjs-dist')
    .then(pdfjs => {
      pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerjs;
      return pdfjs;
    })
    .catch(err => {
      throw new PDFException('module', 'Failed to load pdf.js', err);
    });
};

export const parsePDF = (fileURL: string | ArrayBuffer) => {
  return pdfModule().then(pdfjs => {
    return pdfjs.getDocument(fileURL).promise.catch(err => {
      throw new PDFException('parsing', 'Failed to parse PDF', err);
    });
  });
};

export async function getPDFDimensions(fileURL: string | ArrayBuffer) {
  const pdf = await parsePDF(fileURL);
  const page = await pdf.getPage(1);
  const { width, height } = page.getViewport({ scale: 1 });
  return { width, height };
}
