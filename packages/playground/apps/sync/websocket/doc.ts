import { assertExists } from '@blocksuite/global/utils';
import type { DocSource } from '@blocksuite/sync';
import { diffUpdate, encodeStateVectorFromUpdate, mergeUpdates } from 'yjs';

import type { WebSocketMessage } from './types';

export class WebSocketDocSource implements DocSource {
  name = 'websocket';

  docMap = new Map<string, Uint8Array>();

  constructor(readonly ws: WebSocket) {
    this.ws.addEventListener('message', this._onMessage);

    this.ws.send(
      JSON.stringify({
        channel: 'doc',
        payload: {
          type: 'init',
        },
      } satisfies WebSocketMessage)
    );
  }

  async pull(
    docId: string,
    state: Uint8Array
  ): Promise<{ data: Uint8Array; state?: Uint8Array | undefined } | null> {
    const update = this.docMap.get(docId);
    if (!update) return null;

    const diff = state.length ? diffUpdate(update, state) : update;
    return { data: diff, state: encodeStateVectorFromUpdate(update) };
  }

  async push(docId: string, data: Uint8Array): Promise<void> {
    const update = this.docMap.get(docId);
    if (update) {
      this.docMap.set(docId, mergeUpdates([update, data]));
    } else {
      this.docMap.set(docId, data);
    }

    const latest = this.docMap.get(docId);
    assertExists(latest);
    this.ws.send(
      JSON.stringify({
        channel: 'doc',
        payload: {
          type: 'update',
          docId,
          updates: Array.from(latest),
        },
      } satisfies WebSocketMessage)
    );
  }

  async subscribe(cb: (docId: string, data: Uint8Array) => void) {
    const abortController = new AbortController();
    this.ws.addEventListener(
      'message',
      (event: MessageEvent<string>) => {
        const data = JSON.parse(event.data) as WebSocketMessage;

        if (data.channel !== 'doc' || data.payload.type !== 'update') return;

        const { docId, updates } = data.payload;
        cb(docId, new Uint8Array(updates));
      },
      { signal: abortController.signal }
    );
    return () => {
      abortController.abort();
    };
  }

  private _onMessage = (event: MessageEvent<string>) => {
    const data = JSON.parse(event.data) as WebSocketMessage;

    if (data.channel !== 'doc') return;

    if (data.payload.type === 'init') {
      for (const [docId, data] of this.docMap) {
        this.ws.send(
          JSON.stringify({
            channel: 'doc',
            payload: {
              type: 'update',
              docId,
              updates: Array.from(data),
            },
          } satisfies WebSocketMessage)
        );
      }
      return;
    }

    const { docId, updates } = data.payload;
    const update = this.docMap.get(docId);
    if (update) {
      this.docMap.set(docId, mergeUpdates([update, new Uint8Array(updates)]));
    } else {
      this.docMap.set(docId, new Uint8Array(updates));
    }
  };
}
