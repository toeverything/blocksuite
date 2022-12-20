import type { EditorContainer } from '../../components/index.js';
import { ClipEventDispatch } from './clip-event-dispatch.js';
import { CopyCutManager } from './copy-cut-manager.js';
import { PasteManager } from './paste-manager.js';

export * from './types.js';
export * from './content-parser/index.js';

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

    this._clipboardEventDispatcher.signals.copy.on(this._copy.handleCopy);
    this._clipboardEventDispatcher.signals.cut.on(this._copy.handleCut);
    this._clipboardEventDispatcher.signals.paste.on(this._paste.handlePaste);
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

  public importMarkdown(text: string, insertPositionId: string) {
    const blocks = this._editor.contentParser.markdown2Block(text);
    this._paste.insertBlocks(blocks, {
      type: 'Block',
      selectedBlocks: [{ id: insertPositionId, children: [] }],
    });
  }

  dispose() {
    this._clipboardEventDispatcher.dispose(this.clipboardTarget);
  }
}
