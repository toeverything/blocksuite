import { assertExists } from '@blocksuite/global/utils';
import type {
  BaseAdapter,
  BlockSnapshot,
  JobMiddleware,
  Page,
  Slice,
} from '@blocksuite/store';
import { Job } from '@blocksuite/store';
import * as lz from 'lz-string';

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

  constructor(public std: BlockSuite.Std) {}

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

  // Gated by https://developer.mozilla.org/en-US/docs/Glossary/Transient_activation
  // Need to be cloned to a map for later use
  private _getDataByType = (clipboardData: DataTransfer) => {
    const data = new Map<string, string | File[]>();
    for (const type of clipboardData.types) {
      if (type === 'Files') {
        data.set(type, Array.from(clipboardData.files));
      } else {
        data.set(type, clipboardData.getData(type));
      }
    }
    return (type: string) => {
      const item = data.get(type);
      if (item) {
        return item;
      }
      const files = (data.get('Files') ?? []) as File[];
      if (files.length > 0) {
        return files;
      }
      return '';
    };
  };

  private async _getClipboardItem(slice: Slice, type: string) {
    const job = this._getJob();
    const adapterItem = this._adapterMap.get(type);
    assertExists(adapterItem);
    const { adapter } = adapterItem;
    const snapshot = await job.sliceToSnapshot(slice);
    adapter.applyConfigs(job.adapterConfigs);
    return (
      await adapter.fromSliceSnapshot({ snapshot, assets: job.assetsManager })
    ).file;
  }

  private _getSnapshotByPriority = async (
    getItem: (type: string) => string | File[],
    page: Page,
    parent?: string,
    index?: number
  ) => {
    const byPriority = Array.from(this._adapterMap.entries()).sort(
      (a, b) => b[1].priority - a[1].priority
    );
    for (const [type, { adapter }] of byPriority) {
      const item = getItem(type);
      if (Array.isArray(item)) {
        if (item.length === 0) {
          continue;
        }
        if (
          // if all files are not the same target type, fallback to */*
          !item
            .map(f => f.type === type || type === '*/*')
            .reduce((a, b) => a && b, true)
        ) {
          continue;
        }
      }
      if (item) {
        const job = this._getJob();
        adapter.applyConfigs(job.adapterConfigs);
        const payload = {
          file: item,
          assets: job.assetsManager,
          blockVersions: page.workspace.meta.blockVersions,
          pageVersion: page.workspace.meta.pageVersion,
          workspaceVersion: page.workspace.meta.workspaceVersion,
          workspaceId: page.workspace.id,
          pageId: page.id,
        };
        const sliceSnapshot = await adapter.toSliceSnapshot(payload);
        if (sliceSnapshot) {
          return job.snapshotToSlice(sliceSnapshot, page, parent, index);
        }
      }
    }
    return null;
  };

  copy = async (slice: Slice) => {
    return this.copySlice(slice);
  };

  paste = async (
    event: ClipboardEvent,
    page: Page,
    parent?: string,
    index?: number
  ) => {
    const data = event.clipboardData;
    if (!data) return;

    try {
      const json = this.readFromClipboard(data);
      const slice = await this._getSnapshotByPriority(
        type => json[type],
        page,
        parent,
        index
      );
      assertExists(slice);
      return slice;
    } catch {
      const getDataByType = this._getDataByType(data);
      const slice = await this._getSnapshotByPriority(
        type => getDataByType(type),
        page,
        parent,
        index
      );

      return slice;
    }
  };

  async writeToClipboard(
    updateItems: (
      items: Record<string, unknown>
    ) => Promise<Record<string, unknown>> | Record<string, unknown>
  ) {
    const _items = {
      'text/plain': '',
      'text/html': '',
      'image/png': '',
    };

    const items = await updateItems(_items);

    const text = items['text/plain'] as string;
    const innerHTML = items['text/html'] as string;
    const png = items['image/png'] as string | Blob;

    delete items['text/plain'];
    delete items['text/html'];
    delete items['image/png'];

    const snapshot = lz.compressToEncodedURIComponent(JSON.stringify(items));
    const html = `<div data-blocksuite-snapshot=${snapshot}>${innerHTML}</div>`;
    const htmlBlob = new Blob([html], {
      type: 'text/html',
    });
    const clipboardItems: Record<string, Blob> = {
      'text/html': htmlBlob,
    };
    if (text.length > 0) {
      const textBlob = new Blob([text], {
        type: 'text/plain',
      });
      clipboardItems['text/plain'] = textBlob;
    }

    if (png instanceof Blob) {
      clipboardItems['image/png'] = png;
    } else if (png.length > 0) {
      const pngBlob = new Blob([png], {
        type: 'image/png',
      });
      clipboardItems['image/png'] = pngBlob;
    }
    await navigator.clipboard.write([new ClipboardItem(clipboardItems)]);
  }

  readFromClipboard(clipboardData: DataTransfer) {
    const items = clipboardData.getData('text/html');
    const domParser = new DOMParser();
    const doc = domParser.parseFromString(items, 'text/html');
    const dom = doc.querySelector<HTMLDivElement>('[data-blocksuite-snapshot]');
    assertExists(dom);
    const json = JSON.parse(
      lz.decompressFromEncodedURIComponent(
        dom.dataset.blocksuiteSnapshot as string
      )
    );
    return json;
  }

  pasteBlockSnapshot = async (
    snapshot: BlockSnapshot,
    page: Page,
    parent?: string,
    index?: number
  ) => {
    const job = this._getJob();
    return job.snapshotToBlock(snapshot, page, parent, index);
  };

  copySlice = async (slice: Slice) => {
    const adapterKeys = Array.from(this._adapterMap.keys());

    await this.writeToClipboard(async _items => {
      const items = { ..._items };

      await Promise.all(
        adapterKeys.map(async type => {
          const item = await this._getClipboardItem(slice, type);
          if (typeof item === 'string') {
            items[type] = item;
          }
        })
      );
      return items;
    });
  };
}
