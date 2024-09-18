import type { BlockComponent, UIEventHandler } from '@blocksuite/block-std';
import type { BlockSnapshot, Doc } from '@blocksuite/store';

import { assertExists, DisposableGroup } from '@blocksuite/global/utils';

import {
  AttachmentAdapter,
  HtmlAdapter,
  ImageAdapter,
  MixTextAdapter,
  NotionTextAdapter,
} from '../../_common/adapters/index.js';
import {
  defaultImageProxyMiddleware,
  replaceIdMiddleware,
  titleMiddleware,
} from '../../_common/transformers/middlewares.js';
import { ClipboardAdapter } from './adapter.js';
import { copyMiddleware, pasteMiddleware } from './middlewares/index.js';

export class PageClipboard {
  private _copySelected = (onCopy?: () => void) => {
    return this._std.command
      .chain()
      .with({ onCopy })
      .getSelectedModels()
      .draftSelectedModels()
      .copySelectedModels();
  };

  protected _disposables = new DisposableGroup();

  protected _init = () => {
    this._std.clipboard.registerAdapter(
      ClipboardAdapter.MIME,
      ClipboardAdapter,
      100
    );
    this._std.clipboard.registerAdapter(
      'text/_notion-text-production',
      NotionTextAdapter,
      95
    );
    this._std.clipboard.registerAdapter('text/html', HtmlAdapter, 90);
    [
      'image/apng',
      'image/avif',
      'image/gif',
      'image/jpeg',
      'image/png',
      'image/svg+xml',
      'image/webp',
    ].map(type => this._std.clipboard.registerAdapter(type, ImageAdapter, 80));
    this._std.clipboard.registerAdapter('text/plain', MixTextAdapter, 70);
    this._std.clipboard.registerAdapter('*/*', AttachmentAdapter, 60);
    const copy = copyMiddleware(this._std);
    const paste = pasteMiddleware(this._std);
    this._std.clipboard.use(copy);
    this._std.clipboard.use(paste);
    this._std.clipboard.use(replaceIdMiddleware);
    this._std.clipboard.use(titleMiddleware);
    this._std.clipboard.use(defaultImageProxyMiddleware);

    this._disposables.add({
      dispose: () => {
        this._std.clipboard.unregisterAdapter(ClipboardAdapter.MIME);
        this._std.clipboard.unregisterAdapter('text/plain');
        [
          'image/apng',
          'image/avif',
          'image/gif',
          'image/jpeg',
          'image/png',
          'image/svg+xml',
          'image/webp',
        ].map(type => this._std.clipboard.unregisterAdapter(type));
        this._std.clipboard.unregisterAdapter('text/html');
        this._std.clipboard.unregisterAdapter('*/*');
        this._std.clipboard.unuse(copy);
        this._std.clipboard.unuse(paste);
        this._std.clipboard.unuse(replaceIdMiddleware);
        this._std.clipboard.unuse(titleMiddleware);
        this._std.clipboard.unuse(defaultImageProxyMiddleware);
      },
    });
  };

  host: BlockComponent;

  onBlockSnapshotPaste = async (
    snapshot: BlockSnapshot,
    doc: Doc,
    parent?: string,
    index?: number
  ) => {
    const block = await this._std.clipboard.pasteBlockSnapshot(
      snapshot,
      doc,
      parent,
      index
    );
    return block?.id ?? null;
  };

  onPageCopy: UIEventHandler = ctx => {
    const e = ctx.get('clipboardState').raw;
    e.preventDefault();

    this._copySelected().run();
  };

  onPageCut: UIEventHandler = ctx => {
    const e = ctx.get('clipboardState').raw;
    e.preventDefault();

    this._copySelected(() => {
      this._std.command
        .chain()
        .try(cmd => [
          cmd.getTextSelection().deleteText(),
          cmd.getSelectedModels().deleteSelectedModels(),
        ])
        .run();
    }).run();
  };

  onPagePaste: UIEventHandler = ctx => {
    const e = ctx.get('clipboardState').raw;
    e.preventDefault();

    this._std.doc.captureSync();
    this._std.command
      .chain()
      .try(cmd => [
        cmd.getTextSelection().inline<'currentSelectionPath'>((ctx, next) => {
          const textSelection = ctx.currentTextSelection;
          if (!textSelection) {
            return;
          }
          const end = textSelection.to ?? textSelection.from;
          next({ currentSelectionPath: end.blockId });
        }),
        cmd.getBlockSelections().inline<'currentSelectionPath'>((ctx, next) => {
          const currentBlockSelections = ctx.currentBlockSelections;
          if (!currentBlockSelections) {
            return;
          }
          const blockSelection = currentBlockSelections.at(-1);
          if (!blockSelection) {
            return;
          }
          next({ currentSelectionPath: blockSelection.blockId });
        }),
        cmd.getImageSelections().inline<'currentSelectionPath'>((ctx, next) => {
          const currentImageSelections = ctx.currentImageSelections;
          if (!currentImageSelections) {
            return;
          }
          const imageSelection = currentImageSelections.at(-1);
          if (!imageSelection) {
            return;
          }
          next({ currentSelectionPath: imageSelection.blockId });
        }),
      ])
      .getBlockIndex()
      .inline((ctx, next) => {
        assertExists(ctx.parentBlock);
        this._std.clipboard
          .paste(
            e,
            this._std.doc,
            ctx.parentBlock.model.id,
            ctx.blockIndex ? ctx.blockIndex + 1 : 1
          )
          .catch(console.error);

        return next();
      })
      .run();
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
    this.host.handleEvent('copy', this.onPageCopy);
    this.host.handleEvent('paste', this.onPagePaste);
    this.host.handleEvent('cut', this.onPageCut);
    this._init();
  }

  hostDisconnected() {
    this._disposables.dispose();
  }
}

export { copyMiddleware, pasteMiddleware };
