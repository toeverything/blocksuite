import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness.js';
import { WebrtcProvider } from 'y-webrtc';
import { IndexeddbPersistence } from 'y-indexeddb';

export interface Provider {
  awareness?: Awareness;
  connect: () => void;
  disconnect: () => void;
  clearData: () => Promise<void>;
  destroy: () => void;
}

export class DebugProvider implements Provider {
  private webrtc: WebrtcProvider;

  public awareness: Awareness;
  public connect: () => void;
  public disconnect: () => void;
  public destroy: () => void;

  constructor(room: string, doc: Y.Doc) {
    this.webrtc = new WebrtcProvider(room, doc, {
      signaling: [
        'ws://localhost:4444',
        // 'wss://y-webrtc-signaling-us.herokuapp.com',
        // 'wss://y-webrtc-signaling-eu.herokuapp.com',
      ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    this.awareness = this.webrtc.awareness;
    this.connect = () => Promise.resolve(this.webrtc.connect());
    this.disconnect = () => Promise.resolve(this.webrtc.disconnect());
    this.destroy = () => Promise.resolve(this.webrtc.destroy());
  }

  public clearData() {
    return Promise.resolve();
  }
}

export class IndexedDBProvider implements Provider {
  private idb: IndexeddbPersistence;

  awareness?: Awareness | undefined;

  constructor(name: string, doc: Y.Doc) {
    this.idb = new IndexeddbPersistence(name, doc);
  }

  connect() {
    return;
  }

  disconnect() {
    return;
  }

  destroy() {
    return this.idb.destroy();
  }

  clearData() {
    return this.idb.clearData();
  }
}
