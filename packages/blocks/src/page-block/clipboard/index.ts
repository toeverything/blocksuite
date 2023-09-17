import type { UIEventHandler } from '@blocksuite/block-std';
import { DisposableGroup } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';
import type { BaseBlockModel } from '@blocksuite/store';
import { Slice } from '@blocksuite/store';
import type { ReactiveController, ReactiveControllerHost } from 'lit';

import { ClipboardAdapter } from './adapter.js';
import { copyMiddleware, pasteMiddleware } from './middleware.js';

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

    this._disposables.add({
      dispose: () => {
        this._std.clipboard.unregisterAdapter(ClipboardAdapter.MIME);
        this._std.clipboard.unuse(copy);
        this._std.clipboard.unuse(paste);
      },
    });
  };

  private _onCopy: UIEventHandler = ctx => {
    const e = ctx.get('clipboardState').raw;
    e.preventDefault();

    this._std.command
      .pipe()
      .getSelectedModels({})
      .inline(async (ctx, next) => {
        if (!ctx.selectedModels) {
          return;
        }
        const models: BaseBlockModel[] = ctx.selectedModels.map(model =>
          model.clone()
        );
        const traverse = (model: BaseBlockModel) => {
          const children = model.children.filter(child => {
            const idx = models.findIndex(m => m.id === child.id);
            if (idx < 0) {
              model.childMap.delete(child.id);
            }
            return idx >= 0;
          });

          children.forEach(child => {
            const idx = models.findIndex(m => m.id === child.id);
            if (idx >= 0) {
              models.splice(idx, 1);
            }
            traverse(child);
          });
          model.children = children;
          return;
        };
        models.forEach(traverse);

        const slice = Slice.fromModels(this._std.page, models);
        await this._std.clipboard.copy(e, slice);
        return next();
      })
      .run();
  };

  private _onCut: UIEventHandler = ctx => {
    const e = ctx.get('clipboardState').raw;
    e.preventDefault();

    this._std.command
      .pipe()
      .getSelectedModels({})
      .inline(async (ctx, next) => {
        if (!ctx.selectedModels) {
          return;
        }
        const models: BaseBlockModel[] = ctx.selectedModels.map(model =>
          model.clone()
        );
        const traverse = (model: BaseBlockModel) => {
          const children = model.children.filter(child => {
            const idx = models.findIndex(m => m.id === child.id);
            if (idx < 0) {
              model.childMap.delete(child.id);
            }
            return idx >= 0;
          });

          children.forEach(child => {
            const idx = models.findIndex(m => m.id === child.id);
            if (idx >= 0) {
              models.splice(idx, 1);
            }
            traverse(child);
          });
          model.children = children;
          return;
        };
        models.forEach(traverse);

        const slice = Slice.fromModels(this._std.page, models);
        await this._std.clipboard.copy(e, slice);
        return next();
      })
      .try(cmd => [cmd.deleteSelectedText(), cmd.deleteSelectedBlock()])
      .run();
  };

  private _onPaste: UIEventHandler = ctx => {
    const e = ctx.get('clipboardState').raw;
    e.preventDefault();

    this._std.command
      .pipe()
      .getBlockIndex()
      .inline(async (ctx, next) => {
        await this._std.clipboard.paste(
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
