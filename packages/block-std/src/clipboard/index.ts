import { assertExists } from '@blocksuite/global/utils';
import type {
  BaseAdapter,
  JobMiddleware,
  Page,
  Slice,
} from '@blocksuite/store';
import { Job } from '@blocksuite/store';

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
    return adapter.fromSliceSnapshot({ snapshot: snapshot });
  }

  copy = async (event: ClipboardEvent, slice: Slice) => {
    const data = event.clipboardData;
    if (!data) {
      return;
    }
    await Promise.all(
      Array.from(this._adapterMap.keys()).map(async type => {
        const item = await this._getClipboardItem(slice, type);
        if (typeof item === 'string') {
          data.setData(type, item);
        }
      })
    );
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
    const byPriority = Array.from(this._adapterMap.entries()).sort(
      (a, b) => b[1].priority - a[1].priority
    );
    for (const [type, { adapter }] of byPriority) {
      const item = data.getData(type);
      if (item) {
        const job = this._getJob();
        const sliceSnapshot = await adapter.toSliceSnapshot({
          file: item,
          assets: job.assetsManager,
        });
        if (sliceSnapshot) {
          const slice = await job.snapshotToSlice(
            sliceSnapshot,
            page,
            parent,
            index
          );
          return slice;
        }
      }
    }
    return null;
  };
}
