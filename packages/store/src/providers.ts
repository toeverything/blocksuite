import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { Awareness } from 'y-protocols/awareness';

export abstract class Provider {
  awareness?: Awareness;
  abstract connect: () => void;
  abstract disconnect: () => void;
  abstract clearData: () => Promise<void>;
  abstract destroy: () => void;
}

export type ProviderFactory = new (
  room: string,
  ydoc: Y.Doc,
  options?: { awareness?: Awareness }
) => Provider;

// type FactoryOptions = ConstructorParameters<ProviderFactory>;

export class DebugProvider extends WebrtcProvider implements Provider {
  constructor(room: string, doc: Y.Doc, options?: { awareness?: Awareness }) {
    super(room, doc, {
      awareness: options?.awareness,
      signaling: [
        'ws://localhost:4444',
        // 'wss://y-webrtc-signaling-us.herokuapp.com',
        // 'wss://y-webrtc-signaling-eu.herokuapp.com',
      ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  }

  public clearData() {
    // Do nothing for now
    return Promise.resolve();
  }
}
