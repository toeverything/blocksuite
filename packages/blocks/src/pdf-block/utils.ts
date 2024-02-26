import type { Page } from '@blocksuite/store';

export type PDFJSModule = typeof import('pdfjs-dist');
export type TextLayerBuilder =
  typeof import('pdfjs-dist/web/pdf_viewer.mjs').TextLayerBuilder;

export class PDFException extends Error {
  type: 'setup' | 'module' | 'parsing';

  constructor(type: PDFException['type'], message: string, cause?: Error) {
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

let moduleLoader: () => Promise<PDFJSModule>;
let textLayerBuilderLoader: () => Promise<TextLayerBuilder>;

export const moduleLoaded = () => !!moduleLoader && !!textLayerBuilderLoader;

export const loadPDFModule = () => {
  if (!moduleLoader) {
    throw new PDFException('setup', 'pdfjs is not set up');
  }

  return moduleLoader().catch(err => {
    throw new PDFException('module', 'Failed to load PDFModule', err);
  });
};

export async function loadTextLayerBuilder() {
  if (!textLayerBuilderLoader) {
    throw new PDFException('setup', 'TextLayerBuilder is not set up');
  }

  return textLayerBuilderLoader().catch(err => {
    throw new PDFException('module', 'Failed to load TextLayerBuilder', err);
  });
}

export const setPDFModule = (
  pdfjs: () => Promise<PDFJSModule>,
  TextLayerBuilder: () => Promise<TextLayerBuilder>,
  workerSrc: string
) => {
  moduleLoader = () =>
    pdfjs().then(pdfjs => {
      pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
      return pdfjs;
    });
  textLayerBuilderLoader = TextLayerBuilder;
};

export const parsePDF = async (fileURL: string | ArrayBuffer) => {
  const pdfjs = await loadPDFModule();

  return pdfjs.getDocument(fileURL).promise.catch(err => {
    throw new PDFException('parsing', 'Failed to parse PDF', err);
  });
};

export async function getPDFDimensions(fileURL: string | ArrayBuffer) {
  const pdf = await parsePDF(fileURL);
  const page = await pdf.getPage(1);
  const { width, height } = page.getViewport({ scale: 1 });
  return { width, height };
}
