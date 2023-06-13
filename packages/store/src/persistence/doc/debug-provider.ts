import { isWeb, Slot } from '@blocksuite/global/utils';
import type { Awareness } from 'y-protocols/awareness';
// @ts-ignore
import { Room, WebrtcProvider } from 'y-webrtc';
import type * as Y from 'yjs';

import type { DocBackgroundProvider } from './index.js';

// When using playground from blocksuite repo, t./idb-provider.js "serve" script in "@blocksuite/store" package.
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

export class DebugDocProvider
  extends WebrtcProvider
  implements DocBackgroundProvider
{
  public readonly background = true as const;
  public readonly flavour = 'blocksuite-debug';
  public remoteUpdateSlot = new Slot<unknown>();

  private readonly _doc: Y.Doc;
  private _connected = false;

  constructor(id: string, doc: Y.Doc, options?: { awareness?: Awareness }) {
    super(id, doc, {
      awareness: options?.awareness,
      signaling,
    });
    this._doc = doc;
  }

  private _handleRemoteUpdate = (update: unknown, origin: unknown) => {
    if (origin instanceof Room) {
      this.remoteUpdateSlot.emit(update);
    }
  };

  get connected() {
    return this._connected;
  }

  connect = () => {
    super.connect();
    this._doc.on('update', this._handleRemoteUpdate);
    this._connected = true;
  };

  disconnect = () => {
    super.disconnect();
    this._doc.off('update', this._handleRemoteUpdate);
    this._connected = false;
  };

  public cleanup() {
    // Do nothing for now
    return Promise.resolve();
  }
}
