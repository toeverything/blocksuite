import type { DocSource } from '../source.js';

export class NoopDocSource implements DocSource {
  name = 'noop';

  pull(_docId: string, _data: Uint8Array) {
    return null;
  }

  push(_docId: string, _data: Uint8Array) {}

  subscribe(
    _cb: (docId: string, data: Uint8Array) => void,
    _disconnect: (reason: string) => void
  ) {
    return () => {};
  }
}
