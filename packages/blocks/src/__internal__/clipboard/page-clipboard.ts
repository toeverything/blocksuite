import type { BaseBlockModel } from '@blocksuite/store';
import { assertExists } from '@blocksuite/store';

import type { DefaultPageBlockComponent } from '../../page-block/index.js';
import { deleteModelsByRange } from '../../page-block/index.js';
import {
  getCurrentBlockRange,
  getCurrentNativeRange,
  hasNativeSelection,
  resetNativeSelection,
} from '../utils/index.js';
import { ClipboardItem } from './clipboard-item.js';
import type { Clipboard } from './type.js';
import {
  CLIPBOARD_MIMETYPE,
  isPureFileInClipboard,
  performNativeCopy,
} from './utils.js';

// TODO: getCurrentBlockRange can not get embed block when selection is native, so clipboard can not copy embed block
export class PageClipboard implements Clipboard {
  private _pageBlock!: DefaultPageBlockComponent;
  // The event handler will get the most needed clipboard data based on this array order
  private _optimalMimeTypes: string[] = [
    CLIPBOARD_MIMETYPE.BLOCKS_CLIP_WRAPPED,
    CLIPBOARD_MIMETYPE.HTML,
    CLIPBOARD_MIMETYPE.TEXT,
  ];
  public init(pageBlock: DefaultPageBlockComponent) {
    this._pageBlock = pageBlock;
    document.body.addEventListener('cut', this._onCut.bind(this));
    document.body.addEventListener('copy', this._onCopy.bind(this));
    document.body.addEventListener('paste', this._onPaste.bind(this));
  }
  public dispose() {
    document.body.removeEventListener('cut', this._onCut);
    document.body.removeEventListener('copy', this._onCopy);
    document.body.removeEventListener('paste', this._onPaste);
  }

  private _shouldContinue() {
    const range = getCurrentBlockRange(this._pageBlock.page);

    const { focusedBlockIndex, selectedBlocks, selectedEmbeds } =
      this._pageBlock.selection.state;

    return (
      focusedBlockIndex !== -1 ||
      !!selectedBlocks.length ||
      !!selectedEmbeds.length ||
      !range ||
      !range?.models.find(model => model.flavour === 'affine:page')
    );
  }

  private _onCut(e: ClipboardEvent) {
    if (!this._shouldContinue()) {
      return;
    }
    e.preventDefault();
    this._onCopy(e);
    deleteModelsByRange(this._pageBlock.page);
  }
  private _onCopy(e: ClipboardEvent) {
    if (!this._shouldContinue()) {
      return;
    }
    e.preventDefault();
    this.copy();
  }
  private _onPaste(e: ClipboardEvent) {
    if (!this._shouldContinue() || !e.clipboardData) {
      return;
    }
    e.preventDefault();
    deleteModelsByRange(this._pageBlock.page);

    const blocks = this._clipboardData2Blocks(e.clipboardData);
    if (blocks.length) {
      const range = getCurrentBlockRange(this._pageBlock.page);
      const focusedBlockModel = range?.models[0];
      assertExists(focusedBlockModel);
      const service = this._pageBlock.getService(focusedBlockModel.flavour);
      service.json2Block(focusedBlockModel, blocks);
    }
  }

  copy() {
    const range = getCurrentBlockRange(this._pageBlock.page);
    if (!range) {
      return;
    }

    const clipGroups = range.models.map((model, index) => {
      if (index === 0) {
        return this.getBlockClipboardInfo(
          model,
          range.startOffset,
          index === range.models.length - 1 ? range.endOffset : undefined
        );
      }
      if (index === range.models.length - 1) {
        return this.getBlockClipboardInfo(model, undefined, range.endOffset);
      }
      return this.getBlockClipboardInfo(model);
    });

    const textClipboardItem = new ClipboardItem(
      CLIPBOARD_MIMETYPE.TEXT,
      clipGroups.map(group => group.text).join('')
    );
    const htmlClipboardItem = new ClipboardItem(
      CLIPBOARD_MIMETYPE.HTML,
      clipGroups.map(group => group.html).join('')
    );
    const customClipboardItem = new ClipboardItem(
      CLIPBOARD_MIMETYPE.BLOCKS_CLIP_WRAPPED,
      JSON.stringify(
        clipGroups.filter(group => group.json).map(group => group.json)
      )
    );

    const savedRange = hasNativeSelection() ? getCurrentNativeRange() : null;

    performNativeCopy([
      textClipboardItem,
      htmlClipboardItem,
      customClipboardItem,
    ]);

    savedRange && resetNativeSelection(savedRange);
  }
  getBlockClipboardInfo(model: BaseBlockModel, begin?: number, end?: number) {
    const service = this._pageBlock.getService(model.flavour);
    // FIXME: remove ts-ignore
    // @ts-ignore
    const html = service.block2html(model, { begin, end });
    // FIXME: remove ts-ignore
    // @ts-ignore
    const text = service.block2Text(model, { begin, end });
    // FIXME: the presence of children is not considered
    // Children json info is collected by its parent, but getCurrentBlockRange.models return parent and children at same time, it should be separated
    // FIXME: remove ts-ignore
    // @ts-ignore
    const json = service.block2Json(model, begin, end);

    return {
      html,
      text,
      json,
    };
  }

  private _getOptimalClipboardData(
    clipboardData: ClipboardEvent['clipboardData']
  ) {
    for (let i = 0; i < this._optimalMimeTypes.length; i++) {
      const mimeType = this._optimalMimeTypes[i];
      const data = clipboardData?.getData(mimeType);
      if (data) {
        return {
          type: mimeType,
          data,
        };
      }
    }
    return null;
  }

  private _clipboardData2Blocks(
    clipboardData: ClipboardEvent['clipboardData']
  ) {
    if (clipboardData && isPureFileInClipboard(clipboardData)) {
      return;
    }

    const optimalClipboardData = this._getOptimalClipboardData(clipboardData);

    if (optimalClipboardData?.type === CLIPBOARD_MIMETYPE.BLOCKS_CLIP_WRAPPED) {
      return JSON.parse(optimalClipboardData.data);
    }
    if (optimalClipboardData?.type === CLIPBOARD_MIMETYPE.HTML) {
      console.log('html');
    }
  }
}
