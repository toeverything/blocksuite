import { BlockService } from '@blocksuite/block-std';
import type { EditorHost } from '@blocksuite/lit';

import {
  FileDropManager,
  type FileDropOptions,
} from '../_common/components/file-drop-manager.js';
import { toast } from '../_common/components/toast.js';
import { matchFlavours } from '../_common/utils/model.js';
import type { PDFBlockModel } from './pdf-model.js';
import { getPDFDimensions, parsePDF, pdfModule, savePDFFile } from './utils.js';

export { PDFException } from './utils.js';

export const TextLayerBuilder = () => {
  return import('pdfjs-dist/web/pdf_viewer.mjs').then(
    module => module.TextLayerBuilder
  );
};

export class PDFService extends BlockService<PDFBlockModel> {
  fileDropManager!: FileDropManager;

  get pdfModule() {
    return pdfModule();
  }

  get TextLayerBuilder() {
    return TextLayerBuilder();
  }

  parsePDF(fileURL: string | ArrayBuffer) {
    return parsePDF(fileURL);
  }

  private _fileDropOptions: FileDropOptions = {
    flavour: this.flavour,
    onDrop: async ({ files, point, targetModel, place }) => {
      const pdfFile = files.filter(file =>
        file.type.startsWith('application/pdf')
      )[0];
      if (!pdfFile) return false;

      const parentModel =
        targetModel &&
        (matchFlavours(targetModel, ['affine:surface'])
          ? targetModel
          : this.page.getParent(targetModel)?.flavour === 'affine:note'
            ? this.page.getParent(targetModel)
            : null);

      if (!parentModel) {
        return false;
      }

      const targetIdx =
        parentModel.flavour === 'affine:note'
          ? parentModel.children.indexOf(targetModel) +
            (place === 'after' ? 1 : 0)
          : parentModel.children.length;

      try {
        const { blob, sourceId } = await savePDFFile(this.page, pdfFile);
        const fileBuffer = await blob.arrayBuffer();
        const fileSize = await getPDFDimensions(fileBuffer);

        this.page.addBlock(
          'affine:pdf',
          {
            sourceId,
            xywh: `[${point.x},${point.y},${fileSize.width},${fileSize.height}]`,
          },
          parentModel,
          targetIdx
        );
      } catch (err) {
        toast(this.std.host as EditorHost, 'Failed to load PDF');
        console.error(err);
      }

      return true;
    },
  };

  override mounted() {
    this.fileDropManager = new FileDropManager(this, this._fileDropOptions);
  }
}
