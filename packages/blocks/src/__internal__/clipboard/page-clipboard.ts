import type { UIEventStateContext } from '@blocksuite/block-std';
import type { Page } from '@blocksuite/store';
import { assertExists } from '@blocksuite/store';

import { getService } from '../../__internal__/service.js';
import type { DocPageBlockComponent } from '../../page-block/index.js';
import { deleteModelsByRange } from '../../page-block/index.js';
import { activeEditorManager } from '../utils/active-editor-manager.js';
import { getCurrentBlockRange } from '../utils/index.js';
import type { Clipboard } from './type.js';
import {
  clipboardData2Blocks,
  copyBlocks,
  textedClipboardData2Blocks,
} from './utils/commons.js';

// TODO: getCurrentBlockRange can not get embed block when selection is native, so clipboard can not copy embed block

export class PageClipboard implements Clipboard {
  _page!: Page;
  _ele: DocPageBlockComponent;
  constructor(pageEle: DocPageBlockComponent) {
    this._ele = pageEle;
  }

  init(page: Page) {
    this._page = page;

    this._ele.handleEvent('cut', ctx => {
      this._onCut(ctx);
    });
    this._ele.handleEvent('copy', ctx => {
      this._onCopy(ctx);
    });
    this._ele.handleEvent('paste', ctx => {
      this._onPaste(ctx);
    });
  }

  dispose() {
    // Empty
  }

  private _onPaste = async (ctx: UIEventStateContext) => {
    const e = ctx.get('clipboardState').raw;

    if (!activeEditorManager.isActive(this._ele)) {
      return;
    }
    const range = getCurrentBlockRange(this._page);
    if (!e.clipboardData || !range) {
      return;
    }
    e.preventDefault();

    let blocks = [];
    const focusedBlockModel = deleteModelsByRange(this._page, range);
    // This assert is unreliable
    // but it's reasonable to paste nothing when focus block is not found
    assertExists(focusedBlockModel);
    if (['affine:code'].includes(focusedBlockModel?.flavour ?? '')) {
      blocks = await textedClipboardData2Blocks(this._page, e.clipboardData);
    } else {
      blocks = await clipboardData2Blocks(this._page, e.clipboardData);
    }

    if (!blocks.length) {
      return;
    }
    this._page.captureSync();

    const service = getService(focusedBlockModel.flavour);
    assertExists(range);
    await service.json2Block(focusedBlockModel, blocks, range);

    this._page.captureSync();

    this._page.slots.pasted.emit(blocks);
  };

  private _onCopy = async (
    ctx: UIEventStateContext,
    range = getCurrentBlockRange(this._page)
  ) => {
    const e = ctx.get('clipboardState').raw;

    if (!activeEditorManager.isActive(this._ele)) {
      return;
    }
    if (!range) {
      return;
    }
    e.preventDefault();
    this._page.captureSync();

    await copyBlocks(range);

    this._page.captureSync();

    this._page.slots.copied.emit();
  };

  private _onCut = async (ctx: UIEventStateContext) => {
    const e = ctx.get('clipboardState').raw;

    if (!activeEditorManager.isActive(this._ele)) {
      return;
    }
    const range = getCurrentBlockRange(this._page);
    if (!range) {
      return;
    }
    e.preventDefault();
    await this._onCopy(ctx, range);
    deleteModelsByRange(this._page, range);
  };
}
