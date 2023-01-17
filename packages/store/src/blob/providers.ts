import ky from 'ky';
import { Signal } from '../utils/signal.js';

import type { BlobId, BlobProvider, BlobURL, IDBInstance } from './types.js';
import { getDatabase, sha } from './utils.js';
import { sleep } from '@blocksuite/global/utils';

const RETRY_TIMEOUT = 500;

interface BlobProviderStatic {
  init(workspace: string, cloudApi?: string): Promise<BlobProvider>;
}

function staticImplements<T>() {
  return <U extends T>(constructor: U) => constructor;
}

@staticImplements<BlobProviderStatic>()
export class IndexedDBBlobProvider implements BlobProvider {
  private readonly _database: IDBInstance;
  private readonly _cloud?: BlobCloudSync;

  readonly blobs: Set<string> = new Set();
  readonly signals = {
    blobAdded: new Signal<BlobId>(),
    blobDeleted: new Signal<BlobId>(),
  };

  static async init(
    workspace: string,
    cloudApi?: string
  ): Promise<IndexedDBBlobProvider> {
    const provider = new IndexedDBBlobProvider(workspace, cloudApi);
    await provider._initBlobs();
    return provider;
  }

  private async _initBlobs() {
    const entries = await this._database.keys();
    for (const key of entries) {
      const blobId = key as BlobId;
      this.signals.blobAdded.emit(blobId);
      this.blobs.add(blobId);
    }
  }

  private constructor(workspace: string, cloudApi?: string) {
    this._database = getDatabase('blob', workspace);
    if (cloudApi) {
      this._cloud = new BlobCloudSync(workspace, cloudApi, this._database);
    }
  }

  async get(id: BlobId): Promise<BlobURL | null> {
    const blob = await this._database.get(id);
    if (!blob) {
      const blob = this._cloud?.get(id);
      if (blob) {
        this.signals.blobAdded.emit(id);
        this.blobs.add(id);

        return blob;
      }
      return null;
    }

    const result = URL.createObjectURL(new Blob([blob]));
    return result;
  }

  async set(blob: Blob): Promise<BlobId> {
    const buffer = await blob.arrayBuffer();
    const hash = await sha(buffer);
    if (!(await this._database.has(hash))) {
      await this._database.set(hash, buffer);

      this.signals.blobAdded.emit(hash);
      this.blobs.add(hash);
    }

    this._cloud?.addTask(hash, 'add');

    return hash;
  }

  async delete(id: BlobId): Promise<void> {
    await this._database.delete(id);

    this.signals.blobDeleted.emit(id);
    this.blobs.delete(id);
    this._cloud?.addTask(id, 'delete');
  }

  async clear(): Promise<void> {
    await this._database.clear();
    this.blobs.clear();
  }
}

type SyncTask = {
  id: BlobId;
  blob: ArrayBufferLike | undefined;
  type: 'add' | 'delete';
  retry: number;
};

type BlobStatus = {
  exists: boolean;
};

export class BlobCloudSync {
  private readonly _abortController = new AbortController();
  private readonly _fetcher: typeof ky;
  private readonly _database: IDBInstance;
  private readonly _pending: IDBInstance<{
    retry: number;
    type: 'add' | 'delete';
  }>;
  private readonly _pendingPipeline: SyncTask[] = [];
  private readonly _workspace: string;

  private _pipeline: SyncTask[] = [];
  private initialized = false;

  constructor(workspace: string, prefixUrl: string, db: IDBInstance) {
    this._fetcher = ky.create({
      prefixUrl,
      signal: this._abortController.signal,
      throwHttpErrors: false,
    });

    this._database = db;
    this._pending = getDatabase('pending', workspace);
    this._workspace = workspace;

    this._pending.keys().then(async keys => {
      this._pipeline = (
        await Promise.all(
          keys.map(async id => {
            const { retry = 0, type } = (await this._pending.get(id)) || {};
            const blob = await db.get(id);
            if ((blob || type === 'delete') && type) {
              return { id, blob, retry, type };
            }
            return undefined;
          })
        )
      ).filter((v): v is SyncTask => !!v);

      this.initialized = true;
      this._pendingPipeline.forEach(task => this._pipeline.push(task));
      this._pendingPipeline.length = 0;

      this._taskRunner();
    });
  }

  private async _handleTaskRetry(task: SyncTask, status?: BlobStatus) {
    if (status?.exists) {
      await this._pending.delete(task.id);
    } else {
      await this._pending.set(task.id, {
        type: task.type,
        retry: task.retry + 1,
      });
      this._pipeline.push({ ...task, retry: task.retry + 1 });
      await sleep(Math.min(10, task.retry) * 100);
    }
  }

  private async _taskRunner() {
    const signal = this._abortController.signal;

    while (!signal.aborted) {
      let task: SyncTask | undefined;
      while (
        typeof (task = this._pipeline.shift()) !== 'undefined' &&
        !signal.aborted
      ) {
        try {
          const resp = await this._fetcher.head(
            `${this._workspace}/blob/${task.id}`
          );
          if (resp.status === 404) {
            const status = await this._fetcher
              .put(`${this._workspace}/blob`, { body: task.blob, retry: 3 })
              .json<BlobStatus>();
            await this._handleTaskRetry(task, status);
          }
        } catch (e) {
          console.warn('Error while syncing blob', e);
          await this._handleTaskRetry(task);
        }
      }
      await sleep(RETRY_TIMEOUT);
    }

    console.error('BlobCloudSync taskRunner exited');
  }

  async get(id: BlobId): Promise<BlobURL | null> {
    const api = `${this._workspace}/blob/${id}`;
    try {
      const blob = await this._fetcher
        .get(api, { throwHttpErrors: true })
        .blob();

      await this._database.set(id, await blob.arrayBuffer());

      return URL.createObjectURL(blob);
    } catch (e) {
      console.error('Error while getting blob', e);
      return null;
    }
  }

  async addTask(id: BlobId, type: 'add' | 'delete') {
    const blob = await this._database.get(id);
    if (blob || type === 'delete') {
      if (this.initialized) {
        this._pipeline.push({ id, blob, type, retry: 0 });
      } else {
        this._pendingPipeline.push({ id, blob, type, retry: 0 });
      }

      console.log(this._pipeline, this._pendingPipeline);
    } else {
      console.error('Blob not found', id);
    }
  }
}
