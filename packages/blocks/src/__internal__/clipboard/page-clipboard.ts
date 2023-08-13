import type { UIEventStateContext } from '@blocksuite/block-std';
import type { Page } from '@blocksuite/store';
import { assertExists } from '@blocksuite/store';

import type { DocPageBlockComponent } from '../../page-block/index.js';
import { getTextSelection } from '../../page-block/utils/selection.js';
import { getService } from '../service/index.js';
import { activeEditorManager } from '../utils/active-editor-manager.js';
import type { Clipboard } from './type.js';
import {
  clipboardData2Blocks,
  copyBlocksInPage,
  textedClipboardData2Blocks,
} from './utils/commons.js';
import { deleteModelsByTextSelection } from './utils/operation.js';

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
    this._ele.handleEvent(
      'paste',
      ctx => {
        this._onPaste(ctx);
      },
      {
        global: true,
      }
    );
  }

  dispose() {
    // Empty
  }

  private _onPaste = async (ctx: UIEventStateContext) => {
    const e = ctx.get('clipboardState').raw;

    if (!activeEditorManager.isActive(this._ele)) {
      return;
    }

    const textSelection = getTextSelection(this._ele);

    if (!e.clipboardData || !textSelection) {
      return;
    }
    e.preventDefault();

    let blocks = [];
    const focusedBlockModel = deleteModelsByTextSelection(
      this._ele,
      textSelection
    );
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
    await service.json2Block(focusedBlockModel, blocks, textSelection.from);

    this._page.captureSync();

    this._page.slots.pasted.emit(blocks);
  };

  private _onCopy = async (ctx: UIEventStateContext) => {
    const e = ctx.get('clipboardState').raw;

    if (!activeEditorManager.isActive(this._ele)) {
      return;
    }

    e.preventDefault();
    this._page.captureSync();

    await copyBlocksInPage(this._ele);

    this._page.captureSync();

    this._page.slots.copied.emit();
  };

  private _onCut = async (ctx: UIEventStateContext) => {
    const e = ctx.get('clipboardState').raw;

    if (!activeEditorManager.isActive(this._ele)) {
      return;
    }
    const textSelection = getTextSelection(this._ele);
    if (!textSelection) {
      return;
    }
    e.preventDefault();
    await this._onCopy(ctx);
    deleteModelsByTextSelection(this._ele, textSelection);
  };
}
