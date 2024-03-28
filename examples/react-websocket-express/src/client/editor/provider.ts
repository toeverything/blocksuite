import { Doc, DocCollection, Slot } from '@blocksuite/store';
import { WebsocketProvider } from 'y-websocket';
import * as api from './api';
import { initCollection } from './utils';

export class Provider {
  ws: WebsocketProvider | null = null;

  slots = {
    connectStatusChanged: new Slot<'connected' | 'disconnected' | 'error'>(),
    docSync: new Slot<Doc>(),
  };

  currentRoom: string | null = null;

  private _previousTitles = new Map<string, string>();

  private constructor(
    private readonly wsBaseUrl: string,
    private token: string,
    public collection: DocCollection
  ) {
    this.collection.meta.docMetas.forEach(({ id, title }) => {
      this._previousTitles.set(id, title);
    });

    this.collection.slots.docAdded.on(docId => {
      api.createDoc(this.collection.meta.getDocMeta(docId)!);
    });

    this.collection.slots.docRemoved.on(docId => {
      api.deleteDoc(docId);
    });

    collection.slots.docUpdated.on(() => this._handleTitleUpdateEvent());
  }

  static async init(wsBaseUrl: string) {
    const token = await api.getAuth();
    const collection = await initCollection();
    return new Provider(wsBaseUrl, token, collection);
  }

  connect(room: string) {
    if (this.currentRoom === room) return;

    this.ws?.destroy();

    const doc = this.collection.getDoc(room)!;

    this.ws = new WebsocketProvider(this.wsBaseUrl, room, doc.spaceDoc, {
      params: { yauth: this.token },
      connect: false,
    });

    this.ws.on('status', (e: { status: 'connected' | 'disconnected' }) => {
      this.slots.connectStatusChanged.emit(e.status);
    });

    this.ws.once('connection-error', () => {
      this.slots.connectStatusChanged.emit('error');
    });

    this.ws.on('sync', () => {
      this.slots.docSync.emit(doc);
    });

    this.ws.connect();
  }

  private _handleTitleUpdateEvent() {
    const newDocMetas = this.collection.meta.docMetas;
    newDocMetas.forEach(({ id, title }) => {
      if (
        this._previousTitles.has(id) &&
        this._previousTitles.get(id) !== title
      ) {
        api.updateTitle(id, title);
      }
    });

    this._previousTitles.clear();
    newDocMetas.forEach(({ id, title }) => this._previousTitles.set(id, title));
  }
}
