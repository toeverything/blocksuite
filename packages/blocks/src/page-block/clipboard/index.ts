import type { UIEventHandler } from '@blocksuite/block-std';
import { assertExists, DisposableGroup } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';
import type { BlockSnapshot, Page } from '@blocksuite/store';

import { HtmlAdapter, ImageAdapter } from '../../_common/adapters/index.js';
import { MarkdownAdapter } from '../../_common/adapters/markdown.js';
import { replaceIdMiddleware } from '../../_common/transformers/middlewares.js';
import { ClipboardAdapter } from './adapter.js';
import { copyMiddleware, pasteMiddleware } from './middlewares/index.js';

export class PageClipboard {
  protected _disposables = new DisposableGroup();
  host: BlockElement;

  private get _std() {
    return this.host.std;
  }

  private _clipboardAdapter = new ClipboardAdapter();
  private _markdownAdapter = new MarkdownAdapter();
  private _htmlAdapter = new HtmlAdapter();
  private _imageAdapter = new ImageAdapter();

  constructor(host: BlockElement) {
    this.host = host;
  }

  hostConnected() {
    if (this._disposables.disposed) {
      this._disposables = new DisposableGroup();
    }
    this.host.handleEvent('copy', this.onPageCopy);
    this.host.handleEvent('paste', this.onPagePaste);
    this.host.handleEvent('cut', this.onPageCut);
    this._init();
  }

  hostDisconnected() {
    this._disposables.dispose();
  }

  protected _init = () => {
    this._std.clipboard.registerAdapter(
      ClipboardAdapter.MIME,
      this._clipboardAdapter,
      100
    );
    this._std.clipboard.registerAdapter(
      'text/plain',
      this._markdownAdapter,
      90
    );
    this._std.clipboard.registerAdapter('text/html', this._htmlAdapter, 80);
    [
      'image/apng',
      'image/avif',
      'image/gif',
      'image/jpeg',
      'image/png',
      'image/svg+xml',
      'image/webp',
    ].map(type =>
      this._std.clipboard.registerAdapter(type, this._imageAdapter, 70)
    );
    const copy = copyMiddleware(this._std);
    const paste = pasteMiddleware(this._std);
    this._std.clipboard.use(copy);
    this._std.clipboard.use(paste);
    this._std.clipboard.use(replaceIdMiddleware);

    this._disposables.add({
      dispose: () => {
        this._std.clipboard.unregisterAdapter(ClipboardAdapter.MIME);
        this._std.clipboard.unregisterAdapter('text/plain');
        this._std.clipboard.unregisterAdapter('text/html');
        [
          'image/apng',
          'image/avif',
          'image/gif',
          'image/jpeg',
          'image/png',
          'image/svg+xml',
          'image/webp',
        ].map(type => this._std.clipboard.unregisterAdapter(type));
        this._std.clipboard.unuse(copy);
        this._std.clipboard.unuse(paste);
        this._std.clipboard.unuse(replaceIdMiddleware);
      },
    });
  };

  private _copySelected = (event: ClipboardEvent, onCopy?: () => void) => {
    return this._std.command
      .pipe()
      .withHost()
      .with({ onCopy })
      .getSelectedModels()
      .copySelectedModels({ event });
  };

  public onPageCopy: UIEventHandler = ctx => {
    const e = ctx.get('clipboardState').raw;
    e.preventDefault();

    this._copySelected(e).run();
  };

  public onPageCut: UIEventHandler = ctx => {
    const e = ctx.get('clipboardState').raw;
    e.preventDefault();

    this._copySelected(e, () => {
      this._std.command
        .pipe()
        .withHost()
        .try(cmd => [
          cmd.getTextSelection().deleteText(),
          cmd.getSelectedModels().deleteSelectedModels(),
        ])
        .run();
    }).run();
  };

  public onPagePaste: UIEventHandler = ctx => {
    const e = ctx.get('clipboardState').raw;
    e.preventDefault();

    this._std.page.captureSync();
    this._std.command
      .pipe()
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

  public onBlockSnapshotPaste = (
    snapshot: BlockSnapshot,
    page: Page,
    parent?: string,
    index?: number
  ) => {
    this._std.command
      .pipe()
      .inline((_ctx, next) => {
        this._std.clipboard.pasteBlockSnapshot(snapshot, page, parent, index);

        return next();
      })
      .run();
  };
}
