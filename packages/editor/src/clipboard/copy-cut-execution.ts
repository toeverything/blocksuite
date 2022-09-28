import { CLIPBOARD_MIMETYPE, OpenBlockInfo } from './types';
import { ClipItem } from './clip-item';
import { PageContainer } from '../components';
import { ParseBlock } from '../parse/parse-block';
import { BaseBlockModel } from '@blocksuite/store';

export class CopyCutExecution {
  // @ts-ignore
  private _page: PageContainer;

  constructor(page: PageContainer) {
    this._page = page;
    this.handleCopy = this.handleCopy.bind(this);
  }

  handleCopy(e: ClipboardEvent) {
    e.preventDefault();
    e.stopPropagation();

    const clips = this._getClipItems();
    if (!clips.length) {
      return;
    }

    this._copyToClipboard(e, clips);
  }

  handleCut(e: ClipboardEvent) {
    this.handleCopy(e);
    // todo delete selected blocks
  }

  private _getClipDataOfBlocksById(blockIds: string[]): OpenBlockInfo[] {
    const clipInfos: OpenBlockInfo[] = [];
    blockIds.forEach(blockId => {
      const model = this._page.store.getBlockById(blockId);
      model && clipInfos.push(this._transToOpenBlockInfo(model));
    });
    return clipInfos;
  }

  private _transToOpenBlockInfo(model: BaseBlockModel): OpenBlockInfo {
    const blockProps = model && {
      id: model.id,
      flavour: model.flavour,
      text: model?.text?.toDelta(),
      children: model.children.map(child => this._transToOpenBlockInfo(child)),
    };
    return blockProps as OpenBlockInfo;
  }

  private _getClipItems() {
    const clips: ClipItem[] = [];

    // get custom clip
    const affineClip = this._getCustomClip();
    clips.push(affineClip);

    const textClip = this._getTextClip();
    clips.push(textClip);

    const htmlClip = this._getHtmlClip();
    clips.push(htmlClip);

    return clips;
  }

  private _getHtmlClip(): ClipItem {
    const htmlStr = ParseBlock.block2Html([]);
    return new ClipItem(CLIPBOARD_MIMETYPE.HTML, htmlStr);
  }

  private _getCustomClip(): ClipItem {
    let selectBlocks: OpenBlockInfo[] = [];
    const selectInfo = this._page.selection.selectionInfo;
    if (selectInfo.type === 'Range' || selectInfo.type === 'Caret') {
      // todo get range selected blocks
      selectBlocks = this._getClipDataOfBlocksById([selectInfo.focusBlockId]);
    } else if (selectInfo.type === 'Block') {
      selectBlocks = this._getClipDataOfBlocksById(selectInfo.selectedNodesIds);
    }

    return new ClipItem(CLIPBOARD_MIMETYPE.BLOCKS_CLIP_WRAPPED, JSON.stringify({
      data: selectBlocks,
    }));
  }

  private _getTextClip(): ClipItem {
    const blockText = ParseBlock.block2Text([]);
    return new ClipItem(CLIPBOARD_MIMETYPE.TEXT, blockText);
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
