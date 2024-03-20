import type { BlockElement } from '@blocksuite/block-std';
import { Clipboard, type UIEventHandler } from '@blocksuite/block-std';
import { assertExists, DisposableGroup } from '@blocksuite/global/utils';

import { HtmlAdapter, PlainTextAdapter } from '../../_common/adapters/index.js';
import { pasteMiddleware } from '../../root-block/clipboard/middlewares/index.js';

export class CodeClipboardController {
  protected _disposables = new DisposableGroup();
  host: BlockElement;

  private get _std() {
    return this.host.std;
  }

  private _clipboard!: Clipboard;
  private _plaintextAdapter = new PlainTextAdapter();
  private _htmlAdapter = new HtmlAdapter();

  constructor(host: BlockElement) {
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

  protected _init = () => {
    this._clipboard.registerAdapter('text/plain', this._plaintextAdapter, 90);
    this._clipboard.registerAdapter('text/html', this._htmlAdapter, 80);
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

  public onPagePaste: UIEventHandler = ctx => {
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
          next({ currentSelectionPath: end.path });
        }),
        cmd.getBlockSelections().inline<'currentSelectionPath'>((ctx, next) => {
          const currentBlockSelections = ctx.currentBlockSelections;
          assertExists(currentBlockSelections);
          const blockSelection = currentBlockSelections.at(-1);
          if (!blockSelection) {
            return;
          }
          next({ currentSelectionPath: blockSelection.path });
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
}
