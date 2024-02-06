import type { SyncStorage } from '../sync/storage.js';
import { mergeUpdates } from '../utils/merge-updates.js';

export class MemorySyncStorage implements SyncStorage {
  memory = new Map<string, Uint8Array>();

  name: string = 'testing';
  async pull(
    docId: string,
    _: Uint8Array
  ): Promise<{ data: Uint8Array; state?: Uint8Array | undefined } | null> {
    const key = docId;
    const data = this.memory.get(key);
    if (data) {
      return { data };
    } else {
      return null;
    }
  }
  async push(docId: string, data: Uint8Array): Promise<void> {
    const key = docId;
    const oldData = this.memory.get(key);
    const update = mergeUpdates(oldData ? [oldData, data] : [data]);
    this.memory.set(key, update);
  }
  async subscribe(
    _cb: (docId: string, data: Uint8Array) => void,
    _disconnect: (reason: string) => void
  ): Promise<() => void> {
    return () => {};
  }
}
