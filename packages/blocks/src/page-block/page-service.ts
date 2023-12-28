import { BlockService } from '@blocksuite/block-std';
import type { BlockElement } from '@blocksuite/lit';

import {
  FileDropManager,
  type FileDropOptions,
} from '../_common/components/file-drop-manager.js';
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
  withHostCommand,
} from './commands/index.js';
import { FontLoader } from './font-loader/font-loader.js';
import type { PageBlockModel } from './page-model.js';

export class PageService extends BlockService<PageBlockModel> {
  readonly fontLoader = new FontLoader();

  fileDropManager!: FileDropManager;

  private _fileDropOptions: FileDropOptions = {
    flavour: this.flavour,
  };

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
      .add('withHost', withHostCommand);

    this.loadFonts();

    this.fileDropManager = new FileDropManager(this, this._fileDropOptions);
    this.disposables.addFromEvent(
      this.std.host,
      'dragover',
      this.fileDropManager.onDragOver
    );
  }

  get selectedBlocks() {
    let result: BlockElement[] = [];
    this.std.command
      .pipe()
      .withHost()
      .tryAll(chain => [
        chain.getTextSelection(),
        chain.getImageSelections(),
        chain.getBlockSelections(),
      ])
      .getSelectedBlocks()
      .inline(({ selectedBlocks }) => {
        if (!selectedBlocks) return;
        result = selectedBlocks;
      })
      .run();
    return result;
  }

  get selectedModels() {
    return this.selectedBlocks.map(block => block.model);
  }

  loadFonts() {
    this.fontLoader.load(DEFAULT_CANVAS_TEXT_FONT_CONFIG);
  }
}
