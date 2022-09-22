import { CLIPBOARD_MIMETYPE, OpenBlockInfo } from './types';
import { ClipItem } from './clipItem';
import { PaperContainer } from '../components';
import { ParseBlock } from '../parse/parseBlock';

export class CopyCutExecution {
    private _page: PaperContainer;

    constructor(page: PaperContainer) {
        this._page = page;
        this.handleCopy = this.handleCopy.bind(this);
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

        // todo get selected blocks
        const selectBlocks: OpenBlockInfo[] = [];
        // get custom clip
        const affineClip = this._getCustomClip(selectBlocks);
        clips.push(affineClip);

        const textClip = this._getTextClip(selectBlocks);
        clips.push(textClip);

        const htmlClip = this._getHtmlClip(selectBlocks);
        clips.push(htmlClip);

        return clips;
    }

    private _getHtmlClip(blocks: OpenBlockInfo[]): ClipItem {
        const htmlStr = ParseBlock.block2Html(blocks);
        return new ClipItem(CLIPBOARD_MIMETYPE.HTML, htmlStr);
    }

    private _getCustomClip(blocks: OpenBlockInfo[]): ClipItem {
        const blockText = JSON.stringify(blocks);
        return new ClipItem(CLIPBOARD_MIMETYPE.TEXT, blockText);
    }

    private _getTextClip(blocks: OpenBlockInfo[]): ClipItem {
        const blockText = ParseBlock.block2Text(blocks);
        return new ClipItem(CLIPBOARD_MIMETYPE.TEXT, blockText);
    }

    private _copyToClipboard(e: ClipboardEvent, clipItems: ClipItem[]) {
        const clipboardData = e.clipboardData;
        if (clipboardData) {
            try {
                clipItems.forEach(clip => {
                    clipboardData.setData(
                        clip.mimeType,
                        clip.data
                    );
                });
            } catch (e) {
                // TODO handle exception
            }
        }
        else {
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
