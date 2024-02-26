import { BlockService } from '@blocksuite/block-std';
import type { EditorHost } from '@blocksuite/lit';
import { Slot } from '@blocksuite/store';

import {
  FileDropManager,
  type FileDropOptions,
} from '../_common/components/file-drop-manager.js';
import { toast } from '../_common/components/toast.js';
import { matchFlavours } from '../_common/utils/model.js';
import type { EdgelessPageService } from '../index.js';
import type { PDFBlockModel } from './pdf-model.js';
import type { PDFJSModule, TextLayerBuilder } from './utils.js';
import {
  getPDFDimensions,
  loadPDFModule,
  loadTextLayerBuilder,
  moduleLoaded,
  parsePDF,
  savePDFFile,
  setPDFModule,
} from './utils.js';

export { PDFException } from './utils.js';

export class PDFService extends BlockService<PDFBlockModel> {
  static PDFModule: PDFJSModule;
  static TextLayerBuilder: TextLayerBuilder;
  static setPDFModule(args: Parameters<typeof setPDFModule>) {
    setPDFModule(...args);
    this.moduleUpdated.emit();
  }
  static moduleUpdated = new Slot();

  fileDropManager!: FileDropManager;

  get moduleLoaded() {
    return moduleLoaded();
  }

  get pdfModule() {
    return loadPDFModule();
  }

  get TextLayerBuilder() {
    return loadTextLayerBuilder();
  }

  parsePDF(fileURL: string | ArrayBuffer) {
    return parsePDF(fileURL);
  }

  private _fileDropOptions: FileDropOptions = {
    flavour: this.flavour,
    onDrop: async ({ files, point, targetModel, place }) => {
      if (!this.moduleLoaded) return false;

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
        const pageDimension = await getPDFDimensions(fileBuffer);
        const service = this.std.spec.getService(
          'affine:page'
        ) as EdgelessPageService;

        const targetPoint =
          service?.viewport?.toModelCoord?.(point.x, point.y) ?? point;

        this.page.addBlock(
          'affine:pdf',
          {
            sourceId,
            xywh: `[${targetPoint[0] - pageDimension.width / 2},${targetPoint[1] - pageDimension.height / 3},${pageDimension.width},${pageDimension.height}]`,
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
