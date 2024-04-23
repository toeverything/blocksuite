import { Doc, DocCollection, Slot } from '@blocksuite/store';
import { WebsocketProvider } from 'y-websocket';
import { initCollection } from './utils';

export type ConnectionStatus = 'connected' | 'disconnected' | 'error';

export class Provider {
  metaWs: WebsocketProvider;
  docWs: WebsocketProvider | null = null;

  slots = {
    connectStatusChanged: new Slot<ConnectionStatus>(),
    docSync: new Slot<Doc>(),
  };

  private constructor(
    readonly wsBaseUrl: string,
    public collection: DocCollection,
    metaWs: WebsocketProvider
  ) {
    this.metaWs = metaWs;
  }

  static async init(wsBaseUrl: string) {
    const collection = initCollection();
    const metaWs = new WebsocketProvider(
      wsBaseUrl,
      collection.id,
      collection.doc
    );

    // Make sure all document meta information is loaded.
    await new Promise<void>((resolve, reject) => {
      metaWs.once('sync', () => {
        collection.doc.load();
        resolve();
      });
      metaWs.once('connection-error', () => {
        reject();
      });
    });

    return new Provider(wsBaseUrl, collection, metaWs);
  }

  connect(room: string) {
    if (this.docWs?.roomname === room) return;

    this.docWs?.destroy();

    const doc = this.collection.getDoc(room)!;

    this.docWs = new WebsocketProvider(this.wsBaseUrl, room, doc.spaceDoc);

    this.docWs.on('status', (e: { status: 'connected' | 'disconnected' }) => {
      this.slots.connectStatusChanged.emit(e.status);
    });

    this.docWs.once('connection-error', () => {
      this.slots.connectStatusChanged.emit('error');
    });

    this.docWs.on('sync', () => {
      this.slots.docSync.emit(doc);
    });

    this.docWs.connect();
  }
}
