import type { EdgelessPageBlockComponent } from '../../page-block/edgeless/edgeless-page-block.js';

export class EdgelessClipboard {
  private _edgelessBlock!: EdgelessPageBlockComponent;
  constructor() {
    console.log(this._edgelessBlock);
  }
  public init(edgelessBlock: EdgelessPageBlockComponent) {
    this._edgelessBlock = edgelessBlock;

    document.body.addEventListener('cut', this._onCut.bind(this));
    document.body.addEventListener('copy', this._onCopy.bind(this));
    document.body.addEventListener('paste', this._onPaste.bind(this));
  }
  public dispose() {
    document.body.removeEventListener('cut', this._onCut);
    document.body.removeEventListener('copy', this._onCopy);
    document.body.removeEventListener('paste', this._onPaste);
  }

  private _onCut(e: ClipboardEvent) {
    e.preventDefault();
    // TODO: Implement cut
  }
  private _onCopy(e: ClipboardEvent) {
    e.preventDefault();
    // TODO: Implement copy
  }
  private _onPaste(e: ClipboardEvent) {
    e.preventDefault();
    //TODO: Implement paste
  }
}
