import type { BlockModel, Doc } from '@blocksuite/store';

import {
  type MicrosheetBlockModel,
  MicrosheetBlockSchema,
} from '@blocksuite/affine-model';
import { BlockService } from '@blocksuite/block-std';
import { viewPresets } from '@blocksuite/microsheet-data-view/view-presets';

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
    viewType: string
  ) {
    const blockModel = doc.getBlock(microsheetId)?.model as
      | MicrosheetBlockModel
      | undefined;
    if (!blockModel) {
      return;
    }
    microsheetViewInitTemplate(blockModel, viewType);
    applyPropertyUpdate(blockModel);
  }
}
