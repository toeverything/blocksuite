import type { EditorContainer } from '../../components/index.js';
import { CopyCutManager } from './copy-cut-manager.js';
import { ClipboardEventDispatcher } from './event-dispatcher.js';
import { PasteManager } from './paste-manager.js';

export * from './content-parser/index.js';
export * from './types.js';

export class ClipboardManager {
  private _editor: EditorContainer;
  private _clipboardEventDispatcher: ClipboardEventDispatcher;
  private _copy: CopyCutManager;
  private _paste: PasteManager;
  private _clipboardTarget: HTMLElement;

  constructor(editor: EditorContainer, clipboardTarget: HTMLElement) {
    this._editor = editor;
    this._clipboardTarget = clipboardTarget;
    this._copy = new CopyCutManager(this._editor);
    this._paste = new PasteManager(this._editor);
    this._clipboardEventDispatcher = new ClipboardEventDispatcher(
      this._clipboardTarget
    );
    // this._clipboardEventDispatcher.signals.copy.on(this._copy.handleCopy);
    // this._clipboardEventDispatcher.signals.cut.on(this._copy.handleCut);
    // this._clipboardEventDispatcher.signals.paste.on(this._paste.handlePaste);
  }

  set clipboardTarget(clipboardTarget: HTMLElement) {
    this._clipboardEventDispatcher.disposeClipboardTargetEvent(
      this._clipboardTarget
    );
    this._clipboardTarget = clipboardTarget;
    this._clipboardEventDispatcher.initClipboardTargetEvent(
      this._clipboardTarget
    );
  }
  get clipboardTarget() {
    return this._clipboardTarget;
  }

  public async importMarkdown(text: string, insertPositionId: string) {
    const blocks = await this._editor.contentParser.markdown2Block(text);
    this._paste.insertBlocks(blocks, {
      type: 'Block',
      selectedBlocks: [{ id: insertPositionId, children: [] }],
    });
  }

  dispose() {
    this._clipboardEventDispatcher.dispose(this.clipboardTarget);
  }
}
