import { mergeUpdates, type SyncStorage } from '@blocksuite/sync';

export type Protocol =
  | {
      type: 'pull';
      docId: string;
    }
  | {
      type: 'data';
      docId: string;
      data: Uint8Array;
    }
  | {
      type: 'dump';
    };

export interface Channel {
  on(listener: (payload: Protocol) => void): void;
  send(payload: Protocol): void;
}

export class ChannelPeer implements SyncStorage {
  name = 'channel-peer';

  memoryStorage: Map<string, Uint8Array> = new Map();

  listeners = new Set<(docId: string, data: Uint8Array) => void>();

  constructor(private readonly channel: Channel) {
    channel.on(payload => {
      // handle incoming messages
      if (payload.type === 'pull') {
        // handle request of pulling data
        const data = this.memoryStorage.get(payload.docId);

        channel.send({
          type: 'data',
          docId: payload.docId,
          data: data ?? new Uint8Array(),
        });
      } else if (payload.type === 'data' && payload.data) {
        // handle request of pushing data
        const oldData = this.memoryStorage.get(payload.docId);
        const newData = oldData
          ? mergeUpdates([oldData, payload.data])
          : payload.data;
        this.memoryStorage.set(payload.docId, newData);
        for (const listener of this.listeners) {
          listener(payload.docId, newData);
        }
      } else if (payload.type === 'dump') {
        // handle request of dumping all data
        for (const [docId, data] of this.memoryStorage) {
          channel.send({
            type: 'data',
            docId: docId,
            data: data,
          });
        }
      }
    });
    channel.send({ type: 'dump' });
  }

  async push(docId: string, data: Uint8Array): Promise<void> {
    const oldData = this.memoryStorage.get(docId);
    const newData = oldData ? mergeUpdates([oldData, data]) : data;
    this.memoryStorage.set(docId, newData);

    // tell the other side about the new data
    this.channel.send({
      type: 'data',
      docId: docId,
      data: newData,
    });
  }

  async pull(
    docId: string,
    _state: Uint8Array
  ): Promise<{ data: Uint8Array; state?: Uint8Array | undefined } | null> {
    const data = this.memoryStorage.get(docId);
    return data ? { data } : null;
  }

  async subscribe(
    cb: (docId: string, data: Uint8Array) => void,
    _: (reason: string) => void
  ): Promise<() => void> {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }
}
