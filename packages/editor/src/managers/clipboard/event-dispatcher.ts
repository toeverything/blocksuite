import { isInsideRichText } from '@blocksuite/blocks/std';
import { Signal } from '@blocksuite/store';
import { ClipboardAction } from './types.js';

export class ClipboardEventDispatcher {
  readonly signals = {
    [ClipboardAction.copy]: new Signal<ClipboardEvent>(),
    [ClipboardAction.cut]: new Signal<ClipboardEvent>(),
    [ClipboardAction.paste]: new Signal<ClipboardEvent>(),
  };

  constructor(clipboardTarget: HTMLElement) {
    this._copyHandler = this._copyHandler.bind(this);
    this._cutHandler = this._cutHandler.bind(this);
    this._pasteHandler = this._pasteHandler.bind(this);
    this.initClipboardTargetEvent(clipboardTarget);
  }

  initClipboardTargetEvent(clipboardTarget: HTMLElement) {
    if (!clipboardTarget) {
      return;
    }

    this.disposeClipboardTargetEvent(clipboardTarget);

    clipboardTarget.addEventListener(ClipboardAction.copy, this._copyHandler);
    clipboardTarget.addEventListener(ClipboardAction.cut, this._cutHandler);
    clipboardTarget.addEventListener(ClipboardAction.paste, this._pasteHandler);
    document.addEventListener(ClipboardAction.copy, this._copyHandler);
    document.addEventListener(ClipboardAction.cut, this._cutHandler);
    document.addEventListener(ClipboardAction.paste, this._pasteHandler);
  }

  disposeClipboardTargetEvent(clipboardTarget: HTMLElement) {
    if (!clipboardTarget) {
      return;
    }

    clipboardTarget.removeEventListener(
      ClipboardAction.copy,
      this._copyHandler
    );
    clipboardTarget.removeEventListener(ClipboardAction.cut, this._cutHandler);
    clipboardTarget.removeEventListener(
      ClipboardAction.paste,
      this._pasteHandler
    );
    document.removeEventListener(ClipboardAction.copy, this._copyHandler);
    document.removeEventListener(ClipboardAction.cut, this._cutHandler);
    document.removeEventListener(ClipboardAction.paste, this._pasteHandler);
  }

  static editorElementActive(): boolean {
    return document.activeElement?.closest('editor-container') != null;
  }

  private _isValidEvent(e: ClipboardEvent) {
    if (isInsideRichText(e.target)) {
      return true;
    }
    // Ad-hoc for copy from format quick bar copy button
    if (
      e.target instanceof Element &&
      e.target.tagName === 'FORMAT-QUICK-BAR'
    ) {
      return true;
    }
    // Some copy event dispatch from body
    // for example, copy block-level selection
    if (e.target === document.body) {
      return true;
    }
    return false;
  }

  private _copyHandler(e: ClipboardEvent) {
    if (!this._isValidEvent(e)) {
      return;
    }
    this.signals.copy.emit(e);
  }

  private _cutHandler(e: ClipboardEvent) {
    if (!this._isValidEvent(e)) {
      return;
    }
    if (ClipboardEventDispatcher.editorElementActive()) {
      this.signals.cut.emit(e);
    }
  }
  private _pasteHandler(e: ClipboardEvent) {
    if (!this._isValidEvent(e)) {
      return;
    }
    if (ClipboardEventDispatcher.editorElementActive()) {
      this.signals.paste.emit(e);
    }
  }

  dispose(clipboardTarget: HTMLElement) {
    this.signals.copy.dispose();
    this.signals.cut.dispose();
    this.signals.paste.dispose();
    this.disposeClipboardTargetEvent(clipboardTarget);
  }
}
