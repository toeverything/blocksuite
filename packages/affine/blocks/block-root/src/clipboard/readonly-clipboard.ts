import { defaultImageProxyMiddleware } from '@blocksuite/affine-block-image';
import {
  AttachmentAdapter,
  copyMiddleware,
  HtmlAdapter,
  ImageAdapter,
  MixTextAdapter,
  NotionTextAdapter,
  titleMiddleware,
} from '@blocksuite/affine-shared/adapters';
import {
  copySelectedModelsCommand,
  draftSelectedModelsCommand,
  getSelectedModelsCommand,
} from '@blocksuite/affine-shared/commands';
import type { BlockComponent, UIEventHandler } from '@blocksuite/block-std';
import { DisposableGroup } from '@blocksuite/global/disposable';

import { ClipboardAdapter } from './adapter.js';

/**
 * ReadOnlyClipboard is a class that provides a read-only clipboard for the root block.
 * It is supported to copy models in the root block.
 */
export class ReadOnlyClipboard {
  protected readonly _copySelected = (onCopy?: () => void) => {
    return this._std.command
      .chain()
      .with({ onCopy })
      .pipe(getSelectedModelsCommand)
      .pipe(draftSelectedModelsCommand)
      .pipe(copySelectedModelsCommand);
  };

  protected _disposables = new DisposableGroup();

  protected _initAdapters = () => {
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
    ].forEach(type =>
      this._std.clipboard.registerAdapter(type, ImageAdapter, 80)
    );
    this._std.clipboard.registerAdapter('text/plain', MixTextAdapter, 70);
    this._std.clipboard.registerAdapter('*/*', AttachmentAdapter, 60);
    const copy = copyMiddleware(this._std);
    this._std.clipboard.use(copy);
    this._std.clipboard.use(
      titleMiddleware(this._std.store.workspace.meta.docMetas)
    );
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
        ].forEach(type => this._std.clipboard.unregisterAdapter(type));
        this._std.clipboard.unregisterAdapter('text/html');
        this._std.clipboard.unregisterAdapter('*/*');
        this._std.clipboard.unuse(copy);
        this._std.clipboard.unuse(
          titleMiddleware(this._std.store.workspace.meta.docMetas)
        );
        this._std.clipboard.unuse(defaultImageProxyMiddleware);
      },
    });
  };

  host: BlockComponent;

  onPageCopy: UIEventHandler = ctx => {
    const e = ctx.get('clipboardState').raw;
    e.preventDefault();

    this._copySelected().run();
  };

  protected get _std() {
    return this.host.std;
  }

  constructor(host: BlockComponent) {
    this.host = host;
  }

  hostConnected() {
    if (this._disposables.disposed) {
      this._disposables = new DisposableGroup();
    }
    if (navigator.clipboard) {
      this.host.handleEvent('copy', this.onPageCopy);
      this._initAdapters();
    }
  }

  hostDisconnected() {
    this._disposables.dispose();
  }
}

export { copyMiddleware };
