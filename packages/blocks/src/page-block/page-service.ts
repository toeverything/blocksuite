import { BlockService } from '@blocksuite/block-std';

import { DEFAULT_CANVAS_TEXT_FONT_CONFIG } from '../surface-block/consts.js';
import {
  copySelectedModelsCommand,
  deleteSelectedModelsCommand,
  deleteTextCommand,
  formatBlockCommand,
  formatNativeCommand,
  formatTextCommand,
  getBlockIndexCommand,
  getBlockSelectionsCommand,
  getImageSelectionsCommand,
  getNextBlockCommand,
  getPrevBlockCommand,
  getSelectedBlocksCommand,
  getSelectedModelsCommand,
  getTextSelectionCommand,
  withRootCommand,
} from './commands/index.js';
import { FontLoader } from './font-loader/font-loader.js';
import type { PageBlockModel } from './page-model.js';

export class PageService extends BlockService<PageBlockModel> {
  readonly fontLoader = new FontLoader();

  override mounted() {
    super.mounted();

    this.std.command
      .add('getBlockIndex', getBlockIndexCommand)
      .add('getNextBlock', getNextBlockCommand)
      .add('getPrevBlock', getPrevBlockCommand)
      .add('getSelectedBlocks', getSelectedBlocksCommand)
      .add('copySelectedModels', copySelectedModelsCommand)
      .add('deleteSelectedModels', deleteSelectedModelsCommand)
      .add('getSelectedModels', getSelectedModelsCommand)
      .add('getBlockSelections', getBlockSelectionsCommand)
      .add('getImageSelections', getImageSelectionsCommand)
      .add('getTextSelection', getTextSelectionCommand)
      .add('deleteText', deleteTextCommand)
      .add('formatBlock', formatBlockCommand)
      .add('formatNative', formatNativeCommand)
      .add('formatText', formatTextCommand)
      .add('withRoot', withRootCommand);

    this.loadFonts();
  }

  loadFonts() {
    this.fontLoader.load(DEFAULT_CANVAS_TEXT_FONT_CONFIG);
  }
}
