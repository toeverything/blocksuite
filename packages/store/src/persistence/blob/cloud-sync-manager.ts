import { sleep, Slot } from '@blocksuite/global/utils';
import ky from 'ky';

import type { BlobOptionsGetter } from './duplex-provider.js';
import type {
  BlobId,
  BlobProvider,
  IDBInstance,
  PendingTask,
  SyncTask,
} from './types.js';
import { BlobSyncState } from './types.js';
import { getDatabase } from './utils.js';

export class CloudSyncManager {
  private readonly _db: IDBInstance<PendingTask>;
  private readonly _fetcher: typeof ky;

  private _pipeline: SyncTask[] = [];
  private _failed: SyncTask[] = [];
  private _whenReady!: Promise<void>;
  private _running = false;

  private _workspace!: string;

  readonly slotss: BlobProvider['slots'] = {
    onBlobSyncStateChange: new Slot(),
  };

  constructor(workspace: string, blobOptionsGetter: BlobOptionsGetter) {
    this._workspace = workspace;

    this._fetcher = ky.create({
      prefixUrl: blobOptionsGetter('api'),
      throwHttpErrors: false,
      hooks: {
        beforeRequest: [
          async request => {
            const token = blobOptionsGetter('token');
            if (token) {
              request.headers.set('Authorization', token);
            }
          },
        ],
      },
    });

    this._db = getDatabase<PendingTask>('pending', this._workspace);
    this._whenReady = this._db.values().then(tasks => {
      this._pipeline.push(
        ...tasks.map(task => ({
          ...task,
          retry: 0,
          // force retry failed task
          failed: false,
        }))
      );

      this._runTasks();
    });
  }

  get running() {
    return this._running;
  }

  private async _runTasks() {
    if (this._running) {
      return;
    }
    this._running = true;
    while (this._pipeline.length) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const task = this._pipeline.shift()!;

      try {
        const resp = await this._fetcher.head(
          `${this._workspace}/blob/${task.id}`
        );

        if (resp.status === 404) {
          this.slotss.onBlobSyncStateChange.emit({
            id: task.id,
            state: BlobSyncState.Syncing,
          });
          const response = await this._fetcher.put(`${this._workspace}/blob`, {
            body: task.blob,
          });

          if (response.status === 200) {
            this.slotss.onBlobSyncStateChange.emit({
              id: task.id,
              state: BlobSyncState.Success,
            });
            await this._db.delete(task.id);
            continue;
          }

          if (response.status === 413 || task.retry >= 10) {
            if (response.status === 413) {
              console.log('blob too large:', task.id);
            }
            await this._db.set(task.id, { ...task, failed: true });
            this._failed.push({ ...task, failed: true });
            this.slotss.onBlobSyncStateChange.emit({
              id: task.id,
              state: BlobSyncState.Failed,
            });
            continue;
          }

          this._pipeline.push({
            ...task,
            retry: task.retry + 1,
          });
        }
      } catch (e) {
        console.warn('Error while syncing blob', e);
        this.slotss.onBlobSyncStateChange.emit({
          id: task.id,
          state: BlobSyncState.Failed,
        });
      }

      // task interval
      await sleep(500);
    }
    this._running = false;
  }

  async addTask(id: BlobId, blob: Blob) {
    await this._whenReady;
    const buffer = await blob.arrayBuffer();
    await this._db.set(id, { id, blob: buffer });
    this._pipeline.push({
      id,
      blob: buffer,
      retry: 0,
    });
    this._runTasks();
    this.slotss.onBlobSyncStateChange.emit({
      id,
      state: BlobSyncState.Waiting,
    });
    return;
  }

  async get(id: BlobId): Promise<Blob | null> {
    const endpoint = `${this._workspace}/blob/${id}`;
    try {
      return await this._fetcher
        .get(endpoint, { throwHttpErrors: true })
        .blob();
    } catch (e) {
      console.error('Error while getting blob', e);
      return null;
    }
  }
}
