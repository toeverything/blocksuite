import type { UIEventStateContext } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { Page } from '@blocksuite/store';

import type { DocPageBlockComponent } from '../../page-block/index.js';
import { getService } from '../service/index.js';
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

    const textSelection = this._ele.selection.find('text');

    if (!e.clipboardData || !textSelection) {
      return;
    }
    e.preventDefault();

    let blocks = [];
    const focusedBlockModel = deleteModelsByTextSelection(
      this._ele.root,
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
    console.log(blocks);
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

    e.preventDefault();
    this._page.captureSync();

    await this._copyBlocksInPage();

    this._page.captureSync();

    this._page.slots.copied.emit();
  };

  private async _copyBlocksInPage() {
    return await copyBlocksInPage(this._ele.root);
  }

  private _onCut = async (ctx: UIEventStateContext) => {
    const e = ctx.get('clipboardState').raw;

    const textSelection = this._ele.selection.find('text');
    if (textSelection) {
      e.preventDefault();
      await this._onCopy(ctx);
      deleteModelsByTextSelection(this._ele.root, textSelection);
      return;
    }
    const blockSelections = this._ele.selection.filter('block');
    e.preventDefault();
    await this._onCopy(ctx);
    blockSelections.forEach(block => {
      const model = this._page.getBlockById(block.blockId);
      if (!model) {
        return;
      }
      this._page.deleteBlock(model);
    });
  };
}
