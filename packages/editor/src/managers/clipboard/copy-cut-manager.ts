import { CLIPBOARD_MIMETYPE, OpenBlockInfo } from './types';
import { ClipItem } from './clip-item';
import { PageContainer } from '../../components';
import { SelectBlock, SelectInfo } from '..';

export class CopyCutManager {
  private _page: PageContainer;

  constructor(page: PageContainer) {
    this._page = page;
    this.handleCopy = this.handleCopy.bind(this);
    this.handleCut = this.handleCut.bind(this);
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
    const selectInfo: SelectInfo = this._page.selection.getSelectInfo();

    const affineClip = this._getCustomClip(selectInfo);
    affineClip && clips.push(affineClip);

    const textClip = this._getTextClip(selectInfo);
    textClip && clips.push(textClip);

    const htmlClip = this._getHtmlClip(selectInfo);
    htmlClip && clips.push(htmlClip);

    return clips;
  }

  private _getCustomClip(selectInfo: SelectInfo): ClipItem | null {
    if (selectInfo.type == 'None') {
      return null;
    }
    const clipInfos = selectInfo.blocks.map(selectBlockInfo =>
      this._getClipInfoOfBlockBySelectInfo(selectBlockInfo)
    );
    return new ClipItem(
      CLIPBOARD_MIMETYPE.BLOCKS_CLIP_WRAPPED,
      JSON.stringify({
        data: clipInfos,
      })
    );
  }

  private _getHtmlClip(selectInfo: SelectInfo): ClipItem | null {
    if (selectInfo.type == 'None') {
      return null;
    }
    const htmlText = this._page.contentParser.block2Html(selectInfo.blocks);
    return new ClipItem(CLIPBOARD_MIMETYPE.HTML, htmlText);
  }

  private _getTextClip(selectInfo: SelectInfo): ClipItem | null {
    if (selectInfo.type == 'None') {
      return null;
    }
    const text = this._page.contentParser.block2Text(selectInfo.blocks);
    return new ClipItem(CLIPBOARD_MIMETYPE.TEXT, text);
  }

  private _getClipInfoOfBlockBySelectInfo(
    selectBlockInfo: SelectBlock
  ): OpenBlockInfo | null {
    const model = this._page.store.getBlockById(selectBlockInfo.blockId);
    if (!model) {
      return null;
    }
    // TODO Handling different block by extension
    const delta = model?.text?.sliceToDelta(
      selectBlockInfo.startPos || 0,
      selectBlockInfo.endPos
    );

    const children: OpenBlockInfo[] = [];
    selectBlockInfo.children.forEach(child => {
      const childInfo = this._getClipInfoOfBlockBySelectInfo(child);
      childInfo && children.push(childInfo);
    });

    return {
      flavour: model.flavour,
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
