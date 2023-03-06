import type { Page } from '@blocksuite/store';

import type { Clipboard } from './type.js';

export class EdgelessClipboard implements Clipboard {
  private _page!: Page;
  constructor(page: Page) {
    this._page = page;
    console.log('_page', this._page);
  }
  public initEvent(page: Page = this._page) {
    this._page = page;
    document.body.addEventListener('cut', this._onCut);
    document.body.addEventListener('copy', this._onCopy);
    document.body.addEventListener('paste', this._onPaste);
  }
  public disposeEvent() {
    document.body.removeEventListener('cut', this._onCut);
    document.body.removeEventListener('copy', this._onCopy);
    document.body.removeEventListener('paste', this._onPaste);
  }

  private _onCut = (e: ClipboardEvent) => {
    e.preventDefault();
    // TODO: Implement cut
  };
  private _onCopy = (e: ClipboardEvent) => {
    e.preventDefault();
    // TODO: Implement copy
  };
  private _onPaste = (e: ClipboardEvent) => {
    e.preventDefault();
    //TODO: Implement paste
  };
}
