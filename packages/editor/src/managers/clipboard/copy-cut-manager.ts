import {
  deleteModelsByRange,
  EmbedBlockModel,
  getCurrentRange,
  ListBlockModel,
  matchFlavours,
  SelectionUtils,
} from '@blocksuite/blocks';
import type { DeltaOperation } from 'quill';
import type { EditorContainer } from '../../components/index.js';
import { ClipboardItem } from './item.js';
import { CLIPBOARD_MIMETYPE, OpenBlockInfo, SelectedBlock } from './types.js';

export class CopyCutManager {
  private _editor: EditorContainer;

  constructor(editor: EditorContainer) {
    this._editor = editor;
    this.handleCopy = this.handleCopy.bind(this);
    this.handleCut = this.handleCut.bind(this);
  }

  /* FIXME
  private get _selection() {
    const page =
      document.querySelector<DefaultPageBlockComponent>('default-page-block');
    if (!page) throw new Error('No page block');
    return page.selection;
  }
  */

  public handleCopy(e: ClipboardEvent) {
    const clips = this._getClipItems();
    if (!clips.length) {
      return;
    }

    this._copyToClipboard(e, clips);
  }

  public handleCut(e: ClipboardEvent) {
    this.handleCopy(e);
    deleteModelsByRange(this._editor.page);
  }

  private _getClipItems() {
    const clips: ClipboardItem[] = [];
    const selectionInfo = SelectionUtils.getSelectInfo(this._editor.page);
    const selectedBlocks = selectionInfo.selectedBlocks;

    const affineClip = this._getCustomClip(selectedBlocks);
    affineClip && clips.push(affineClip);

    const textClip = this._getTextClip(selectedBlocks);
    textClip && clips.push(textClip);

    const htmlClip = this._getHtmlClip(selectedBlocks);
    htmlClip && clips.push(htmlClip);

    return clips;
  }

  private _getCustomClip(
    selectedBlocks: SelectedBlock[]
  ): ClipboardItem | null {
    const clipInfos = selectedBlocks.map(selectedBlock =>
      this._getClipInfoBySelectionInfo(selectedBlock)
    );
    return new ClipboardItem(
      CLIPBOARD_MIMETYPE.BLOCKS_CLIP_WRAPPED,
      JSON.stringify({
        data: clipInfos,
      })
    );
  }

  private _getHtmlClip(selectedBlocks: SelectedBlock[]): ClipboardItem | null {
    const htmlText = this._editor.contentParser.block2Html(selectedBlocks);
    return new ClipboardItem(CLIPBOARD_MIMETYPE.HTML, htmlText);
  }

  private _getTextClip(selectedBlocks: SelectedBlock[]): ClipboardItem | null {
    const text = this._editor.contentParser.block2Text(selectedBlocks);
    return new ClipboardItem(CLIPBOARD_MIMETYPE.TEXT, text);
  }

  private _getClipInfoBySelectionInfo(
    selectedBlock: SelectedBlock
  ): OpenBlockInfo | null {
    const model = this._editor.page.getBlockById(selectedBlock.id);
    if (!model) {
      return null;
    }

    let { flavour, type } = model;
    let delta: DeltaOperation[] = [];
    if (matchFlavours(model, ['affine:page'])) {
      flavour = 'affine:paragraph';
      type = 'text';
      const text = model.block2Text(
        '',
        selectedBlock.startPos,
        selectedBlock.endPos
      );
      delta = [
        {
          insert: text,
        },
      ];
    } else if (matchFlavours(model, ['affine:embed'])) {
      flavour = 'affine:embed';
      type = 'image';
      const text = model.block2Text('', 0, 0);
      delta = [
        {
          insert: text,
        },
      ];
    } else {
      delta =
        model.text?.sliceToDelta(
          selectedBlock.startPos || 0,
          selectedBlock.endPos
        ) || [];
    }

    const children: OpenBlockInfo[] = [];
    selectedBlock.children.forEach(child => {
      const childInfo = this._getClipInfoBySelectionInfo(child);
      childInfo && children.push(childInfo);
    });
    const result = {
      flavour: flavour,
      type: type,
      text: delta,
      checked: model instanceof ListBlockModel ? model.checked : undefined,
      children: children,
    };
    if (model instanceof EmbedBlockModel) {
      Object.assign(result, {
        sourceId: model.sourceId,
        caption: model.caption,
        width: model.width,
        height: model.height,
      });
    }

    return result;
  }

  private _copyToClipboard(e: ClipboardEvent, clipItems: ClipboardItem[]) {
    const clipboardData = e.clipboardData;
    if (clipboardData) {
      try {
        clipItems.forEach(clip => {
          clipboardData.setData(clip.mimeType, clip.data);
        });
        e.preventDefault();
        e.stopPropagation();
      } catch (e) {
        // TODO handle exception
      }
    } else {
      if (this._copyToClipboardFromPc(clipItems)) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }

  // TODO: Optimization
  // TODO: is not compatible with safari
  private _copyToClipboardFromPc(clips: ClipboardItem[]): boolean {
    const curRange = getCurrentRange();

    let success = false;
    const tempElem = document.createElement('textarea');
    tempElem.value = 'temp';
    document.body.appendChild(tempElem);
    tempElem.select();
    tempElem.setSelectionRange(0, tempElem.value.length);

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
      SelectionUtils.resetNativeSelection(curRange);
    }
    return success;
  }
}
