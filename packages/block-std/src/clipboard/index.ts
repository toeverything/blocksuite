import { assertExists } from '@blocksuite/global/utils';
import type {
  BaseAdapter,
  JobMiddleware,
  Page,
  Slice,
} from '@blocksuite/store';
import { Job } from '@blocksuite/store';
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from 'lz-string';

import type { BlockStdProvider } from '../provider/index.js';

type AdapterMap = Map<
  string,
  {
    adapter: BaseAdapter;
    priority: number;
  }
>;

export class Clipboard {
  private _jobMiddlewares: JobMiddleware[] = [];
  private _adapterMap: AdapterMap = new Map();

  constructor(public std: BlockStdProvider) {}

  use = (middleware: JobMiddleware) => {
    this._jobMiddlewares.push(middleware);
  };

  unuse = (middleware: JobMiddleware) => {
    this._jobMiddlewares = this._jobMiddlewares.filter(m => m !== middleware);
  };

  registerAdapter = (mimeType: string, adapter: BaseAdapter, priority = 0) => {
    this._adapterMap.set(mimeType, { adapter, priority });
  };

  unregisterAdapter = (mimeType: string) => {
    this._adapterMap.delete(mimeType);
  };

  private _getJob() {
    return new Job({
      middlewares: this._jobMiddlewares,
      workspace: this.std.workspace,
    });
  }

  private async _getClipboardItem(slice: Slice, type: string) {
    const job = this._getJob();
    const adapterItem = this._adapterMap.get(type);
    assertExists(adapterItem);
    const { adapter } = adapterItem;
    const snapshot = await job.sliceToSnapshot(slice);
    return adapter.fromSliceSnapshot({ snapshot, assets: job.assetsManager });
  }

  private _getSnapshotByPriority = async (
    getItem: (type: string) => string,
    page: Page,
    parent?: string,
    index?: number
  ) => {
    const byPriority = Array.from(this._adapterMap.entries()).sort(
      (a, b) => b[1].priority - a[1].priority
    );
    for (const [type, { adapter }] of byPriority) {
      const item = getItem(type);
      if (item) {
        const job = this._getJob();
        const sliceSnapshot = await adapter.toSliceSnapshot({
          file: item,
          assets: job.assetsManager,
        });
        if (sliceSnapshot) {
          return job.snapshotToSlice(sliceSnapshot, page, parent, index);
        }
      }
    }
    return null;
  };

  copy = async (event: ClipboardEvent, slice: Slice) => {
    const data = event.clipboardData;
    if (!data) {
      return;
    }
    const items: Record<string, string> = {};
    await Promise.all(
      Array.from(this._adapterMap.keys()).map(async type => {
        const item = await this._getClipboardItem(slice, type);
        if (typeof item === 'string') {
          items[type] = item;
        }
      })
    );
    const snapshot = compressToEncodedURIComponent(JSON.stringify(items));
    const html = `<div data-blocksuite-snapshot=${snapshot}></div>`;
    const blob = new Blob([html], {
      type: 'text/html',
    });
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': blob,
      }),
    ]);
  };

  paste = async (
    event: ClipboardEvent,
    page: Page,
    parent?: string,
    index?: number
  ) => {
    const data = event.clipboardData;
    if (!data) {
      return;
    }
    const items = data.getData('text/html');
    try {
      const domParser = new DOMParser();
      const doc = domParser.parseFromString(items, 'text/html');
      const dom = doc.querySelector<HTMLDivElement>(
        '[data-blocksuite-snapshot]'
      );
      assertExists(dom);
      const json = JSON.parse(
        decompressFromEncodedURIComponent(
          dom.dataset.blocksuiteSnapshot as string
        )
      );
      const slice = await this._getSnapshotByPriority(
        type => json[type],
        page,
        parent,
        index
      );
      assertExists(slice);
      return slice;
    } catch {
      const slice = await this._getSnapshotByPriority(
        type => data.getData(type),
        page,
        parent,
        index
      );

      return slice;
    }
  };
}
