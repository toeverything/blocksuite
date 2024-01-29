import { BlockService } from '@blocksuite/block-std';
import type { EditorHost } from '@blocksuite/lit';
import pdfWorkerjs from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

import {
  FileDropManager,
  type FileDropOptions,
} from '../_common/components/file-drop-manager.js';
import { toast } from '../_common/components/toast.js';
import type { PDFBlockModel } from './pdf-model.js';

export class PDFException extends Error {
  type: 'module' | 'parsing';

  constructor(type: PDFException['type'], message: string, cause: Error) {
    super(message);
    this.name = 'PDFException';
    this.type = type;
    this.cause = cause;
  }
}

export const pdfModule = () => {
  return import('pdfjs-dist').then(pdfjs => {
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerjs;
    return pdfjs;
  });
};

export class PDFService extends BlockService<PDFBlockModel> {
  fileDropManager!: FileDropManager;

  upload(file: File) {
    return this.page.blob.set(file);
  }

  get pdfModule() {
    return pdfModule().catch(err => {
      throw new PDFException('module', 'Failed to load pdf.js', err);
    });
  }

  parsePDF(fileURL: string) {
    return this.pdfModule.then(pdfjs => {
      return pdfjs.getDocument(fileURL).promise.catch(err => {
        throw new PDFException('parsing', 'Failed to parse PDF', err);
      });
    });
  }

  private _fileDropOptions: FileDropOptions = {
    flavour: this.flavour,
    onDrop: async ({ files, point }) => {
      const pdfFiles = files.filter(file =>
        file.type.startsWith('application/pdf')
      );
      if (!pdfFiles.length) return false;

      await Promise.all(
        pdfFiles.map(async file => {
          try {
            const sourceId = await this.page.blob.set(file);
            const blob = await this.page.blob.get(sourceId);
            const url = URL.createObjectURL(blob!);
            const pdfDoc = await this.parsePDF(url);
            const pdfPage = await pdfDoc.getPage(1);
            const viewport = pdfPage.getViewport({ scale: 1 });

            this.page.addBlock(
              'affine:pdf',
              {
                sourceId,
                xywh: `[${point.x},${point.y},${viewport.width},${viewport.height}]`,
              },
              this.page.root!
            );
          } catch (err) {
            toast(this.std.host as EditorHost, 'Failed to load PDF');
            console.error(err);
          }
        })
      );

      return true;
    },
  };

  override mounted() {
    this.fileDropManager = new FileDropManager(this, this._fileDropOptions);
  }
}
