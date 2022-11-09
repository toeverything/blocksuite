import { BaseBlockModel } from '@blocksuite/store';
import { EditorContainer } from '../../components';
import { MarkdownUtils } from './markdown-utils';
import { CLIPBOARD_MIMETYPE, OpenBlockInfo } from './types';
import { SelectionUtils, SelectionInfo } from '@blocksuite/blocks';

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
    this.handlePaste = this.handlePaste.bind(this);
  }

  public async handlePaste(e: ClipboardEvent) {
    e.preventDefault();
    e.stopPropagation();

    const blocks = await this._clipboardEvent2Blocks(e);
    this.insertBlocks(blocks);
  }

  /* FIXME
  private get _selection() {
    const page =
      document.querySelector<DefaultPageBlockComponent>('default-page-block');
    if (!page) throw new Error('No page block');
    return page.selection;
  }
  */

  private async _clipboardEvent2Blocks(e: ClipboardEvent) {
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

    const shouldConvertMarkdown =
      MarkdownUtils.checkIfTextContainsMd(textClipData);
    if (
      optimalClip?.type === CLIPBOARD_MIMETYPE.HTML &&
      !shouldConvertMarkdown
    ) {
      return this._editor.contentParser.htmlText2Block(optimalClip.data);
    }

    if (shouldConvertMarkdown) {
      return this._editor.contentParser.markdown2Block(textClipData);
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
        const url = URL.createObjectURL(file);
        return [
          // FIXME: Add two img blocks I should only add one
          {
            flavour: 'affine:embed',
            type: 'image',
            source: url,
            children: [],
            text: [{ insert: '' }],
          },
          {
            flavour: 'affine:embed',
            type: 'image',
            source: url,
            children: [],
            text: [{ insert: '' }],
          },
        ];
      }
    }
    return [];
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
      selectInfo || SelectionUtils.getSelectInfo(this._editor.space);
    if (
      currentSelectionInfo.type === 'Range' ||
      currentSelectionInfo.type === 'Caret'
    ) {
      const lastBlock =
        currentSelectionInfo.selectedBlocks[
          currentSelectionInfo.selectedBlocks.length - 1
        ];
      const selectedBlock = this._editor.space.getBlockById(lastBlock.id);
      let parent = selectedBlock;
      let index = 0;
      if (selectedBlock) {
        if (selectedBlock.flavour === 'affine:page') {
          if (selectedBlock.children[0]?.flavour === 'affine:group') {
            parent = selectedBlock.children[0];
          } else {
            const id = this._editor.space.addBlock(
              { flavour: 'affine:group' },
              selectedBlock.id
            );
            parent = this._editor.space.getBlockById(id);
          }
        } else if (selectedBlock.flavour !== 'affine:group') {
          parent = this._editor.space.getParent(selectedBlock);
          index = (parent?.children.indexOf(selectedBlock) || 0) + 1;
        }
      }
      const addBlockIds: string[] = [];
      if (selectedBlock?.flavour !== 'affine:page') {
        const endIndex = lastBlock.endPos || selectedBlock?.text?.length || 0;
        const insertTexts = blocks[0].text;
        const insertLen = insertTexts.reduce(
          (len: number, value: Record<string, unknown>) => {
            return len + ((value.insert as string) || '').length;
          },
          0
        );
        selectedBlock?.text?.insertList(insertTexts, endIndex);

        selectedBlock &&
          this._addBlocks(blocks[0].children, selectedBlock, 0, addBlockIds);

        parent && this._addBlocks(blocks.slice(1), parent, index, addBlockIds);
        let lastId = selectedBlock?.id;
        let position = endIndex + insertLen;
        if (addBlockIds.length > 0) {
          const endtexts = selectedBlock?.text?.sliceToDelta(
            endIndex + insertLen
          );
          lastId = addBlockIds[addBlockIds.length - 1];
          const lastBlock = this._editor.space.getBlockById(lastId);
          selectedBlock?.text?.delete(
            endIndex + insertLen,
            selectedBlock?.text?.length
          );
          position = lastBlock?.text?.length || 0;
          lastBlock?.text?.insertList(endtexts, lastBlock?.text?.length);
        }
        setTimeout(() => {
          lastId &&
            this._editor.space.richTextAdapters
              .get(lastId)
              ?.quill.setSelection(position, 0);
        });
      } else {
        parent && this._addBlocks(blocks, parent, index, addBlockIds);
      }
    } else if (currentSelectionInfo.type === 'Block') {
      const selectedBlock = this._editor.space.getBlockById(
        currentSelectionInfo.selectedBlocks[
          currentSelectionInfo.selectedBlocks.length - 1
        ].id
      );

      let parent = selectedBlock;
      let index = 0;
      if (selectedBlock) {
        if (selectedBlock.flavour === 'affine:page') {
          if (selectedBlock.children[0]?.flavour === 'affine:group') {
            parent = selectedBlock.children[0];
          } else {
            const id = this._editor.space.addBlock(
              { flavour: 'affine:group' },
              selectedBlock.id
            );
            parent = this._editor.space.getBlockById(id);
          }
        } else if (selectedBlock.flavour !== 'affine:group') {
          parent = this._editor.space.getParent(selectedBlock);
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
        source: block.source,
      };
      const id = this._editor.space.addBlock(blockProps, parent, index + i);
      const model = this._editor.space.getBlockById(id);
      block.text && model?.text?.applyDelta(block.text);
      addBlockIds.push(id);
      model && this._addBlocks(block.children, model, 0, addBlockIds);
    }
  }
}
