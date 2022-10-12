import { CLIPBOARD_MIMETYPE, OpenBlockInfo } from './types';
import { ClipItem } from './clip-item';
import { EditorContainer } from '../../components';
import { SelectionInfo, SelectedBlock } from '@blocksuite/shared';
import type { DefaultPageBlockComponent } from '@blocksuite/blocks';

export class CopyCutManager {
  private _editor: EditorContainer;

  constructor(editor: EditorContainer) {
    this._editor = editor;
    this.handleCopy = this.handleCopy.bind(this);
    this.handleCut = this.handleCut.bind(this);
  }

  private get _selection() {
    const page =
      document.querySelector<DefaultPageBlockComponent>('default-page-block');
    if (!page) throw new Error('No page block');
    return page.selection;
  }

  public handleCopy(e: ClipboardEvent) {
    e.preventDefault();
    e.stopPropagation();

    const clips = this._getClipItems();
    if (!clips.length) {
      return;
    }

    this._copyToClipboard(e, clips);
  }

  public handleCut(e: ClipboardEvent) {
    this.handleCopy(e);
    // todo delete selected blocks
  }

  private _getClipItems() {
    const clips: ClipItem[] = [];
    const { selectionInfo } = this._selection;
    let selectedBlocks: SelectedBlock[] = [];
    if (selectionInfo.type === 'Block') {
      selectedBlocks = selectionInfo.blocks;
    } else if (
      selectionInfo.type === 'Range' ||
      selectionInfo.type === 'Caret'
    ) {
      selectedBlocks = [
        {
          id: selectionInfo.anchorBlockId,
          startPos: selectionInfo.anchorBlockPosition || undefined,
          endPos: selectionInfo.focusBlockPosition || undefined,
          children: [],
        },
      ];
    }

    const affineClip = this._getCustomClip(selectedBlocks);
    affineClip && clips.push(affineClip);

    const textClip = this._getTextClip(selectedBlocks);
    textClip && clips.push(textClip);

    const htmlClip = this._getHtmlClip(selectedBlocks);
    htmlClip && clips.push(htmlClip);

    return clips;
  }

  private _getCustomClip(selectedBlocks: SelectedBlock[]): ClipItem | null {
    const clipInfos = selectedBlocks.map(selectedBlock =>
      this._getClipInfoBySelectionInfo(selectedBlock)
    );
    return new ClipItem(
      CLIPBOARD_MIMETYPE.BLOCKS_CLIP_WRAPPED,
      JSON.stringify({
        data: clipInfos,
      })
    );
  }

  private _getHtmlClip(selectedBlocks: SelectedBlock[]): ClipItem | null {
    const htmlText = this._editor.contentParser.block2Html(selectedBlocks);
    return new ClipItem(CLIPBOARD_MIMETYPE.HTML, htmlText);
  }

  private _getTextClip(selectedBlocks: SelectedBlock[]): ClipItem | null {
    const text = this._editor.contentParser.block2Text(selectedBlocks);
    return new ClipItem(CLIPBOARD_MIMETYPE.TEXT, text);
  }

  private _getClipInfoBySelectionInfo(
    selectedBlock: SelectedBlock
  ): OpenBlockInfo | null {
    const model = this._editor.store.getBlockById(selectedBlock.id);
    if (!model) {
      return null;
    }
    // TODO Handling different block by extension
    const delta = model?.text?.sliceToDelta(
      selectedBlock?.startPos || 0,
      selectedBlock?.endPos
    );

    const children: OpenBlockInfo[] = [];
    selectedBlock.children.forEach(child => {
      const childInfo = this._getClipInfoBySelectionInfo(child);
      childInfo && children.push(childInfo);
    });

    return {
      flavour: model.flavour,
      type: model.type,
      text: delta,
      children: children,
    };
  }

  private _copyToClipboard(e: ClipboardEvent, clipItems: ClipItem[]) {
    const clipboardData = e.clipboardData;
    if (clipboardData) {
      try {
        clipItems.forEach(clip => {
          clipboardData.setData(clip.mimeType, clip.data);
        });
      } catch (e) {
        // TODO handle exception
      }
    } else {
      this._copyToClipboardFromPc(clipItems);
    }
  }

  // TODO: Optimization
  // TODO: is not compatible with safari
  private _copyToClipboardFromPc(clips: ClipItem[]) {
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
    }
    return success;
  }
}
