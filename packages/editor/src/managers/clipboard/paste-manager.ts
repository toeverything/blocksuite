import { BaseBlockModel } from '@blocksuite/store';
import { marked } from 'marked';
import { EditorContainer } from '../../components';
import { MarkdownUtils } from './markdown-utils';
import { CLIPBOARD_MIMETYPE, OpenBlockInfo } from './types';
import { SelectionUtils } from '@blocksuite/blocks';

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
    this._insertBlocks(blocks);
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
      const underline = {
        name: 'underline',
        level: 'inline',
        start(src: string) {
          return src.indexOf('~');
        },
        tokenizer(src: string) {
          const rule = /^~([^~]+)~/;
          const match = rule.exec(src);
          if (match) {
            return {
              type: 'underline',
              raw: match[0], // This is the text that you want your token to consume from the source
              text: match[1].trim(), // You can add additional properties to your tokens to pass along to the renderer
            };
          }
          return;
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        renderer(token: any) {
          return `<u>${token.text}</u>`;
        },
      };
      marked.use({ extensions: [underline] });
      const md2html = marked.parse(textClipData);
      return this._editor.contentParser.htmlText2Block(md2html);
    }

    return this._editor.contentParser.text2blocks(textClipData);
  }

  private async _file2Blocks(
    clipboardData: DataTransfer
  ): Promise<OpenBlockInfo[]> {
    const file = PasteManager._getImageFile(clipboardData);
    if (file) {
      //  todo upload file to file server
      return [];
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
  private _insertBlocks(blocks: OpenBlockInfo[]) {
    if (blocks.length === 0) {
      return;
    }
    const currentSelectionInfo = SelectionUtils.getSelectInfo();
    if (
      currentSelectionInfo.type === 'Range' ||
      currentSelectionInfo.type === 'Caret'
    ) {
      const lastBlock =
        currentSelectionInfo.selectedBlocks[
          currentSelectionInfo.selectedBlocks.length - 1
        ];
      // TODO split selected block case
      const selectedBlock = this._editor.store.getBlockById(lastBlock.id);

      let parent = selectedBlock;
      let index = 0;
      if (selectedBlock && selectedBlock.flavour !== 'page') {
        parent = this._editor.store.getParent(selectedBlock);
        index = (parent?.children.indexOf(selectedBlock) || 0) + 1;
      }

      const addBlockIds: string[] = [];
      if (selectedBlock?.flavour !== 'page') {
        const endIndex = lastBlock.endPos || selectedBlock?.text?.length || 0;
        const endtext = selectedBlock?.text?.sliceToDelta(endIndex);
        // todo the last block
        blocks[blocks.length - 1].text.push(...endtext);
        selectedBlock?.text?.delete(endIndex, selectedBlock?.text?.length);
        const insertTexts = blocks[0].text;
        for (let i = insertTexts.length - 1; i >= 0; i--) {
          selectedBlock?.text?.insert(
            (insertTexts[i].insert as string) || '',
            endIndex,
            // eslint-disable-next-line @typescript-eslint/ban-types
            insertTexts[i].attributes as Object | undefined
          );
        }
        selectedBlock &&
          this._addBlocks(blocks[0].children, selectedBlock, -1, addBlockIds);
      }

      parent && this._addBlocks(blocks.slice(1), parent, index, addBlockIds);
      // FIXME
      // this._selection.selectedBlockIds = addBlockIds;
    } else if (currentSelectionInfo.type === 'Block') {
      const selectedBlock = this._editor.store.getBlockById(
        currentSelectionInfo.selectedBlocks[
          currentSelectionInfo.selectedBlocks.length - 1
        ].id
      );

      let parent = selectedBlock;
      let index = -1;
      if (selectedBlock && selectedBlock.flavour !== 'page') {
        parent = this._editor.store.getParent(selectedBlock);
        index = (parent?.children.indexOf(selectedBlock) || 0) + 1;
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
      };
      const id = this._editor.store.addBlock(blockProps, parent, index + i);
      const model = this._editor.store.getBlockById(id);
      block.text && model?.text?.applyDelta(block.text);
      addBlockIds.push(id);
      model && this._addBlocks(block.children, model, 0, addBlockIds);
    }
  }
}
