import { Signal } from '@blocksuite/store';
import { ClipboardAction } from './types';

export class ClipEventDispatch {
  readonly signals = {
    [ClipboardAction.copy]: new Signal<ClipboardEvent>(),
    [ClipboardAction.cut]: new Signal<ClipboardEvent>(),
    [ClipboardAction.paste]: new Signal<ClipboardEvent>(),
  };

  constructor(clipboardTarget: HTMLElement) {
    this._copyHandler = this._copyHandler.bind(this);
    this._cutHandler = this._cutHandler.bind(this);
    this._pasteHandler = this._pasteHandler.bind(this);
    this.initialClipboardTargetEvent(clipboardTarget);
  }

  initialClipboardTargetEvent(clipboardTarget: HTMLElement) {
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
  }

  private _copyHandler(e: ClipboardEvent) {
    this.signals.copy.emit(e);
  }

  private _cutHandler(e: ClipboardEvent) {
    this.signals.cut.emit(e);
  }
  private _pasteHandler(e: ClipboardEvent) {
    this.signals.paste.emit(e);
  }

  dispose(clipboardTarget: HTMLElement) {
    this.signals.copy.dispose();
    this.signals.cut.dispose();
    this.signals.paste.dispose();
    this.disposeClipboardTargetEvent(clipboardTarget);
  }
}
