import {
  getCurrentBlockRange,
  getDefaultPageBlock,
  getRichTextByModel,
  handleBlockSelectionBatchDelete,
  OpenBlockInfo,
} from '@blocksuite/blocks';
import {
  deleteModelsByRange,
  getStartModelBySelection,
  handleBlockSplit,
} from '@blocksuite/blocks';
import type { BlockModels } from '@blocksuite/global/types';
import { assertExists, matchFlavours } from '@blocksuite/global/utils';
import { BaseBlockModel, DeltaOperation, Text } from '@blocksuite/store';

import type { EditorContainer } from '../../components/index.js';
import { MarkdownUtils } from './markdown-utils.js';
import { CLIPBOARD_MIMETYPE } from './types.js';
import { getSelectInfo } from './utils.js';

export class PasteManager {
  private _editor: EditorContainer;

  // The event handler will get the most needed clipboard data based on this array order
  private static _optimalMimeTypes: string[] = [
    CLIPBOARD_MIMETYPE.BLOCKS_CLIP_WRAPPED,
    CLIPBOARD_MIMETYPE.HTML,
    CLIPBOARD_MIMETYPE.TEXT,
  ];

  constructor(editor: EditorContainer) {
    this._editor = editor;
  }

  public handlePaste = async (e: ClipboardEvent) => {
    const clipboardData = e.clipboardData;
    if (clipboardData) {
      const isPlainText = PasteManager._isPlainText(clipboardData);
      if (isPlainText) {
        const data = clipboardData.getData('text/plain');
        if (data === 'text/plain') {
          return;
        } else {
          if (
            document.activeElement?.classList.contains(
              'affine-default-page-block-title'
            )
          ) {
            // leave the copy to the default behavior
            return;
          }
        }
      }

      const blocksPromise = this._clipboardEvent2Blocks(e);
      if (blocksPromise instanceof Promise) {
        e.preventDefault();
        e.stopPropagation();
        const blocks: OpenBlockInfo[] = await blocksPromise;
        const page = this._editor.page;
        const blockRange = getCurrentBlockRange(page);
        if (blockRange && blockRange.type !== 'Native') {
          if (
            !blockRange.models.every(model => model.flavour === 'affine:list')
          ) {
            handleBlockSelectionBatchDelete(page, blockRange.models);
            const pageBlock = getDefaultPageBlock(blockRange.models[0]);
            pageBlock.selection.clear();
            requestAnimationFrame(() => {
              this.insertBlocks(blocks);
            });
          }
        }
        this.insertBlocks(blocks);
      }
    }
  };

  /* FIXME
              private get _selection() {
                const page =
                  document.querySelector<DefaultPageBlockComponent>('default-page-block');
                if (!page) throw new Error('No page block');
                return page.selection;
              }
              */

  private _clipboardEvent2Blocks(
    e: ClipboardEvent
  ): Promise<OpenBlockInfo[]> | void {
    const clipboardData = e.clipboardData;
    if (!clipboardData) {
      return;
    }

    const isPureFile = PasteManager._isPureFileInClipboard(clipboardData);
    if (isPureFile) {
      return this._file2Blocks(clipboardData);
    }
    return this._clipboardData2Blocks(clipboardData);
  }

  // Get the most needed clipboard data based on `_optimalMimeTypes` order
  public getOptimalClip(clipboardData: ClipboardEvent['clipboardData']) {
    for (let i = 0; i < PasteManager._optimalMimeTypes.length; i++) {
      const mimeType = PasteManager._optimalMimeTypes[i];
      const data = clipboardData?.getData(mimeType);

      if (data) {
        return {
          type: mimeType,
          data: data,
        };
      }
    }

    return null;
  }

  private async _clipboardData2Blocks(clipboardData: DataTransfer) {
    const optimalClip = this.getOptimalClip(clipboardData);
    if (optimalClip?.type === CLIPBOARD_MIMETYPE.BLOCKS_CLIP_WRAPPED) {
      const clipInfo = JSON.parse(optimalClip.data);
      return clipInfo.data;
    }

    const textClipData = clipboardData.getData(CLIPBOARD_MIMETYPE.TEXT);
    const maybeModel = getStartModelBySelection();
    const shouldNotSplitBlock =
      maybeModel && maybeModel.flavour === 'affine:code';
    if (shouldNotSplitBlock) {
      return [{ text: [{ insert: textClipData }], children: [] }];
    }
    const shouldConvertMarkdown =
      MarkdownUtils.checkIfTextContainsMd(textClipData);
    if (
      optimalClip?.type === CLIPBOARD_MIMETYPE.HTML &&
      !shouldConvertMarkdown
    ) {
      return this._editor.contentParser.htmlText2Block(optimalClip.data);
    }

    if (shouldConvertMarkdown) {
      return await this._editor.contentParser.markdown2Block(textClipData);
    }

    return this._editor.contentParser.text2blocks(textClipData);
  }

  private async _file2Blocks(
    clipboardData: DataTransfer
  ): Promise<OpenBlockInfo[]> {
    const file = PasteManager._getImageFile(clipboardData);
    // assertExists(file)
    if (file) {
      if (file.type.includes('image')) {
        //  todo upload file to file server
        const storage = await this._editor.page.blobs;
        assertExists(storage);
        const id = await storage.set(file);
        return [
          {
            flavour: 'affine:embed',
            type: 'image',
            sourceId: id,
            children: [],
            text: [{ insert: '' }],
          },
        ];
      }
    }
    return [];
  }

  private static _isPlainText(clipboardData: DataTransfer) {
    const types = clipboardData.types;
    return types[0] === 'text/plain';
  }

  private static _isPureFileInClipboard(clipboardData: DataTransfer) {
    const types = clipboardData.types;
    return (
      (types.length === 1 && types[0] === 'Files') ||
      (types.length === 2 &&
        (types.includes('text/plain') || types.includes('text/html')) &&
        types.includes('Files'))
    );
  }

  private static _getImageFile(clipboardData: DataTransfer) {
    const files = clipboardData.files;
    if (files && files[0] && files[0].type.indexOf('image') > -1) {
      return files[0];
    }
    return;
  }

  // TODO Max 15 deeper
  public insertBlocks(
    blocks: OpenBlockInfo[],
    selectionInfo = getSelectInfo(this._editor.page)
  ) {
    if (blocks.length === 0) {
      return;
    }

    if (selectionInfo.type === 'Range' || selectionInfo.type === 'Caret') {
      const lastBlock =
        selectionInfo.selectedBlocks[selectionInfo.selectedBlocks.length - 1];
      const selectedBlock = this._editor.page.getBlockById(lastBlock.id);
      let parent = selectedBlock;
      let index = 0;
      if (selectedBlock) {
        if (matchFlavours(selectedBlock, ['affine:page'] as const)) {
          if (matchFlavours(selectedBlock.children[0], ['affine:frame'])) {
            parent = selectedBlock.children[0];
          } else {
            const id = this._editor.page.addBlockByFlavour(
              'affine:frame',
              {},
              selectedBlock.id
            );
            parent = this._editor.page.getBlockById(id);
          }
        } else if (!matchFlavours(selectedBlock, ['affine:frame'])) {
          parent = this._editor.page.getParent(selectedBlock);
          index = (parent?.children.indexOf(selectedBlock) || 0) + 1;
        }
      }
      const addBlockIds: string[] = [];
      if (selectedBlock && !matchFlavours(selectedBlock, ['affine:page'])) {
        const endIndex = lastBlock.endPos ?? (selectedBlock?.text?.length || 0);
        const insertTexts = blocks[0].text;
        const insertLen = insertTexts.reduce(
          (len: number, value: DeltaOperation) => {
            return len + ((value.insert as string) || '').length;
          },
          0
        );
        // when the cursor is inside code block, insert raw texts into code block
        if (selectedBlock.flavour === 'affine:code') {
          const texts: DeltaOperation[] = [];
          const dfs = (blocks: OpenBlockInfo[]) => {
            blocks.forEach(block => {
              texts.push(...block.text, { insert: '\n' });
              if (block.children.length !== 0) {
                dfs(block.children);
              }
            });
          };
          dfs(blocks);
          texts.splice(texts.length - 1, 1);
          selectedBlock?.text?.insertList(texts, endIndex);
        } else if (
          ['affine:divider', 'affine:embed', 'affine:code'].includes(
            blocks[0].flavour
          )
        ) {
          if (['affine:divider', 'affine:embed'].includes(blocks[0].flavour))
            selectedBlock?.text?.insertList(insertTexts, endIndex);

          selectedBlock &&
            this._addBlocks(blocks[0].children, selectedBlock, 0, addBlockIds);

          parent &&
            this._addBlocks(blocks.slice(0), parent, index, addBlockIds);
          const lastBlockModel = this._editor.page.getBlockById(lastBlock.id);
          // On pasting 'affine:divider', 'affine:embed', 'affine:code' block,  replace the last empty focused paragraph
          // instead of appending a new image block, if this paragraph is empty.
          if (
            lastBlockModel &&
            matchFlavours(lastBlockModel, ['affine:paragraph'] as const) &&
            lastBlockModel?.text?.length === 0 &&
            lastBlockModel?.children.length === 0
          ) {
            this._editor.page.deleteBlock(lastBlockModel);
          }
        } else {
          const lastBlockModel = this._editor.page.getBlockById(lastBlock.id);

          // if current paragraph is an empty frame, delete it after inserting other blocks.
          if (
            endIndex === 0 &&
            insertLen > 0 &&
            parent &&
            lastBlockModel &&
            matchFlavours(lastBlockModel, ['affine:paragraph'] as const) &&
            lastBlockModel?.text?.length === 0 &&
            lastBlockModel?.children.length === 0
          ) {
            this._addBlocks(blocks.slice(0, 1), parent, index, addBlockIds);
            this._editor.page.deleteBlock(lastBlockModel);
          } else {
            if (selectionInfo.type === 'Range') {
              const textLength = selectedBlock.text?.length as number;
              deleteModelsByRange(this._editor.page);
              const startPos = selectionInfo.selectedBlocks[0]
                .startPos as number;
              const endPos = selectionInfo.selectedBlocks[0].endPos as number;
              if (startPos + endPos === textLength + 1) {
                selectedBlock?.text?.insertList(insertTexts, startPos);
              } else {
                handleBlockSplit(this._editor.page, selectedBlock, startPos, 0);
                selectedBlock?.text?.insertList(insertTexts, startPos);
              }
            } else {
              selectedBlock?.text?.insertList(insertTexts, endIndex);
            }
            selectedBlock &&
              this._addBlocks(
                blocks[0].children,
                selectedBlock,
                0,
                addBlockIds
              );
          }

          parent &&
            this._addBlocks(blocks.slice(1), parent, index, addBlockIds);
        }
        let lastId = selectedBlock?.id;
        let position = endIndex + insertLen;
        if (addBlockIds.length > 0) {
          const endtexts =
            selectedBlock?.text?.sliceToDelta(endIndex + insertLen) || [];
          lastId = addBlockIds[addBlockIds.length - 1];
          const lastBlock = this._editor.page.getBlockById(lastId);
          if (
            lastBlock?.flavour !== 'affine:embed' &&
            lastBlock?.flavour !== 'affine:divider' &&
            blocks[0].flavour !== 'affine:code'
          ) {
            selectedBlock?.text?.delete(
              endIndex + insertLen,
              Math.max(0, selectedBlock.text.length - endIndex - insertLen)
            );
            position = lastBlock?.text?.length || 0;
            lastBlock?.text?.insertList(endtexts, lastBlock?.text?.length);
          }
        }
        setTimeout(() => {
          const block = this._editor.page.getBlockById(lastId);
          if (block) {
            const richText = getRichTextByModel(block);
            const vEditor = richText?.vEditor;
            if (vEditor) {
              vEditor.setVRange({
                index: position,
                length: 0,
              });
            }
          }
        });
      } else {
        parent && this._addBlocks(blocks, parent, index, addBlockIds);
      }
    } else if (selectionInfo.type === 'Block') {
      const selectedBlock = this._editor.page.getBlockById(
        selectionInfo.selectedBlocks[selectionInfo.selectedBlocks.length - 1].id
      );

      let parent = selectedBlock;
      let index = 0;
      if (selectedBlock) {
        if (matchFlavours(selectedBlock, ['affine:page'] as const)) {
          if (matchFlavours(selectedBlock.children[0], ['affine:frame'])) {
            parent = selectedBlock.children[0];
          } else {
            const id = this._editor.page.addBlockByFlavour(
              'affine:frame',
              {},
              selectedBlock.id
            );
            parent = this._editor.page.getBlockById(id);
          }
        } else if (!matchFlavours(selectedBlock, ['affine:frame'])) {
          parent = this._editor.page.getParent(selectedBlock);
          index = (parent?.children.indexOf(selectedBlock) || 0) + 1;
        }
      }
      const addBlockIds: string[] = [];
      parent && this._addBlocks(blocks, parent, index, addBlockIds);
      // FIXME
      // this._selection.selectedBlockIds = addBlockIds;
    }
  }

  private _addBlocks(
    blocks: OpenBlockInfo[],
    parent: BaseBlockModel,
    index: number,
    addBlockIds: string[]
  ) {
    blocks.forEach((block, i) => {
      const flavour = block.flavour as keyof BlockModels;
      const blockProps = {
        type: block.type as string,
        checked: block.checked,
        sourceId: block.sourceId,
        caption: block.caption,
        width: block.width,
        height: block.height,
        language: block.language,
      };
      const id = this._editor.page.addBlockByFlavour(
        flavour,
        blockProps,
        parent,
        index + i
      );
      const model = this._editor.page.getBlockById(id);

      const initialProps =
        flavour && this._editor.page.getInitialPropsMapByFlavour(flavour);
      if (initialProps && initialProps.text instanceof Text) {
        block.text && model?.text?.applyDelta(block.text);
      }

      addBlockIds.push(id);
      model && this._addBlocks(block.children, model, 0, addBlockIds);
    });
  }
}
