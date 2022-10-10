import { EditorContainer } from '../../components';
import { ClipEventDispatch } from './clip-event-dispatch';
import { CopyCutManager } from './copy-cut-manager';
import { PasteManager } from './paste-manager';

export * from './types';
export * from './content-parser';

export class ClipboardManager {
  private _editor: EditorContainer;
  private _clipboardEventDispatcher: ClipEventDispatch;
  private _copy: CopyCutManager;
  private _paste: PasteManager;
  private _clipboardTarget: HTMLElement;

  constructor(editor: EditorContainer, clipboardTarget: HTMLElement) {
    this._editor = editor;
    this._clipboardTarget = clipboardTarget;
    this._copy = new CopyCutManager(this._editor);
    this._paste = new PasteManager(this._editor);
    this._clipboardEventDispatcher = new ClipEventDispatch(
      this._clipboardTarget
    );

    this._clipboardEventDispatcher.slots.copy.on(this._copy.handleCopy);
    this._clipboardEventDispatcher.slots.cut.on(this._copy.handleCut);
    this._clipboardEventDispatcher.slots.paste.on(this._paste.handlePaste);
  }

  set clipboardTarget(clipboardTarget: HTMLElement) {
    this._clipboardEventDispatcher.disposeClipboardTargetEvent(
      this._clipboardTarget
    );
    this._clipboardTarget = clipboardTarget;
    this._clipboardEventDispatcher.initialClipboardTargetEvent(
      this._clipboardTarget
    );
  }
  get clipboardTarget() {
    return this._clipboardTarget;
  }

  dispose() {
    this._clipboardEventDispatcher.dispose(this.clipboardTarget);
  }
}
