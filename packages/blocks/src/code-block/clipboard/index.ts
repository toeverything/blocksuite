import {
  type BlockComponent,
  Clipboard,
  type UIEventHandler,
} from '@blocksuite/block-std';
import { assertExists, DisposableGroup } from '@blocksuite/global/utils';

import { HtmlAdapter, PlainTextAdapter } from '../../_common/adapters/index.js';
import { pasteMiddleware } from '../../root-block/clipboard/middlewares/index.js';

export class CodeClipboardController {
  private _clipboard!: Clipboard;

  protected _disposables = new DisposableGroup();

  protected _init = () => {
    this._clipboard.registerAdapter('text/plain', PlainTextAdapter, 90);
    this._clipboard.registerAdapter('text/html', HtmlAdapter, 80);
    const paste = pasteMiddleware(this._std);
    this._clipboard.use(paste);

    this._disposables.add({
      dispose: () => {
        this._clipboard.unregisterAdapter('text/plain');
        this._clipboard.unregisterAdapter('text/html');
        this._clipboard.unuse(paste);
      },
    });
  };

  host: BlockComponent;

  onPagePaste: UIEventHandler = ctx => {
    const e = ctx.get('clipboardState').raw;
    e.preventDefault();

    this._std.doc.captureSync();
    this._std.command
      .chain()
      .try(cmd => [
        cmd.getTextSelection().inline<'currentSelectionPath'>((ctx, next) => {
          const textSelection = ctx.currentTextSelection;
          assertExists(textSelection);
          const end = textSelection.to ?? textSelection.from;
          next({ currentSelectionPath: end.blockId });
        }),
        cmd.getBlockSelections().inline<'currentSelectionPath'>((ctx, next) => {
          const currentBlockSelections = ctx.currentBlockSelections;
          assertExists(currentBlockSelections);
          const blockSelection = currentBlockSelections.at(-1);
          if (!blockSelection) {
            return;
          }
          next({ currentSelectionPath: blockSelection.blockId });
        }),
      ])
      .getBlockIndex()
      .inline((ctx, next) => {
        assertExists(ctx.parentBlock);
        this._clipboard
          .paste(
            e,
            this._std.doc,
            ctx.parentBlock.model.id,
            ctx.blockIndex ? ctx.blockIndex + 1 : undefined
          )
          .catch(console.error);

        return next();
      })
      .run();
    return true;
  };

  private get _std() {
    return this.host.std;
  }

  constructor(host: BlockComponent) {
    this.host = host;
  }

  hostConnected() {
    if (this._disposables.disposed) {
      this._disposables = new DisposableGroup();
    }
    this._clipboard = new Clipboard(this._std);
    this.host.handleEvent('paste', this.onPagePaste);
    this._init();
  }

  hostDisconnected() {
    this._disposables.dispose();
  }
}
