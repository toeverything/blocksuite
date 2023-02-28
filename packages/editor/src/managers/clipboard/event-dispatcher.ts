import { isInsideRichText } from '@blocksuite/blocks/std';
import { Signal } from '@blocksuite/store';

import { checkEditorElementActive } from '../../utils/editor.js';
import { ClipboardAction } from './types.js';

export class ClipboardEventDispatcher {
  readonly signals = {
    [ClipboardAction.copy]: new Signal<ClipboardEvent>(),
    [ClipboardAction.cut]: new Signal<ClipboardEvent>(),
    [ClipboardAction.paste]: new Signal<ClipboardEvent>(),
  };

  constructor(clipboardTarget: HTMLElement) {
    this.initClipboardTargetEvent(clipboardTarget);
  }

  initClipboardTargetEvent(clipboardTarget: HTMLElement) {
    if (!clipboardTarget) return;

    this.disposeClipboardTargetEvent(clipboardTarget);

    clipboardTarget.addEventListener(ClipboardAction.copy, this._onCopy);
    clipboardTarget.addEventListener(ClipboardAction.cut, this._onCut);
    clipboardTarget.addEventListener(ClipboardAction.paste, this._onPaste);
    document.addEventListener(ClipboardAction.copy, this._onCopy);
    document.addEventListener(ClipboardAction.cut, this._onCut);
    document.addEventListener(ClipboardAction.paste, this._onPaste);
  }

  disposeClipboardTargetEvent(clipboardTarget: HTMLElement) {
    if (!clipboardTarget) return;

    clipboardTarget.removeEventListener(ClipboardAction.copy, this._onCopy);
    clipboardTarget.removeEventListener(ClipboardAction.cut, this._onCut);
    clipboardTarget.removeEventListener(ClipboardAction.paste, this._onPaste);
    document.removeEventListener(ClipboardAction.copy, this._onCopy);
    document.removeEventListener(ClipboardAction.cut, this._onCut);
    document.removeEventListener(ClipboardAction.paste, this._onPaste);
  }

  static editorElementActive(): boolean {
    return checkEditorElementActive();
  }

  private _isValidClipboardEvent(e: ClipboardEvent) {
    if (isInsideRichText(e.target)) return true;

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

  private _onCopy = (e: ClipboardEvent) => {
    if (!this._isValidClipboardEvent(e)) return;

    this.signals.copy.emit(e);
  };

  private _onCut = (e: ClipboardEvent) => {
    if (!this._isValidClipboardEvent(e)) return;

    this.signals.cut.emit(e);
  };

  private _onPaste = (e: ClipboardEvent) => {
    if (!this._isValidClipboardEvent(e)) return;

    if (ClipboardEventDispatcher.editorElementActive()) {
      this.signals.paste.emit(e);
    }
  };

  dispose(clipboardTarget: HTMLElement) {
    this.signals.copy.dispose();
    this.signals.cut.dispose();
    this.signals.paste.dispose();
    this.disposeClipboardTargetEvent(clipboardTarget);
  }
}
