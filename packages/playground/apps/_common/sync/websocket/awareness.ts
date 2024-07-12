import type { AwarenessSource } from '@blocksuite/sync';
import type { Awareness } from 'y-protocols/awareness';

import { assertExists } from '@blocksuite/global/utils';
import {
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
} from 'y-protocols/awareness';

import type { WebSocketMessage } from './types';

type AwarenessChanges = Record<'added' | 'updated' | 'removed', number[]>;

export class WebSocketAwarenessSource implements AwarenessSource {
  private _onAwareness = (changes: AwarenessChanges, origin: unknown) => {
    if (origin === 'remote') return;

    const changedClients = Object.values(changes).reduce((res, cur) =>
      res.concat(cur)
    );

    assertExists(this.awareness);
    const update = encodeAwarenessUpdate(this.awareness, changedClients);
    this.ws.send(
      JSON.stringify({
        channel: 'awareness',
        payload: {
          type: 'update',
          update: Array.from(update),
        },
      } satisfies WebSocketMessage)
    );
  };

  private _onWebSocket = (event: MessageEvent<string>) => {
    const data = JSON.parse(event.data) as WebSocketMessage;

    if (data.channel !== 'awareness') return;
    const { type } = data.payload;

    if (type === 'update') {
      const update = data.payload.update;
      assertExists(this.awareness);
      applyAwarenessUpdate(this.awareness, new Uint8Array(update), 'remote');
    }

    if (type === 'connect') {
      assertExists(this.awareness);
      this.ws.send(
        JSON.stringify({
          channel: 'awareness',
          payload: {
            type: 'update',
            update: Array.from(
              encodeAwarenessUpdate(this.awareness, [this.awareness.clientID])
            ),
          },
        } satisfies WebSocketMessage)
      );
    }
  };

  awareness: Awareness | null = null;

  constructor(readonly ws: WebSocket) {}

  connect(awareness: Awareness): void {
    this.awareness = awareness;
    awareness.on('update', this._onAwareness);

    this.ws.addEventListener('message', this._onWebSocket);
    this.ws.send(
      JSON.stringify({
        channel: 'awareness',
        payload: {
          type: 'connect',
        },
      } satisfies WebSocketMessage)
    );
  }

  disconnect(): void {
    this.awareness?.off('update', this._onAwareness);
    this.ws.close();
  }
}
