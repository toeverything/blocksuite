import { Buffer } from 'buffer';
import ky from 'ky';

import type { BlobProvider, IdbInstance } from './types';
import { getDatabase, sha3, sleep } from './utils';

export class IndexedDBBlobProvider implements BlobProvider {
  private readonly _database: IdbInstance;
  private readonly _cloud: BlobCloudSync;

  constructor(workspace: string) {
    this._database = getDatabase('blob', workspace);
    this._cloud = new BlobCloudSync(workspace, this._database);
  }

  async get(id: string): Promise<string | null> {
    const blob = await this._database.get(id);
    if (!blob) return this._cloud.get(id);

    const result = URL.createObjectURL(new Blob([blob]));
    return result;
  }

  async set(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer();
    const hash = sha3(Buffer.from(buffer));
    if (!(await this._database.has(hash))) {
      await this._database.set(hash, buffer);
    }

    this._cloud.addTask(hash, 'add');

    return hash;
  }

  async delete(id: string): Promise<void> {
    await this._database.delete(id);

    this._cloud.addTask(id, 'delete');
  }

  async clear(): Promise<void> {
    await this._database.clear();
  }
}

type SyncTask = {
  id: string;
  blob: ArrayBufferLike | undefined;
  type: 'add' | 'delete';
  retry: number;
};

type BlobStatus = {
  exists: boolean;
};

export class BlobCloudSync {
  private readonly _abortController = new AbortController();
  private readonly _fetcher = ky.create({
    prefixUrl: '/api/v1/blob',
    signal: this._abortController.signal,
  });
  private readonly _database: IdbInstance;
  private readonly _padding: IdbInstance<{
    retry: number;
    type: 'add' | 'delete';
  }>;
  private readonly _paddingPipeline: SyncTask[] = [];
  private readonly _workspace: string;

  private _pipeline: SyncTask[] = [];
  private initialized = false;

  constructor(workspace: string, db: IdbInstance) {
    this._database = db;
    this._padding = getDatabase('padding', workspace);
    this._workspace = workspace;

    this._padding.keys().then(async keys => {
      this._pipeline = (
        await Promise.all(
          keys.map(async id => {
            const { retry = 0, type } = (await this._padding.get(id)) || {};
            const blob = await db.get(id);
            if ((blob || type === 'delete') && type) {
              return { id, blob, retry, type };
            }
            return undefined;
          })
        )
      ).filter((v): v is SyncTask => !!v);

      this.initialized = true;
      this._paddingPipeline.forEach(task => this._pipeline.push(task));
      this._paddingPipeline.length = 0;

      this.taskRunner();
    });
  }

  private async taskRunner() {
    const signal = this._abortController.signal;

    while (!signal.aborted) {
      let task: SyncTask | undefined;
      while (
        typeof (task = this._pipeline.shift()) !== 'undefined' &&
        !signal.aborted
      ) {
        try {
          const api = `${this._workspace}/${task.id}`;

          const status = await this._fetcher.head(api).json<BlobStatus>();
          if (!status.exists) {
            const status = await this._fetcher
              .post(api, { body: task.blob, retry: 3 })
              .json<BlobStatus>();
            if (status.exists) {
              await this._padding.delete(task.id);
            } else {
              await this._padding.set(task.id, {
                type: task.type,
                retry: task.retry + 1,
              });
              this._pipeline.push({ ...task, retry: task.retry + 1 });
              await sleep(Math.min(10, task.retry) * 100);
            }
          }
        } catch (e) {
          console.warn('Error while syncing blob', e);
        }
      }
      await sleep(500);
    }

    console.error('BlobCloudSync taskRunner exited');
  }

  async get(id: string): Promise<string | null> {
    const api = `${this._workspace}/${id}`;
    try {
      const blob = await this._fetcher.get(api).blob();

      await this._database.set(id, await blob.arrayBuffer());

      return URL.createObjectURL(blob);
    } catch (e) {
      console.error('Error while getting blob', e);
      return null;
    }
  }

  async addTask(id: string, type: 'add' | 'delete') {
    const blob = await this._database.get(id);
    if (blob || type === 'delete') {
      if (this.initialized) {
        this._pipeline.push({ id, blob, type, retry: 0 });
      } else {
        this._paddingPipeline.push({ id, blob, type, retry: 0 });
      }
    } else {
      console.error('Blob not found', id);
    }
  }
}
