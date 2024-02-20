import { mergeUpdates } from '../../utils/merge-updates.js';
import type { DocSource } from '../source.js';

export class MemoryDocSource implements DocSource {
  memory = new Map<string, Uint8Array>();

  name: string = 'testing';
  pull(docId: string, _: Uint8Array) {
    const key = docId;
    const data = this.memory.get(key);
    if (data) {
      return { data };
    } else {
      return null;
    }
  }
  push(docId: string, data: Uint8Array) {
    const key = docId;
    const oldData = this.memory.get(key);
    const update = mergeUpdates(oldData ? [oldData, data] : [data]);
    this.memory.set(key, update);
  }
  subscribe(
    _cb: (docId: string, data: Uint8Array) => void,
    _disconnect: (reason: string) => void
  ) {
    return () => {};
  }
}
