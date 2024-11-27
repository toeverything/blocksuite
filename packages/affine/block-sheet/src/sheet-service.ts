import type { BlockModel, Doc } from '@blocksuite/store';

import {
  type SheetBlockModel,
  SheetBlockSchema,
  SheetCellSchema,
  SheetRowSchema,
} from '@blocksuite/affine-model';
import { BlockService } from '@blocksuite/block-std';

import { sheetInitTemplate } from './data-source.js';

export class SheetBlockService extends BlockService {
  static override readonly flavour = SheetBlockSchema.model.flavour;

  initSheetBlock(doc: Doc, model: BlockModel, databaseId: string) {
    const blockModel = doc.getBlock(databaseId)?.model as
      | SheetBlockModel
      | undefined;
    if (!blockModel) {
      return;
    }
    sheetInitTemplate(blockModel);
    const parent = doc.getParent(model);
    if (!parent) return;
    doc.addBlock('affine:paragraph', {}, parent.id);
  }
}

export class SheetRowService extends BlockService {
  static override readonly flavour = SheetRowSchema.model.flavour;
}

export class SheetCellService extends BlockService {
  static override readonly flavour = SheetCellSchema.model.flavour;
}
