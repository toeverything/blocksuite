import { PaperContainer } from '../components';
import { ClipEventDispatch } from './clipEventDispatch';
import { CopyCutExecution } from './copyCutExecution';
import { PasteExecution } from './pasteExecution';

export class Clipboard {
    private _page: PaperContainer;
    private _clipboardEventDispatcher: ClipEventDispatch;
    private _copy: CopyCutExecution;
    private _paste: PasteExecution;
    private _clipboardTarget: HTMLElement;

    constructor(page: PaperContainer, clipboardTarget: HTMLElement) {
        this._page = page;
        this._clipboardTarget = clipboardTarget;
        this._copy = new CopyCutExecution(this._page);
        this._paste = new PasteExecution(this._page);
        this._clipboardEventDispatcher = new ClipEventDispatch(
            this._clipboardTarget
        );

        this._clipboardEventDispatcher.slots.copy.on(this._copy.handleCopy);
        this._clipboardEventDispatcher.slots.cut.on(this._copy.handleCut);
        this._clipboardEventDispatcher.slots.paste.on(this._paste.handlePaste);
    }

    public set clipboardTarget(clipboardTarget: HTMLElement) {
        this._clipboardEventDispatcher.disposeClipboardTargetEvent(
            this._clipboardTarget
        );
        this._clipboardTarget = clipboardTarget;
        this._clipboardEventDispatcher.initialClipboardTargetEvent(
            this._clipboardTarget
        );
    }
    public get clipboardTarget() {
        return this._clipboardTarget;
    }

    public dispose() {
        this._clipboardEventDispatcher.dispose(this.clipboardTarget);
    }
}
