import * as Y from 'yjs';
import { WebrtcProvider as DebugProvider } from 'y-webrtc';

let i = 0;
let created = false;

export class Store {
  doc = new Y.Doc();
  provider = new DebugProvider('virgo-demo', this.doc);
  history = new Y.UndoManager([], {
    trackedOrigins: new Set([this.doc.clientID]),
    doc: this.doc,
  });
  containers: unknown[] = [];

  constructor() {
    if (created) {
      throw new Error('Store should only be created once');
    }
    created = true;
  }

  getId(): string {
    return (i++).toString();
  }
}
