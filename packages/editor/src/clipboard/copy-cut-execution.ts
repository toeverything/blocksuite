import { CLIPBOARD_MIMETYPE, OpenBlockInfo } from './types';
import { ClipItem } from './clip-item';
import { PageContainer } from '../components';
import { ParseBlock } from '../parse/parse-block';
import { BaseBlockModel } from '@blocksuite/store';
import { SelectBlock, SelectInfo } from '../managers';

export class CopyCutExecution {
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

  private _getClipDataOfBlocksById(blockIds: string[]): ClipItem {
    const clipInfos: OpenBlockInfo[] = [];
    blockIds.forEach(blockId => {
      const model = this._page.store.getBlockById(blockId);
      model && clipInfos.push(this._transToOpenBlockInfo(model));
    });
    return new ClipItem(
      CLIPBOARD_MIMETYPE.BLOCKS_CLIP_WRAPPED,
      JSON.stringify({
        data: clipInfos,
      })
    );
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
    affineClip && clips.push(affineClip);

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

  private _getCustomClip(): ClipItem | null {
    const selectInfo: SelectInfo = this._page.selection.getSelectInfo();
    if (selectInfo.type === 'Range' || selectInfo.type === 'Caret') {
      return this._getClipDataOfBlocksBySelectInfo(selectInfo);
    } else if (selectInfo.type === 'Block') {
      return this._getClipDataOfBlocksById(
        selectInfo.blocks.map(block => block.blockId)
      );
    }
    return null;
  }

  private _getClipDataOfBlocksBySelectInfo(selectInfo: SelectInfo) {
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

  private _getClipInfoOfBlockBySelectInfo(
    selectBlockInfo: SelectBlock
  ): OpenBlockInfo | null {
    const model = this._page.store.getBlockById(selectBlockInfo.blockId);
    if (!model) {
      return null;
    }
    const children: OpenBlockInfo[] = [];
    selectBlockInfo.children.forEach(child => {
      const childInfo = this._getClipInfoOfBlockBySelectInfo(child);
      childInfo && children.push(childInfo);
    });

    const delta = model?.text?.sliceToDelta(
      selectBlockInfo.startPos || 0,
      selectBlockInfo.endPos
    );
    const blockInfo: OpenBlockInfo = {
      flavour: model.flavour,
      text: delta,
      children: children,
    };
    return blockInfo;
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
