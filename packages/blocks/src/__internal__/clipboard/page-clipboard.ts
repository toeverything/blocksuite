import type { BaseBlockModel } from '@blocksuite/store';
import { assertExists, Text } from '@blocksuite/store';

import type { DefaultPageBlockComponent } from '../../page-block/index.js';
import { deleteModelsByRange } from '../../page-block/index.js';
import { handleBlockSplit } from '../rich-text/rich-text-operations.js';
import {
  getCurrentBlockRange,
  getCurrentNativeRange,
  getRichTextByModel,
  hasNativeSelection,
  OpenBlockInfo,
  resetNativeSelection,
} from '../utils/index.js';
import { ClipboardItem } from './clipboard-item.js';
import type { Clipboard } from './type.js';
import {
  CLIPBOARD_MIMETYPE,
  isPureFileInClipboard,
  performNativeCopy,
} from './utils.js';
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
    this._insertClipboardBlocks(blocks);
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
    const text = service.block2Text(model, { begin, end });

    // FIXME: shouldHaveClipboard is not enough
    // Children json info is collected by its parent,
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
    console.log('optimalClipboardData', optimalClipboardData);

    if (optimalClipboardData?.type === CLIPBOARD_MIMETYPE.BLOCKS_CLIP_WRAPPED) {
      return JSON.parse(optimalClipboardData.data);
    }
  }

  private _insertClipboardBlocks(blocks: OpenBlockInfo[]) {
    // If selected is block not native selection, need to wait for a requestAnimationFrame to get the correct range
    requestAnimationFrame(() => {
      const range = getCurrentBlockRange(this._pageBlock.page);
      assertExists(range);
      // After deleteModelsByRange, selected block is must only, and selection is must caret
      const focusedBlock = range.models[0];
      const firstBlock = blocks[0];
      const lastBlock = blocks[blocks.length - 1];
      const shouldMergeFirstBlock = firstBlock.text && focusedBlock.text;
      const shouldMergeLastBlock = focusedBlock.text && lastBlock.text;
      const parent = this._pageBlock.page.getParent(focusedBlock);
      assertExists(parent);

      if (blocks.length === 1) {
        if (shouldMergeFirstBlock) {
          focusedBlock.text?.insertList(firstBlock.text, range.startOffset);

          // TODO: optimize textLength
          const textLength = firstBlock.text.reduce((sum, data) => {
            return sum + (data.insert?.length || 0);
          }, 0);
          getRichTextByModel(focusedBlock)?.quill.setSelection(
            range.startOffset + textLength,
            0
          );
        } else {
          handleBlockSplit(
            this._pageBlock.page,
            focusedBlock,
            range.startOffset,
            0
          );
          this._addBlocks(
            blocks,
            parent,
            parent.children.indexOf(focusedBlock)
          );
          // TODO: set selection
        }
        return;
      }

      handleBlockSplit(
        this._pageBlock.page,
        focusedBlock,
        range.startOffset,
        0
      );

      if (shouldMergeFirstBlock) {
        focusedBlock.text?.insertList(firstBlock.text, range.startOffset);
      }

      const insertPosition =
        parent.children.indexOf(focusedBlock) + (shouldMergeFirstBlock ? 1 : 0);
      const ids = this._addBlocks(
        blocks.slice(shouldMergeFirstBlock ? 1 : 0),
        parent,
        insertPosition
      );

      const lastModel = this._pageBlock.page.getBlockById(ids[ids.length - 1]);
      if (shouldMergeLastBlock) {
        assertExists(lastModel);
        const rangeOffset = lastModel.text?.length || 0;
        const nextSiblingModel = this._pageBlock.page.getNextSibling(lastModel);
        lastModel.text?.join(nextSiblingModel?.text as Text);
        assertExists(nextSiblingModel);
        this._pageBlock.page.deleteBlock(nextSiblingModel);

        getRichTextByModel(lastModel)?.quill.setSelection(rangeOffset, 0);
      } else {
        if (lastModel?.text) {
          getRichTextByModel(lastModel)?.quill.setSelection(
            lastModel.text?.length,
            0
          );
        } else {
          // TODO: set selection
        }
      }
    });
  }

  // TODO: used old code, need optimize
  private _addBlocks(
    blocks: OpenBlockInfo[],
    parent: BaseBlockModel,
    index: number
  ) {
    const addedBlockIds = [];
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const blockProps = {
        flavour: block.flavour as string,
        type: block.type as string,
        checked: block.checked,
        sourceId: block.sourceId,
        caption: block.caption,
        width: block.width,
        height: block.height,
        language: block.language,
      };
      const id = this._pageBlock.page.addBlock(blockProps, parent, index + i);
      addedBlockIds.push(id);
      const model = this._pageBlock.page.getBlockById(id);

      const flavour = model?.flavour;
      const initialProps =
        flavour && this._pageBlock.page.getInitialPropsMapByFlavour(flavour);
      if (initialProps && initialProps.text instanceof Text) {
        block.text && model?.text?.applyDelta(block.text);
      }

      model && this._addBlocks(block.children, model, 0);
    }
    return addedBlockIds;
  }
}
