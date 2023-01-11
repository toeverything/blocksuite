import type { BaseBlockModel } from '@blocksuite/store';
import type { EditorContainer } from '../../components/index.js';
import { MarkdownUtils } from './markdown-utils.js';
import { CLIPBOARD_MIMETYPE, OpenBlockInfo } from './types.js';
import {
  SelectionUtils,
  SelectionInfo,
  matchFlavours,
  assertExists,
  getStartModelBySelection,
} from '@blocksuite/blocks';
import type { DeltaOperation } from 'quill';

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
    const shouldNotSplitBlock =
      getStartModelBySelection().flavour === 'affine:code';
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
  public insertBlocks(blocks: OpenBlockInfo[], selectInfo?: SelectionInfo) {
    if (blocks.length === 0) {
      return;
    }

    const currentSelectionInfo =
      selectInfo || SelectionUtils.getSelectInfo(this._editor.page);
    if (
      currentSelectionInfo.type === 'Range' ||
      currentSelectionInfo.type === 'Caret'
    ) {
      const lastBlock =
        currentSelectionInfo.selectedBlocks[
          currentSelectionInfo.selectedBlocks.length - 1
        ];
      const selectedBlock = this._editor.page.getBlockById(lastBlock.id);
      let parent = selectedBlock;
      let index = 0;
      if (selectedBlock) {
        if (matchFlavours(selectedBlock, ['affine:page'])) {
          if (matchFlavours(selectedBlock.children[0], ['affine:frame'])) {
            parent = selectedBlock.children[0];
          } else {
            const id = this._editor.page.addBlock(
              { flavour: 'affine:frame' },
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
        selectedBlock?.text?.insertList(insertTexts, endIndex);
        selectedBlock &&
          this._addBlocks(blocks[0].children, selectedBlock, 0, addBlockIds);
        //This is a temporary processing of the divider block, subsequent refactoring of the divider will remove it
        if (
          blocks[0].flavour === 'affine:divider' ||
          blocks[0].flavour === 'affine:embed'
        ) {
          parent &&
            this._addBlocks(blocks.slice(0), parent, index, addBlockIds);
          const lastBlockModel = this._editor.page.getBlockById(lastBlock.id);
          // On pasting image,  replace the last empty focused paragraph instead of appending a new image block,
          // if this paragraph is empty.
          if (
            lastBlockModel &&
            matchFlavours(lastBlockModel, ['affine:paragraph']) &&
            lastBlockModel?.text?.length === 0 &&
            lastBlockModel?.children.length === 0
          ) {
            this._editor.page.deleteBlock(lastBlockModel);
          }
        } else {
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
            lastBlock?.flavour !== 'affine:divider'
          ) {
            selectedBlock?.text?.delete(
              endIndex + insertLen,
              selectedBlock?.text?.length
            );
            position = lastBlock?.text?.length || 0;
            lastBlock?.text?.insertList(endtexts, lastBlock?.text?.length);
          }
        }
        setTimeout(() => {
          lastId &&
            this._editor.page.richTextAdapters
              .get(lastId)
              ?.quill.setSelection(position, 0);
        });
      } else {
        parent && this._addBlocks(blocks, parent, index, addBlockIds);
      }
    } else if (currentSelectionInfo.type === 'Block') {
      const selectedBlock = this._editor.page.getBlockById(
        currentSelectionInfo.selectedBlocks[
          currentSelectionInfo.selectedBlocks.length - 1
        ].id
      );

      let parent = selectedBlock;
      let index = 0;
      if (selectedBlock) {
        if (matchFlavours(selectedBlock, ['affine:page'])) {
          if (matchFlavours(selectedBlock.children[0], ['affine:frame'])) {
            parent = selectedBlock.children[0];
          } else {
            const id = this._editor.page.addBlock(
              { flavour: 'affine:frame' },
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
      const id = this._editor.page.addBlock(blockProps, parent, index + i);
      const model = this._editor.page.getBlockById(id);
      if (model && !matchFlavours(model, ['affine:embed', 'affine:divider'])) {
        block.text && model?.text?.applyDelta(block.text);
      }
      addBlockIds.push(id);
      model && this._addBlocks(block.children, model, 0, addBlockIds);
    }
  }
}
