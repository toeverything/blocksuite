import type { Page } from '@blocksuite/store';

import { ClipboardItem } from './clipboard-item.js';
import type { Clipboard } from './type.js';
import { performNativeCopy } from './utils.js';

export class EdgelessClipboard implements Clipboard {
  private _page!: Page;
  constructor(page: Page) {
    this._page = page;
  }

  init(page: Page = this._page) {
    this._page = page;
    document.body.addEventListener('cut', this._onCut);
    document.body.addEventListener('copy', this._onCopy);
    document.body.addEventListener('paste', this._onPaste);
  }

  public dispose() {
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
    // console.log('onCopy', e);
    const text = new ClipboardItem('text/plain', 'test1');
    const html = new ClipboardItem('text/html', '<div>aaa</div>');
    const custom = new ClipboardItem('affine/surface', '{"data":"aaa"}');
    performNativeCopy([text, html, custom]);
  };
  private _onPaste = (e: ClipboardEvent) => {
    e.preventDefault();
    //TODO: Implement paste
    const data = e.clipboardData;
    const text = data?.getData('text/plain');
    const html = data?.getData('text/html');
    const custom = data?.getData('affine/surface');
    // console.log('text', text);
    // console.log('html', html);
    // console.log('custom', custom);
    // @ts-expect-error global variable for test
    window.__wxl = { text, html, custom };
  };
}
