import { Doc, DocCollection, Slot } from '@blocksuite/store';
import { WebsocketProvider } from 'y-websocket';
import { ApiClient } from './api';
import { createCollection } from './utils';
import { createDoc } from './utils';

export class Provider {
  apiClient: ApiClient;

  ws: WebsocketProvider | null = null;

  token!: string;

  slots = {
    connectStatusChanged: new Slot<'connected' | 'disconnected' | 'error'>(),
    docSync: new Slot<Doc>(),
  };

  collection: DocCollection;

  currentRoom: string | null = null;

  private _initialized: boolean = false;
  private _previousTitles = new Map<string, string>();

  constructor(
    backendBaseUrl: string,
    private readonly wsBaseUrl: string
  ) {
    this.apiClient = new ApiClient(backendBaseUrl);
    this.collection = createCollection();
  }

  async init() {
    if (this._initialized) return this;

    this.token = await this.apiClient.getAuth();

    const docMetaInfos = await this.apiClient.getDocMetas();

    docMetaInfos.map(docMeta => {
      this.collection.createDoc({ id: docMeta.id });
      this.collection.setDocMeta(docMeta.id, { ...docMeta });
      this._previousTitles.set(docMeta.id, docMeta.title);
    });

    this.collection.meta.docMetaUpdated.on(() =>
      this._handleTitleUpdateEvent()
    );

    this._initialized = true;

    return this;
  }

  connect(room: string) {
    if (!this._initialized) {
      throw new Error('Not initialized');
    }

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

  async createDoc() {
    if (!this._initialized) {
      throw new Error('Not initialized');
    }

    const docMetaInfo = await this.apiClient.createDoc();

    const doc = createDoc(this.collection, docMetaInfo.id);
    this.collection.setDocMeta(docMetaInfo.id, { ...docMetaInfo });

    return doc;
  }

  async deleteDoc(docId: string) {
    if (!this._initialized) {
      throw new Error('Not initialized');
    }

    if (this.collection.getDoc(docId) === null) {
      throw new Error(`Unkown doc: ${docId}`);
    }

    this.apiClient.deleteDoc(docId);
    this.collection.removeDoc(docId);
  }

  private _handleTitleUpdateEvent() {
    const newDocMetas = this.collection.meta.docMetas;
    newDocMetas.forEach(({ id, title }) => {
      if (
        this._previousTitles.has(id) &&
        this._previousTitles.get(id) !== title
      ) {
        this.apiClient.updateTitle(id, title);
      }
    });

    this._previousTitles.clear();
    newDocMetas.forEach(({ id, title }) => this._previousTitles.set(id, title));
  }
}
