import type * as Y from 'yjs';
// @ts-ignore
import { WebrtcProvider } from 'y-webrtc';
import type { Awareness } from 'y-protocols/awareness.js';
import { isWeb } from '@blocksuite/global/utils';

export interface DocProvider {
  awareness?: Awareness;
  connect?: () => void;
  disconnect?: () => void;
  clearData?: () => Promise<void>;
  destroy?: () => void;
}

/** See {@link DocProvider} */
export interface DocProviderConstructor {
  new (
    room: string,
    doc: Y.Doc,
    options?: { awareness?: Awareness }
  ): DocProvider;
}

// When using playground from blocksuite repo, this comes from "serve" script in "@blocksuite/store" package.
// We use our own sync server because a local service for sync makes everything much faster for dev.
const LOCAL_SIGNALING = ['ws://localhost:4444'];

const DEFAULT_SIGNALING = [
  // Default config from yjs (but these are kinda slow by comparison to self host sync ~100ms-+1000ms latency observed).
  // This slowness is also avoided in order to improve test reliability in CI.
  'wss://y-webrtc-signaling-us.herokuapp.com',
  'wss://y-webrtc-signaling-eu.herokuapp.com',
];

const isLocalhost =
  isWeb &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1');
const signaling = isLocalhost ? LOCAL_SIGNALING : DEFAULT_SIGNALING;

export class DebugDocProvider extends WebrtcProvider implements DocProvider {
  constructor(room: string, doc: Y.Doc, options?: { awareness?: Awareness }) {
    super(room, doc, {
      awareness: options?.awareness,
      signaling,
    });
  }

  clearData() {
    // Do nothing for now
    return Promise.resolve();
  }
}
