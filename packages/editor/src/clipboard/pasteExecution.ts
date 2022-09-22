import { randomUUID } from 'crypto';
import { marked } from 'marked';
import { PageContainer } from '../components';
import { ParseHtml } from '../parse/parseHtml';
import { ParseText } from '../parse/parseTest';
import { MarkdownUtils } from './markdownUtils';
import { CLIPBOARD_MIMETYPE, OpenBlockInfo } from './types';

export class PasteExecution {
    private _page: PageContainer;

    // The event handler will get the most needed clipboard data based on this array order
    private static _optimalMimeTypes: string[] = [
        CLIPBOARD_MIMETYPE.BLOCKS_CLIP_WRAPPED,
        CLIPBOARD_MIMETYPE.HTML,
        CLIPBOARD_MIMETYPE.TEXT,
    ];

    constructor(page: PageContainer) {
        this._page = page;
        this.handlePaste = this.handlePaste.bind(this);
    }

    public async handlePaste(e: ClipboardEvent) {
        e.preventDefault();
        e.stopPropagation();

        const blocks = await this._clipboardEvent2Blocks(e);
        // todo insert blocks to editor
    }

    private async _clipboardEvent2Blocks(e: ClipboardEvent) {
        const clipboardData = e.clipboardData;
        if (!clipboardData) {
            return;
        }

        const isPureFile = PasteExecution._isPureFileInClipboard(clipboardData);
        if (isPureFile) {
            return this._file2Blocks(clipboardData);
        }
        return this._clipboardData2Blocks(clipboardData);
    }
    
    // Get the most needed clipboard data based on `_optimalMimeTypes` order
    public getOptimalClip(clipboardData: ClipboardEvent['clipboardData']) {
        for (let i = 0; i < PasteExecution._optimalMimeTypes.length; i++) {
            const mimeType = PasteExecution._optimalMimeTypes[i];
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

    private async _clipboardData2Blocks(
        clipboardData: DataTransfer
    ) {
        const optimalClip = this.getOptimalClip(clipboardData);
        if (
            optimalClip?.type ===
            CLIPBOARD_MIMETYPE.BLOCKS_CLIP_WRAPPED
        ) {
            const clipInfo = JSON.parse(optimalClip.data);
            return clipInfo.data;
        }

        const textClipData = escape(
            clipboardData.getData(CLIPBOARD_MIMETYPE.TEXT)
        );

        const shouldConvertMarkdown = MarkdownUtils.checkIfTextContainsMd(textClipData);
        if (
            optimalClip?.type === CLIPBOARD_MIMETYPE.HTML &&
            !shouldConvertMarkdown
        ) {
            return ParseHtml.html2blocks(optimalClip.data);
        }

        if (shouldConvertMarkdown) {
            const md2html = marked.parse(textClipData);
            return ParseHtml.html2blocks(md2html);
        }

        return ParseText.text2blocks(textClipData);
    }

    private async _file2Blocks(clipboardData: DataTransfer): Promise<OpenBlockInfo[]> {
        const file = PasteExecution._getImageFile(clipboardData);
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
}
