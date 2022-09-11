import * as Y from 'yjs';

export class Store {
  doc = new Y.Doc();
  history = new Y.UndoManager([], {
    trackedOrigins: new Set([this.doc.clientID]),
    doc: this.doc,
  });
  containers: unknown[] = [];
}
