import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { Awareness } from 'y-protocols/awareness.js';

export interface Provider {
  awareness?: Awareness;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  clearData: () => Promise<void>;
  destroy: () => Promise<void>;
}

export class DebugProvider implements Provider {
  private webrtc: WebrtcProvider;

  public awareness: Awareness;
  public connect: () => Promise<void>;
  public disconnect: () => Promise<void>;
  public destroy: () => Promise<void>;

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
