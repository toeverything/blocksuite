import type { TextRangePoint, UIEventHandler } from '@blocksuite/block-std';
import { PathFinder } from '@blocksuite/block-std';
import { DisposableGroup } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import type { JobMiddleware } from '@blocksuite/store';
import { Slice } from '@blocksuite/store';
import type { ReactiveController } from 'lit';
import type { ReactiveControllerHost } from 'lit';

import { ClipboardAdapter } from './adapter.js';

export * from './adapter.js';

const copyMiddleware = (std: BlockSuiteRoot['std']): JobMiddleware => {
  return ({ slots }) => {
    slots.afterExport.on(payload => {
      if (payload.type === 'block') {
        const handlePoint = (point: TextRangePoint) => {
          const { index, length } = point;
          if (!snapshot.props.text) {
            return;
          }
          (snapshot.props.text as Record<string, unknown>).delta =
            model.text?.sliceToDelta(index, length + index);
        };
        const snapshot = payload.snapshot;
        snapshot.id = std.page.workspace.idGenerator();

        const model = payload.model;
        const text = std.selection.find('text');
        if (text && PathFinder.id(text.from.path) === model.id) {
          handlePoint(text.from);
          return;
        }
        if (text && text.to && PathFinder.id(text.to.path) === model.id) {
          handlePoint(text.to);
          return;
        }
      }
    });
  };
};

const pasteMiddleware = (std: BlockSuiteRoot['std']): JobMiddleware => {
  return ({ slots }) => {
    slots.beforeImport.on(payload => {
      if (payload.type === 'block') {
        const text = std.selection.find('text');
        console.log(payload);
        console.log(text);
      }
    });
  };
};

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
      this.host.handleEvent('copy', this._onCopy);
      this.host.handleEvent('paste', this._onPaste);

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
    }
  }

  hostDisconnected() {
    this._disposables.dispose();
  }

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
        const slice = Slice.fromModels(this._std.page, ctx.selectedModels);
        await this._std.clipboard.copy(e, slice);
        return next();
      })
      .run();
  };

  private _onPaste: UIEventHandler = ctx => {
    const e = ctx.get('clipboardState').raw;
    e.preventDefault();
    const sel = this._std.selection.getGroup('note').at(0);
    if (!sel) {
      return;
    }

    const parent = this._std.view.getParent(sel.path);
    const index = parent?.children.findIndex(x => {
      return PathFinder.equals(x.path, sel.path);
    });

    this._std.clipboard.paste(
      e,
      this._std.page,
      parent?.id,
      index ? index + 1 : undefined
    );
  };
}
