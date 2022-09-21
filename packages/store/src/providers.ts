import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';

export class DebugProvider extends WebrtcProvider {
  constructor(room: string, doc: Y.Doc) {
    super(room, doc, {
      signaling: [
        'ws://localhost:4444',
        // 'wss://y-webrtc-signaling-us.herokuapp.com',
        // 'wss://y-webrtc-signaling-eu.herokuapp.com',
      ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  }
}
