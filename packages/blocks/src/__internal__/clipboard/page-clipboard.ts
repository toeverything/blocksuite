import type { BaseBlockModel } from '@blocksuite/store';

import type { DefaultPageBlockComponent } from '../../page-block/index.js';
import { deleteModelsByRange } from '../../page-block/utils/container-operations.js';
import { getCurrentBlockRange } from '../utils/index.js';
import { ClipboardItem } from './clipboard-item.js';
import type { Clipboard } from './type.js';
import { CLIPBOARD_MIMETYPE, performNativeCopy } from './utils.js';
export class PageClipboard implements Clipboard {
  private _pageBlock!: DefaultPageBlockComponent;
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
    const { focusedBlockIndex, selectedBlocks, selectedEmbeds } =
      this._pageBlock.selection.state;
    return (
      focusedBlockIndex !== -1 || selectedBlocks.length || selectedEmbeds.length
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
    // const range = getCurrentBlockRange(this._pageBlock.page);
    // console.log('range', range);
    //
  }
  private _onPaste(e: ClipboardEvent) {
    if (!this._shouldContinue()) {
      return;
    }
    e.preventDefault();
    deleteModelsByRange(this._pageBlock.page);
  }

  copy() {
    const range = getCurrentBlockRange(this._pageBlock.page);
    if (!range) {
      return;
    }

    const clipGroups = range.models.map((model, index) => {
      if (index === 0) {
        return this.getBlockClipInfo(
          model,
          range.startOffset,
          index === range.models.length - 1 ? range.endOffset : undefined
        );
      }
      if (index === range.models.length - 1) {
        return this.getBlockClipInfo(model, undefined, range.endOffset);
      }
      return this.getBlockClipInfo(model);
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
        clipGroups
          .filter(group => group.clipboard)
          .map(group => group.clipboard)
      )
    );

    performNativeCopy([
      textClipboardItem,
      htmlClipboardItem,
      customClipboardItem,
    ]);
  }
  getBlockClipInfo(model: BaseBlockModel, begin?: number, end?: number) {
    const service = this._pageBlock.getService(model.flavour);
    // FIXME: remove ts-ignore
    // @ts-ignore
    const html = service.block2html(model, { begin, end });
    const text = service.block2Text(model, { begin, end });

    // FIXME: shouldHaveClipboard is not enough
    // Children clipboard info is collected by its parent,
    // it seems like just list block has children, this judgement is not enough.
    const shouldHaveClipboard =
      model.page.getParent(model)?.flavour === model.flavour;
    const clipboard = shouldHaveClipboard
      ? service.block2Clipboard(model, begin, end)
      : undefined;

    return {
      html,
      text,
      clipboard,
    };
  }
}
