import { BlockService } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';

import {
  FileDropManager,
  type FileDropOptions,
} from '../_common/components/file-drop-manager.js';
import {
  DEFAULT_IMAGE_PROXY_ENDPOINT,
  ExportManager,
} from '../_common/export-manager/export-manager.js';
import type { LinkCardStyle } from '../_common/types.js';
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
import type { PageBlockComponent } from './types.js';

type EmbedOptions = {
  flavour: string;
  urlRegex: RegExp;
  styles: LinkCardStyle[];
};

export class PageService extends BlockService<PageBlockModel> {
  readonly fontLoader = new FontLoader();

  fileDropManager!: FileDropManager;
  exportManager!: ExportManager;

  private _fileDropOptions: FileDropOptions = {
    flavour: this.flavour,
  };

  private _exportOptions = {
    imageProxyEndpoint: DEFAULT_IMAGE_PROXY_ENDPOINT,
  };

  get viewportElement() {
    const pageElement = this.std.view.viewFromPath('block', [
      this.std.page.root?.id ?? '',
    ]) as PageBlockComponent | null;
    assertExists(pageElement);
    const viewportElement = pageElement.viewportElement as HTMLElement | null;
    assertExists(viewportElement);
    return viewportElement;
  }

  private _embedBlockRegistry = new Set<EmbedOptions>();

  registerEmbedBlockOptions = (options: EmbedOptions): void => {
    this._embedBlockRegistry.add(options);
  };

  getEmbedBlockOptions = (url: string): EmbedOptions | null => {
    const entries = this._embedBlockRegistry.entries();
    for (const [options] of entries) {
      const regex = options.urlRegex;
      const match = url.match(regex);
      if (match) return options;
    }
    return null;
  };

  override mounted() {
    super.mounted();

    this.handleEvent(
      'selectionChange',
      () => {
        const viewport = this.viewportElement;
        if (!viewport) return;

        const selection = document.getSelection();
        if (!selection || !selection.rangeCount) return;
        const range = selection.getRangeAt(0);

        const startElement =
          range.startContainer instanceof Element
            ? range.startContainer
            : range.startContainer.parentElement;
        if (!startElement) return;

        if (
          startElement === document.documentElement ||
          startElement === document.body
        )
          return;

        if (startElement.closest('.blocksuite-overlay')) return;

        if (!viewport.contains(startElement)) {
          this.std.event.deactivate();
          return;
        }

        const endElement =
          range.endContainer instanceof Element
            ? range.endContainer
            : range.endContainer.parentElement;
        if (!endElement) return;

        if (!viewport.contains(endElement)) {
          this.std.event.deactivate();
          return;
        }

        this.std.event.activate();
      },
      {
        global: true,
      }
    );

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
    this.exportManager = new ExportManager(this, this._exportOptions);
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
