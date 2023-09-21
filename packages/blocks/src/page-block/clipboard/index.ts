import type { UIEventHandler } from '@blocksuite/block-std';
import { DisposableGroup } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';
import type { ReactiveController, ReactiveControllerHost } from 'lit';

import { replaceIdMiddleware } from '../../api/transformer/utils.js';
import { ClipboardAdapter } from './adapter.js';
import { copyMiddleware, pasteMiddleware } from './middlewares/index.js';

export class ClipboardController implements ReactiveController {
  protected _disposables = new DisposableGroup();
  host: ReactiveControllerHost & BlockElement;

  private get _std() {
    return this.host.std;
  }

  private get _enabled() {
    return this._std.page.awarenessStore.getFlag(
      'enable_transformer_clipboard'
    );
  }

  private _clipboardAdapter: ClipboardAdapter = new ClipboardAdapter();

  constructor(host: ReactiveControllerHost & BlockElement) {
    (this.host = host).addController(this);
  }

  hostConnected() {
    if (this._disposables.disposed) {
      this._disposables = new DisposableGroup();
    }
    if (this._enabled) {
      this._init();
    }
  }

  hostDisconnected() {
    this._disposables.dispose();
  }

  private _init = () => {
    this.host.handleEvent('copy', this._onCopy);
    this.host.handleEvent('paste', this._onPaste);
    this.host.handleEvent('cut', this._onCut);

    this._std.clipboard.registerAdapter(
      ClipboardAdapter.MIME,
      this._clipboardAdapter,
      100
    );
    const copy = copyMiddleware(this._std);
    const paste = pasteMiddleware(this._std);
    this._std.clipboard.use(copy);
    this._std.clipboard.use(paste);
    this._std.clipboard.use(replaceIdMiddleware);

    this._disposables.add({
      dispose: () => {
        this._std.clipboard.unregisterAdapter(ClipboardAdapter.MIME);
        this._std.clipboard.unuse(copy);
        this._std.clipboard.unuse(paste);
        this._std.clipboard.unuse(replaceIdMiddleware);
      },
    });
  };

  private _copySelected = (event: ClipboardEvent) => {
    return this._std.command
      .pipe()
      .getSelectedModels({})
      .copySelectedBlock({ event });
  };

  private _onCopy: UIEventHandler = ctx => {
    const e = ctx.get('clipboardState').raw;
    e.preventDefault();

    this._copySelected(e).run();
  };

  private _onCut: UIEventHandler = ctx => {
    const e = ctx.get('clipboardState').raw;
    e.preventDefault();

    this._copySelected(e)
      .try(cmd => [cmd.deleteSelectedText(), cmd.deleteSelectedBlock()])
      .run();
  };

  private _onPaste: UIEventHandler = ctx => {
    const e = ctx.get('clipboardState').raw;
    e.preventDefault();

    this._std.command
      .pipe()
      .getBlockIndex()
      .inline((ctx, next) => {
        this._std.clipboard.paste(
          e,
          this._std.page,
          ctx.parentBlock.model.id,
          ctx.blockIndex ? ctx.blockIndex + 1 : undefined
        );

        return next();
      })
      .run();
  };
}
