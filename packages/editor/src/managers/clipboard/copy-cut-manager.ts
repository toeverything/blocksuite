import {
  getCurrentBlockRange,
  getDefaultPageBlock,
  handleBlockSelectionBatchDelete,
  OpenBlockInfo,
} from '@blocksuite/blocks';
import {
  deleteModelsByRange,
  EmbedBlockModel,
  getServiceOrRegister,
  ListBlockModel,
  SelectionUtils,
} from '@blocksuite/blocks';
import { assertExists, matchFlavours } from '@blocksuite/global/utils';
import type { DeltaOperation } from 'quill';

import type { EditorContainer } from '../../components/index.js';
import { ClipboardItem } from './item.js';
import { CLIPBOARD_MIMETYPE, SelectedBlock } from './types.js';
import { getSelectInfo } from './utils.js';

export class CopyCutManager {
  private _editor: EditorContainer;

  constructor(editor: EditorContainer) {
    this._editor = editor;
  }

  /** FIXME
   * private get _selection() {
   *       const page =
   *         document.querySelector<DefaultPageBlockComponent>('default-page-block');
   *       if (!page) throw new Error('No page block');
   *       return page.selection;
   *     }
   */
  public handleCopy = async (e: ClipboardEvent) => {
    const clips = await this._getClipItems();
    if (!clips.length) {
      return;
    }

    this._copyToClipboard(e, clips);
  };

  public handleCut = async (e: ClipboardEvent) => {
    await this.handleCopy(e);
    const page = this._editor.page;
    const blockRange = getCurrentBlockRange(page);
    if (!blockRange) {
      return;
    }
    if (blockRange.type === 'Native') {
      deleteModelsByRange(page);
      return;
    }
    handleBlockSelectionBatchDelete(page, blockRange.models);
    const pageBlock = getDefaultPageBlock(blockRange.models[0]);
    pageBlock.selection.clear();
    e.preventDefault();
    return;
  };

  private async _getClipItems() {
    const clips: ClipboardItem[] = [];
    const selectionInfo = getSelectInfo(this._editor.page);
    const selectedBlocks = selectionInfo.selectedBlocks;

    const affineClip = await this._getCustomClip(selectedBlocks);
    affineClip && clips.push(affineClip);

    const textClip = await this._getTextClip(selectedBlocks);
    textClip && clips.push(textClip);

    const htmlClip = await this._getHtmlClip(selectedBlocks);
    htmlClip && clips.push(htmlClip);

    return clips;
  }

  private async _getCustomClip(
    selectedBlocks: SelectedBlock[]
  ): Promise<ClipboardItem | null> {
    const clipInfos = await Promise.all(
      selectedBlocks.map(selectedBlock =>
        this._getClipInfoBySelectionInfo(selectedBlock)
      )
    );
    return new ClipboardItem(
      CLIPBOARD_MIMETYPE.BLOCKS_CLIP_WRAPPED,
      JSON.stringify({
        data: clipInfos,
      })
    );
  }

  private async _getHtmlClip(
    selectedBlocks: SelectedBlock[]
  ): Promise<ClipboardItem | null> {
    const htmlText = await this._editor.contentParser.block2Html(
      selectedBlocks
    );
    return new ClipboardItem(CLIPBOARD_MIMETYPE.HTML, htmlText);
  }

  private async _getTextClip(
    selectedBlocks: SelectedBlock[]
  ): Promise<ClipboardItem | null> {
    const text = await this._editor.contentParser.block2Text(selectedBlocks);
    return new ClipboardItem(CLIPBOARD_MIMETYPE.TEXT, text);
  }

  private async _getClipInfoBySelectionInfo(
    selectedBlock: SelectedBlock
  ): Promise<OpenBlockInfo | null> {
    const model = this._editor.page.getBlockById(selectedBlock.id);
    if (!model) {
      return null;
    }

    let { flavour, type } = model;
    let delta: DeltaOperation[] = [];
    if (matchFlavours(model, ['affine:page'] as const)) {
      flavour = 'affine:paragraph';
      type = 'text';
      const service = await getServiceOrRegister(model.flavour);
      const text = service.block2Text(
        model,
        '',
        selectedBlock.startPos,
        selectedBlock.endPos
      );
      delta = [
        {
          insert: text,
        },
      ];
    } else if (matchFlavours(model, ['affine:embed'] as const)) {
      flavour = 'affine:embed';
      type = 'image';
      const service = await getServiceOrRegister(model.flavour);
      const text = service.block2Text(model, '', 0, 0);
      delta = [
        {
          insert: text,
        },
      ];
    } else {
      delta = model.text?.yText.doc
        ? model.text?.sliceToDelta(
            selectedBlock.startPos || 0,
            selectedBlock.endPos
          )
        : [];
    }

    const children: OpenBlockInfo[] = [];
    for (const child of selectedBlock.children) {
      const childInfo = await this._getClipInfoBySelectionInfo(child);
      childInfo && children.push(childInfo);
    }

    const result = {
      flavour: flavour,
      type: type,
      text: delta,
      checked:
        model.flavour === 'affine:list'
          ? (model as ListBlockModel).checked
          : undefined,
      children: children,
    };
    if (model.flavour === 'affine:embed') {
      Object.assign(result, {
        sourceId: model.sourceId,
        caption: (model as EmbedBlockModel).caption,
        width: (model as EmbedBlockModel).width,
        height: (model as EmbedBlockModel).height,
      });
    }
    if (model.flavour === 'affine:code') {
      // convert code block style to raw text
      const rawText: DeltaOperation[] = [];
      delta.map(op => {
        rawText.push({ insert: op.insert });
      });

      Object.assign(result, {
        rawText,
      });
    }

    return result;
  }

  private _copyToClipboard(e: ClipboardEvent, clipItems: ClipboardItem[]) {
    const clipboardData = e.clipboardData;
    if (clipboardData) {
      try {
        clipItems.forEach(clip => {
          if (clip.mimeType === CLIPBOARD_MIMETYPE.BLOCKS_CLIP_WRAPPED) {
            clip = this._handleCodeBlockRawCopy(clip);
          }
          clipboardData.setData(clip.mimeType, clip.data);
        });
        e.preventDefault();
        e.stopPropagation();
      } catch (e) {
        // FIXME: throws `DOMException: Modifications are not allowed for this document` in Firefox
        // TODO handle exception
      }
    } else {
      if (this._copyToClipboardFromPc(clipItems)) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }

  private _handleCodeBlockRawCopy(clip: ClipboardItem) {
    const openBlockInfos = JSON.parse(clip.data).data as OpenBlockInfo[];
    if (
      openBlockInfos.length === 1 &&
      openBlockInfos[0].flavour === 'affine:code'
    ) {
      const openBlockInfo = openBlockInfos[0];
      const rawText = openBlockInfo.rawText;
      assertExists(rawText);
      openBlockInfo.flavour = 'affine:paragraph';
      openBlockInfo.text = rawText;
    }
    return new ClipboardItem(
      CLIPBOARD_MIMETYPE.BLOCKS_CLIP_WRAPPED,
      JSON.stringify({
        data: openBlockInfos,
      })
    );
  }

  // TODO: Optimization
  // TODO: is not compatible with safari
  private _copyToClipboardFromPc(clips: ClipboardItem[]): boolean {
    const savedRange = SelectionUtils.hasNativeSelection()
      ? SelectionUtils.getCurrentNativeRange()
      : null;

    let success = false;
    /**
     * temp element is used to receive copy event dispatched by document.execCommand('copy'); In this way, we can
     * get the clipboardData binding with system memory.
     */
    const tempElem = document.createElement('textarea');
    document.body.appendChild(tempElem);
    // https://w3c.github.io/clipboard-apis/#to-fire-a-clipboard-event:~:text=Let%20target%20be,node%20has%20focus.
    tempElem.select();
    const listener = function (e: ClipboardEvent) {
      const clipboardData = e.clipboardData;
      if (clipboardData) {
        clips.forEach(clip => {
          clipboardData.setData(clip.mimeType, clip.data);
        });
      }

      e.preventDefault();
      e.stopPropagation();
      tempElem.removeEventListener('copy', listener);
    };

    tempElem.addEventListener('copy', listener);
    try {
      success = document.execCommand('copy');
    } finally {
      tempElem.removeEventListener('copy', listener);
      document.body.removeChild(tempElem);
      savedRange && SelectionUtils.resetNativeSelection(savedRange);
    }
    return success;
  }
}
