import type { BlockModel, Doc } from '@blocksuite/store';

import {
  type MicrosheetBlockModel,
  MicrosheetBlockSchema,
} from '@blocksuite/affine-model';
import { BlockService } from '@blocksuite/block-std';
import { viewPresets } from '@blocksuite/data-view/view-presets';

import {
  microsheetViewAddView,
  microsheetViewInitEmpty,
  microsheetViewInitTemplate,
} from './data-source.js';
import {
  addProperty,
  applyPropertyUpdate,
  updateCell,
  updateView,
} from './utils.js';

export class MicrosheetBlockService extends BlockService {
  static override readonly flavour = MicrosheetBlockSchema.model.flavour;

  addColumn = addProperty;

  applyColumnUpdate = applyPropertyUpdate;

  microsheetViewAddView = microsheetViewAddView;

  microsheetViewInitEmpty = microsheetViewInitEmpty;

  updateCell = updateCell;

  updateView = updateView;

  viewPresets = viewPresets;

  initMicrosheetBlock(
    doc: Doc,
    model: BlockModel,
    microsheetId: string,
    viewType: string,
    isAppendNewRow = true
  ) {
    const blockModel = doc.getBlock(microsheetId)?.model as
      | MicrosheetBlockModel
      | undefined;
    if (!blockModel) {
      return;
    }
    microsheetViewInitTemplate(blockModel, viewType);
    if (isAppendNewRow) {
      const parent = doc.getParent(model);
      if (!parent) return;
      doc.addBlock('affine:paragraph', {}, parent.id);
    }
    applyPropertyUpdate(blockModel);
  }
}
